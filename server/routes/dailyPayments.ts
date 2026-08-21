import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { isMongoConnected } from '../services/mongo.js';
import { DailyPaymentModel } from '../models/mongooseSchemas.js';
import { DailyPayment, DailyPaymentMethod, DailyPaymentFlow, DailyPaymentCategory } from '../models/types.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getLocalDateString, parseNumericAmount } from '../services/date.js';

const router = Router();

// Helper to fetch user payments from Mongo or JsonDB
const fetchUserPayments = async (userId: string): Promise<DailyPayment[]> => {
  if (isMongoConnected()) {
    const docs = await DailyPaymentModel.find({ userId }).lean();
    return docs.map(d => ({
      id: d.id,
      userId: d.userId,
      amount: d.amount,
      reason: d.reason,
      paymentMethod: d.paymentMethod,
      flow: d.flow,
      date: d.date,
      time: d.time,
      category: d.category,
      notes: d.notes,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
    })) as DailyPayment[];
  }
  return db.dailyPayments.filter(p => p.userId === userId);
};

// GET /api/v1/daily-payments
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { date, startDate, endDate, method, flow, search } = req.query;

    let payments = await fetchUserPayments(userId);

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

    return res.json({ payments, totalCount: payments.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch daily payments' });
  }
});

// GET /api/v1/daily-payments/summary
router.get('/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const todayStr = getLocalDateString(new Date());
    const currentMonthPrefix = todayStr.slice(0, 7); // YYYY-MM

    const allUserPayments = await fetchUserPayments(userId);

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
        if (p.paymentMethod === 'Cash') todayCash += amt;
      }

      // Month stats
      if (p.date.startsWith(currentMonthPrefix)) {
        if (flow === 'INCOMING') {
          monthIncoming += amt;
        } else {
          monthOutgoing += amt;
          // Track expense categories
          const cat = p.category || 'Other';
          categoryMap[cat] = (categoryMap[cat] || 0) + amt;
        }
        if (p.paymentMethod === 'UPI') monthUpi += amt;
        if (p.paymentMethod === 'Cash') monthCash += amt;
      }
    }

    const todayNet = todayIncoming - todayOutgoing;
    const monthNet = monthIncoming - monthOutgoing;

    return res.json({
      today: {
        date: todayStr,
        outgoing: todayOutgoing,
        incoming: todayIncoming,
        net: todayNet,
        total: todayOutgoing,
        upi: todayUpi,
        cash: todayCash,
        count: todayCount,
      },
      month: {
        month: currentMonthPrefix,
        outgoing: monthOutgoing,
        incoming: monthIncoming,
        net: monthNet,
        total: monthOutgoing,
        upi: monthUpi,
        cash: monthCash,
      },
      categories: categoryMap,
      dateTotals: dateTotalsMap,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch summary' });
  }
});

// POST /api/v1/daily-payments
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, reason, paymentMethod, flow, date, time, category, notes } = req.body;

    const parsedAmt = parseNumericAmount(amount);
    if (parsedAmt <= 0) {
      return res.status(400).json({ error: 'Valid positive amount is required' });
    }
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ error: 'Reason / description is required' });
    }
    if (paymentMethod && paymentMethod !== 'UPI' && paymentMethod !== 'Cash') {
      return res.status(400).json({ error: 'Payment method must be UPI or Cash' });
    }

    const now = new Date();
    const paymentDate = date && typeof date === 'string' && date.trim() ? date.trim() : getLocalDateString(now);

    const newPayment: DailyPayment = {
      id: uuidv4(),
      userId,
      amount: parsedAmt,
      reason: reason.trim(),
      paymentMethod: paymentMethod || 'UPI',
      flow: flow === 'INCOMING' ? 'INCOMING' : 'OUTGOING',
      date: paymentDate,
      time: time || now.toTimeString().slice(0, 5),
      category: category || (flow === 'INCOMING' ? 'Income & Salary' : 'Other'),
      notes: notes && typeof notes === 'string' ? notes.trim() : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (isMongoConnected()) {
      await DailyPaymentModel.create(newPayment);
    } else {
      db.dailyPayments.push(newPayment);
      db.save();
    }

    return res.status(201).json({ payment: newPayment });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to record daily payment' });
  }
});

// POST /api/v1/daily-payments/bulk
router.post('/bulk', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { date, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required for bulk upload' });
    }

    const now = new Date();
    const createdPayments: DailyPayment[] = [];

    for (const item of items) {
      const parsedAmt = parseNumericAmount(item.amount);
      if (parsedAmt <= 0 || !item.reason || !item.reason.trim()) continue;

      const pDate = item.date || date || getLocalDateString(now);

      const p: DailyPayment = {
        id: item.id || uuidv4(),
        userId,
        amount: parsedAmt,
        reason: item.reason.trim(),
        paymentMethod: item.paymentMethod === 'Cash' ? 'Cash' : 'UPI',
        flow: item.flow === 'INCOMING' ? 'INCOMING' : 'OUTGOING',
        date: pDate,
        time: item.time || now.toTimeString().slice(0, 5),
        category: item.category || 'Other',
        notes: item.notes ? String(item.notes).trim() : undefined,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      createdPayments.push(p);
    }

    if (createdPayments.length === 0) {
      return res.status(400).json({ error: 'No valid payment entries found in bulk payload' });
    }

    const finalInserted: DailyPayment[] = [];
    if (isMongoConnected()) {
      for (const p of createdPayments) {
        // Prevent duplicate insertion if an entry with same ID or content already exists
        const exists = await DailyPaymentModel.findOne({
          $or: [
            { id: p.id },
            { userId: p.userId, date: p.date, reason: p.reason, amount: p.amount, flow: p.flow },
          ],
        });
        if (!exists) {
          await DailyPaymentModel.create(p);
          finalInserted.push(p);
        }
      }
    } else {
      for (const p of createdPayments) {
        const exists = db.dailyPayments.some(
          ep => ep.id === p.id || (ep.userId === p.userId && ep.date === p.date && ep.reason === p.reason && ep.amount === p.amount)
        );
        if (!exists) {
          db.dailyPayments.push(p);
          finalInserted.push(p);
        }
      }
      db.save();
    }

    return res.status(201).json({
      message: `Successfully processed daily payments`,
      payments: finalInserted.length > 0 ? finalInserted : createdPayments,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Bulk upload failed' });
  }
});

// PUT /api/v1/daily-payments/:id
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (isMongoConnected()) {
      const existing = await DailyPaymentModel.findOne({ id, userId });
      if (!existing) {
        return res.status(404).json({ error: 'Daily payment record not found' });
      }

      const { amount, reason, paymentMethod, flow, date, category, notes } = req.body;
      if (amount !== undefined) {
        const parsedAmt = parseNumericAmount(amount);
        if (parsedAmt <= 0) return res.status(400).json({ error: 'Valid amount is required' });
        existing.amount = parsedAmt;
      }
      if (reason !== undefined) existing.reason = reason.trim();
      if (paymentMethod !== undefined) existing.paymentMethod = paymentMethod;
      if (flow !== undefined) existing.flow = flow;
      if (date !== undefined) existing.date = date;
      if (category !== undefined) existing.category = category;
      if (notes !== undefined) existing.notes = notes;

      await existing.save();
      return res.json({ payment: existing });
    } else {
      const idx = db.dailyPayments.findIndex(p => p.id === id && p.userId === userId);
      if (idx === -1) {
        return res.status(404).json({ error: 'Daily payment record not found' });
      }

      const payment = db.dailyPayments[idx];
      const { amount, reason, paymentMethod, flow, date, category, notes } = req.body;

      if (amount !== undefined) {
        const parsedAmt = parseNumericAmount(amount);
        if (parsedAmt <= 0) return res.status(400).json({ error: 'Valid amount is required' });
        payment.amount = parsedAmt;
      }
      if (reason !== undefined) payment.reason = reason.trim();
      if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
      if (flow !== undefined) payment.flow = flow;
      if (date !== undefined) payment.date = date;
      if (category !== undefined) payment.category = category;
      if (notes !== undefined) payment.notes = notes;

      payment.updatedAt = new Date().toISOString();
      db.save();

      return res.json({ payment });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update daily payment' });
  }
});

// DELETE /api/v1/daily-payments/:id
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    let deletedCount = 0;

    if (isMongoConnected()) {
      // Find target payment to delete all duplicate instances with same date, amount, reason
      const target = await DailyPaymentModel.findOne({ id, userId });
      if (target) {
        const delRes = await DailyPaymentModel.deleteMany({
          userId,
          date: target.date,
          amount: target.amount,
          reason: target.reason,
        });
        deletedCount = delRes.deletedCount;
      } else {
        const delRes = await DailyPaymentModel.deleteMany({ id, userId });
        deletedCount = delRes.deletedCount;
      }
    }

    // Also remove from JsonDB memory
    const targetJson = db.dailyPayments.find(p => p.id === id && p.userId === userId);
    if (targetJson) {
      const filtered = db.dailyPayments.filter(
        p => !(p.userId === userId && p.date === targetJson.date && p.amount === targetJson.amount && p.reason === targetJson.reason)
      );
      db.dailyPayments.length = 0;
      db.dailyPayments.push(...filtered);
      db.save();
      deletedCount += 1;
    } else {
      const beforeLen = db.dailyPayments.length;
      const filtered = db.dailyPayments.filter(p => !(p.id === id && p.userId === userId));
      if (filtered.length < beforeLen) {
        db.dailyPayments.length = 0;
        db.dailyPayments.push(...filtered);
        db.save();
        deletedCount += 1;
      }
    }

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Daily payment record not found' });
    }

    return res.json({ message: 'Daily payment deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete daily payment' });
  }
});

export default router;
