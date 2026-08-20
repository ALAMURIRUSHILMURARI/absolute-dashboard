import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { DailyPayment, DailyPaymentMethod, DailyPaymentFlow, DailyPaymentCategory } from '../models/types.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/daily-payments
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { date, startDate, endDate, method, flow, search } = req.query;

    let payments = db.dailyPayments.filter(p => p.userId === userId);

    if (date) {
      payments = payments.filter(p => p.date === date);
    }
    if (startDate) {
      payments = payments.filter(p => p.date >= (startDate as string));
    }
    if (endDate) {
      payments = payments.filter(p => p.date <= (endDate as string));
    }
    if (method && (method === 'UPI' || method === 'Cash')) {
      payments = payments.filter(p => p.paymentMethod === method);
    }
    if (flow && (flow === 'OUTGOING' || flow === 'INCOMING')) {
      payments = payments.filter(p => (p.flow || 'OUTGOING') === flow);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      payments = payments.filter(
        p =>
          p.reason.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Sort by date descending, then time/createdAt descending
    payments.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.time || '').localeCompare(a.time || '') || b.createdAt.localeCompare(a.createdAt);
    });

    return res.json({ payments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch daily payments' });
  }
});

// GET /api/v1/daily-payments/summary
router.get('/summary', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.slice(0, 7); // YYYY-MM

    const allUserPayments = db.dailyPayments.filter(p => p.userId === userId);

    let todayOutgoing = 0;
    let todayIncoming = 0;
    let todayUpi = 0;
    let todayCash = 0;
    let todayCount = 0;

    let monthOutgoing = 0;
    let monthIncoming = 0;
    let monthUpi = 0;
    let monthCash = 0;

    const categoryMap: Record<string, number> = {};
    const dateTotalsMap: Record<
      string,
      { outgoing: number; incoming: number; net: number; upi: number; cash: number; count: number }
    > = {};

    for (const p of allUserPayments) {
      const amt = p.amount || 0;
      const flow: DailyPaymentFlow = p.flow || 'OUTGOING';

      // Group per date
      if (!dateTotalsMap[p.date]) {
        dateTotalsMap[p.date] = { outgoing: 0, incoming: 0, net: 0, upi: 0, cash: 0, count: 0 };
      }
      dateTotalsMap[p.date].count += 1;

      if (flow === 'INCOMING') {
        dateTotalsMap[p.date].incoming += amt;
        dateTotalsMap[p.date].net += amt;
      } else {
        dateTotalsMap[p.date].outgoing += amt;
        dateTotalsMap[p.date].net -= amt;
      }

      if (p.paymentMethod === 'UPI') {
        dateTotalsMap[p.date].upi += amt;
      } else {
        dateTotalsMap[p.date].cash += amt;
      }

      // Today stats
      if (p.date === todayStr) {
        todayCount += 1;
        if (flow === 'INCOMING') {
          todayIncoming += amt;
        } else {
          todayOutgoing += amt;
        }

        if (p.paymentMethod === 'UPI') todayUpi += amt;
        else todayCash += amt;
      }

      // Month stats
      if (p.date.startsWith(currentMonthPrefix)) {
        if (flow === 'INCOMING') {
          monthIncoming += amt;
        } else {
          monthOutgoing += amt;
        }

        if (p.paymentMethod === 'UPI') monthUpi += amt;
        else monthCash += amt;

        const cat = p.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      }
    }

    return res.json({
      today: {
        date: todayStr,
        outgoing: todayOutgoing,
        incoming: todayIncoming,
        net: todayIncoming - todayOutgoing,
        total: todayOutgoing, // for backwards compatibility
        upi: todayUpi,
        cash: todayCash,
        count: todayCount,
      },
      month: {
        month: currentMonthPrefix,
        outgoing: monthOutgoing,
        incoming: monthIncoming,
        net: monthIncoming - monthOutgoing,
        total: monthOutgoing,
        upi: monthUpi,
        cash: monthCash,
      },
      categoryBreakdown: Object.entries(categoryMap).map(([category, amount]) => ({
        category,
        amount,
      })),
      dateTotals: dateTotalsMap,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to calculate summary' });
  }
});

// POST /api/v1/daily-payments (Single entry)
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      amount,
      reason,
      paymentMethod = 'UPI',
      flow = 'OUTGOING',
      date,
      time,
      category = 'Food & Dining',
      notes,
    } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason for payment is required' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toTimeString().slice(0, 5);

    const validMethod: DailyPaymentMethod = paymentMethod === 'Cash' ? 'Cash' : 'UPI';
    const validFlow: DailyPaymentFlow = flow === 'INCOMING' ? 'INCOMING' : 'OUTGOING';

    const newPayment: DailyPayment = {
      id: uuidv4(),
      userId,
      amount: parseFloat(amount),
      reason: reason.trim(),
      paymentMethod: validMethod,
      flow: validFlow,
      date: date || todayStr,
      time: time || nowTimeStr,
      category: category as DailyPaymentCategory,
      notes: notes ? notes.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.dailyPayments.push(newPayment);
    db.save();

    return res.status(201).json({ payment: newPayment });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create daily payment' });
  }
});

// POST /api/v1/daily-payments/bulk (Batch upload)
router.post('/bulk', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { items, date } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Array of payment items is required' });
    }

    const defaultDate = date || new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);
    const createdList: DailyPayment[] = [];

    for (const item of items) {
      if (!item.amount || parseFloat(item.amount) <= 0 || !item.reason) continue;

      const p: DailyPayment = {
        id: uuidv4(),
        userId,
        amount: parseFloat(item.amount),
        reason: item.reason.trim(),
        paymentMethod: item.paymentMethod === 'Cash' ? 'Cash' : 'UPI',
        flow: item.flow === 'INCOMING' ? 'INCOMING' : 'OUTGOING',
        date: item.date || defaultDate,
        time: item.time || nowTime,
        category: item.category || 'Other',
        notes: item.notes ? item.notes.trim() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createdList.push(p);
    }

    if (createdList.length === 0) {
      return res.status(400).json({ error: 'No valid items found to create' });
    }

    db.dailyPayments.push(...createdList);
    db.save();

    return res.status(201).json({
      message: `Successfully recorded ${createdList.length} daily transactions`,
      payments: createdList,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to bulk upload payments' });
  }
});

// PUT /api/v1/daily-payments/:id
router.put('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, reason, paymentMethod, flow, date, time, category, notes } = req.body;

    const idx = db.dailyPayments.findIndex(p => p.id === id && p.userId === userId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const existing = db.dailyPayments[idx];
    if (amount !== undefined) existing.amount = parseFloat(amount);
    if (reason !== undefined) existing.reason = reason.trim();
    if (paymentMethod !== undefined) existing.paymentMethod = paymentMethod === 'Cash' ? 'Cash' : 'UPI';
    if (flow !== undefined) existing.flow = flow === 'INCOMING' ? 'INCOMING' : 'OUTGOING';
    if (date !== undefined) existing.date = date;
    if (time !== undefined) existing.time = time;
    if (category !== undefined) existing.category = category;
    if (notes !== undefined) existing.notes = notes;
    existing.updatedAt = new Date().toISOString();

    db.save();

    return res.json({ payment: existing });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update daily payment' });
  }
});

// DELETE /api/v1/daily-payments/:id
router.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const idx = db.dailyPayments.findIndex(p => p.id === id && p.userId === userId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    db.dailyPayments.splice(idx, 1);
    db.save();

    return res.json({ message: 'Daily payment deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete daily payment' });
  }
});

export default router;
