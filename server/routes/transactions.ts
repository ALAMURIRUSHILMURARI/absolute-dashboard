import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { Transaction, TransactionDirection, TransactionType, PaymentMethod, TransactionStatus } from '../models/types.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { calculatePersonBalances } from '../services/ledger.js';

const router = Router();

// GET /api/v1/transactions
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { personId, status, direction, limit } = req.query;

    let txs = db.transactions.filter(t => t.userId === userId);

    if (personId) {
      txs = txs.filter(t => t.personId === personId);
    }
    if (status) {
      txs = txs.filter(t => t.status === status);
    }
    if (direction) {
      txs = txs.filter(t => t.direction === direction);
    }

    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (limit) {
      txs = txs.slice(0, parseInt(limit as string, 10));
    }

    return res.json({ transactions: txs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch transactions' });
  }
});

// POST /api/v1/transactions
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      personId,
      amount,
      direction, // 'THEY_OWE_ME' or 'I_OWE_THEM'
      type = 'Expense',
      description,
      date = new Date().toISOString().split('T')[0],
      paymentMethod = 'UPI',
      dueDate,
      notes,
    } = req.body;

    if (!personId || !amount || !direction || !description) {
      return res.status(400).json({ error: 'Person, amount, direction and description are required' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const person = db.people.find(p => p.id === personId && p.userId === userId);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let initialStatus: TransactionStatus = 'Pending';
    if (dueDate && dueDate < todayStr) {
      initialStatus = 'Overdue';
    }

    const newTx: Transaction = {
      id: uuidv4(),
      userId,
      personId,
      amount: numericAmount,
      direction,
      type,
      description: description.trim(),
      date,
      paymentMethod,
      status: initialStatus,
      dueDate: dueDate || undefined,
      notes: notes ? notes.trim() : undefined,
      originalAmount: numericAmount,
      paidAmount: 0,
      remainingAmount: numericAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.transactions.push(newTx);
    db.save();

    const updatedBalances = calculatePersonBalances(userId, personId);

    return res.status(201).json({
      transaction: newTx,
      balances: updatedBalances,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create transaction' });
  }
});

// POST /api/v1/transactions/settle (Settle Up endpoint for full or partial settlements)
router.post('/settle', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      personId,
      amount,
      paymentMethod = 'UPI',
      date = new Date().toISOString().split('T')[0],
      notes,
      specificTransactionId,
    } = req.body;

    if (!personId || !amount) {
      return res.status(400).json({ error: 'Person and settlement amount are required' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Settlement amount must be a positive number' });
    }

    const person = db.people.find(p => p.id === personId && p.userId === userId);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // Determine person's current balance
    const currentBalance = calculatePersonBalances(userId, personId);
    let remainingToSettle = numericAmount;

    // Settle target:
    // If net balance > 0, they owe me -> settlement payment direction is THEY_OWE_ME reducing transactions, or recorded as 'Payment'
    // If net balance < 0, I owe them -> settlement payment is me paying them
    const isPayingBackMe = currentBalance.netBalance > 0;
    const targetDirection: TransactionDirection = isPayingBackMe ? 'THEY_OWE_ME' : 'I_OWE_THEM';

    // Find pending/partial transactions in target direction to decrement
    const candidateTxs = db.transactions.filter(
      t => t.userId === userId &&
           t.personId === personId &&
           t.status !== 'Settled' &&
           (specificTransactionId ? t.id === specificTransactionId : t.direction === targetDirection)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const tx of candidateTxs) {
      if (remainingToSettle <= 0) break;

      const currentRemaining = tx.remainingAmount ?? tx.amount;
      const deduction = Math.min(currentRemaining, remainingToSettle);

      tx.paidAmount = (tx.paidAmount || 0) + deduction;
      tx.remainingAmount = Math.max(0, currentRemaining - deduction);
      if (tx.remainingAmount === 0) {
        tx.status = 'Settled';
      } else {
        tx.status = 'Partial';
      }
      tx.updatedAt = new Date().toISOString();
      remainingToSettle -= deduction;
    }

    // Create a settlement audit ledger transaction entry
    const settlementTx: Transaction = {
      id: uuidv4(),
      userId,
      personId,
      amount: numericAmount,
      direction: isPayingBackMe ? 'I_OWE_THEM' : 'THEY_OWE_ME', // counter-direction
      type: 'Payment',
      description: `Settlement payment via ${paymentMethod}`,
      date,
      paymentMethod,
      status: 'Settled',
      notes: notes ? notes.trim() : `Settled ${numericAmount} on ${date}`,
      originalAmount: numericAmount,
      paidAmount: numericAmount,
      remainingAmount: 0,
      isSettlement: true,
      settlementForId: specificTransactionId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.transactions.push(settlementTx);
    db.save();

    const newBalances = calculatePersonBalances(userId, personId);

    return res.json({
      message: 'Settlement recorded successfully',
      settlementTransaction: settlementTx,
      balances: newBalances,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Settlement failed' });
  }
});

// PUT /api/v1/transactions/:id
router.put('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, description, date, paymentMethod, status, dueDate, notes, type } = req.body;

    const txIdx = db.transactions.findIndex(t => t.id === id && t.userId === userId);
    if (txIdx === -1) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = db.transactions[txIdx];
    if (amount !== undefined) {
      const num = parseFloat(amount);
      if (!isNaN(num) && num > 0) {
        tx.amount = num;
        tx.originalAmount = num;
        tx.remainingAmount = Math.max(0, num - (tx.paidAmount || 0));
        if (tx.remainingAmount === 0) tx.status = 'Settled';
      }
    }
    if (description) tx.description = description.trim();
    if (date) tx.date = date;
    if (paymentMethod) tx.paymentMethod = paymentMethod;
    if (status) tx.status = status;
    if (type) tx.type = type;
    if (dueDate !== undefined) tx.dueDate = dueDate || undefined;
    if (notes !== undefined) tx.notes = notes ? notes.trim() : undefined;
    tx.updatedAt = new Date().toISOString();

    db.save();

    return res.json({ transaction: tx });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update transaction' });
  }
});

// DELETE /api/v1/transactions/:id
router.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const exists = db.transactions.some(t => t.id === id && t.userId === userId);
    if (!exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transactions = db.transactions.filter(t => !(t.id === id && t.userId === userId));
    db.replaceAll({ transactions });

    return res.json({ message: 'Transaction deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete transaction' });
  }
});

export default router;
