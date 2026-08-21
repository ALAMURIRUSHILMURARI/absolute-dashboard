import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { isMongoConnected } from '../services/mongo.js';
import { TransactionModel, PersonModel } from '../models/mongooseSchemas.js';
import { Transaction, TransactionDirection, TransactionType, PaymentMethod, TransactionStatus } from '../models/types.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { calculatePersonBalancesAsync, fetchUserTransactions, fetchUserPeople } from '../services/ledger.js';
import { getLocalDateString, parseNumericAmount } from '../services/date.js';

const router = Router();

// GET /api/v1/transactions
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { personId, status, direction, limit } = req.query;

    let txs = await fetchUserTransactions(userId);

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
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      personId,
      amount,
      direction,
      type = 'Expense',
      description,
      date = getLocalDateString(new Date()),
      paymentMethod = 'UPI',
      dueDate,
      notes,
    } = req.body;

    const numericAmount = parseNumericAmount(amount);

    if (!personId || numericAmount <= 0 || !direction || !description || !description.trim()) {
      return res.status(400).json({ error: 'Person, valid amount (> 0), direction and description are required' });
    }

    const people = await fetchUserPeople(userId);
    const person = people.find(p => p.id === personId);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const todayStr = getLocalDateString(new Date());
    let initialStatus: TransactionStatus = 'Pending';
    if (dueDate && dueDate < todayStr) {
      initialStatus = 'Overdue';
    }

    const now = new Date().toISOString();
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
      createdAt: now,
      updatedAt: now,
    };

    if (isMongoConnected()) {
      await TransactionModel.create(newTx);
    } else {
      db.transactions.push(newTx);
      db.save();
    }

    const updatedBalances = await calculatePersonBalancesAsync(userId, personId);

    return res.status(201).json({
      transaction: newTx,
      balances: updatedBalances,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create transaction' });
  }
});

// POST /api/v1/transactions/settle
router.post('/settle', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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

    const people = await fetchUserPeople(userId);
    const person = people.find(p => p.id === personId);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const currentBalance = await calculatePersonBalancesAsync(userId, personId);
    let remainingToSettle = numericAmount;

    const isPayingBackMe = currentBalance.netBalance > 0;
    const targetDirection: TransactionDirection = isPayingBackMe ? 'THEY_OWE_ME' : 'I_OWE_THEM';

    const candidateTxs = currentBalance.transactions
      .filter(
        t => t.status !== 'Settled' && (specificTransactionId ? t.id === specificTransactionId : t.direction === targetDirection)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const tx of candidateTxs) {
      if (remainingToSettle <= 0) break;

      const currentRemaining = tx.remainingAmount ?? tx.amount;
      const deduction = Math.min(currentRemaining, remainingToSettle);

      const paidAmount = (tx.paidAmount || 0) + deduction;
      const remainingAmount = Math.max(0, currentRemaining - deduction);
      const status: TransactionStatus = remainingAmount === 0 ? 'Settled' : 'Partial';

      if (isMongoConnected()) {
        await TransactionModel.updateOne(
          { id: tx.id, userId },
          { paidAmount, remainingAmount, status, updatedAt: new Date().toISOString() }
        );
      } else {
        const memTx = db.transactions.find(t => t.id === tx.id && t.userId === userId);
        if (memTx) {
          memTx.paidAmount = paidAmount;
          memTx.remainingAmount = remainingAmount;
          memTx.status = status;
          memTx.updatedAt = new Date().toISOString();
        }
      }

      remainingToSettle -= deduction;
    }

    const now = new Date().toISOString();
    const settlementTx: Transaction = {
      id: uuidv4(),
      userId,
      personId,
      amount: numericAmount,
      direction: isPayingBackMe ? 'I_OWE_THEM' : 'THEY_OWE_ME',
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
      createdAt: now,
      updatedAt: now,
    };

    if (isMongoConnected()) {
      await TransactionModel.create(settlementTx);
    } else {
      db.transactions.push(settlementTx);
      db.save();
    }

    const newBalances = await calculatePersonBalancesAsync(userId, personId);

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
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, description, date, paymentMethod, status, dueDate, notes, type } = req.body;

    if (isMongoConnected()) {
      const existing = await TransactionModel.findOne({ id, userId });
      if (!existing) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (amount !== undefined) {
        const num = parseFloat(amount);
        if (!isNaN(num) && num > 0) {
          existing.amount = num;
          existing.originalAmount = num;
          existing.remainingAmount = Math.max(0, num - (existing.paidAmount || 0));
          if (existing.remainingAmount === 0) existing.status = 'Settled';
        }
      }
      if (description) existing.description = description.trim();
      if (date) existing.date = date;
      if (paymentMethod) existing.paymentMethod = paymentMethod;
      if (status) existing.status = status;
      if (type) existing.type = type;
      if (dueDate !== undefined) existing.dueDate = dueDate || undefined;
      if (notes !== undefined) existing.notes = notes ? notes.trim() : undefined;

      await existing.save();
      return res.json({ transaction: existing });
    } else {
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
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update transaction' });
  }
});

// DELETE /api/v1/transactions/:id
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (isMongoConnected()) {
      await TransactionModel.deleteOne({ id, userId });
    }

    const transactions = db.transactions.filter(t => !(t.id === id && t.userId === userId));
    db.replaceAll({ transactions });

    return res.json({ message: 'Transaction deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete transaction' });
  }
});

export default router;
