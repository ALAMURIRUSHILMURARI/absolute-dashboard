import { Router, Response } from 'express';
import { db } from '../services/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getFinancialOverview, getAllPeopleSummaries } from '../services/ledger.js';

const router = Router();

// GET /api/v1/analytics
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const overview = getFinancialOverview(userId);
    const peopleSummaries = getAllPeopleSummaries(userId);

    const userTxs = db.transactions.filter(t => t.userId === userId);
    const userSchedules = db.schedules.filter(s => s.userId === userId);

    // Monthly flow breakdown (Past 6 months)
    const monthlyMap: { [key: string]: { month: string; moneyIn: number; moneyOut: number; count: number } } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyMap[key] = { month: label, moneyIn: 0, moneyOut: 0, count: 0 };
    }

    for (const tx of userTxs) {
      const ym = tx.date.slice(0, 7);
      if (monthlyMap[ym]) {
        monthlyMap[ym].count++;
        if (tx.direction === 'THEY_OWE_ME') {
          monthlyMap[ym].moneyIn += tx.amount;
        } else {
          monthlyMap[ym].moneyOut += tx.amount;
        }
      }
    }

    const monthlyTrends = Object.values(monthlyMap);

    // Active tabs (Sorted by absolute net balance or transaction volume)
    const activeTabs = [...peopleSummaries]
      .sort((a, b) => (Math.abs(b.netBalance) + b.totalTransactionsCount * 100) - (Math.abs(a.netBalance) + a.totalTransactionsCount * 100))
      .slice(0, 5)
      .map(p => ({
        id: p.person.id,
        name: p.person.name,
        relationship: p.person.relationship,
        avatar: p.person.avatar,
        youOwe: p.youOwe,
        theyOweYou: p.theyOweYou,
        netBalance: p.netBalance,
        transactionsCount: p.totalTransactionsCount,
      }));

    // Status breakdown (Settled vs Pending vs Partial vs Overdue)
    let settledCount = 0;
    let pendingCount = 0;
    let partialCount = 0;
    let overdueCount = 0;

    for (const tx of userTxs) {
      if (tx.status === 'Settled') settledCount++;
      else if (tx.status === 'Overdue') overdueCount++;
      else if (tx.status === 'Partial') partialCount++;
      else pendingCount++;
    }

    // Schedule categories distribution
    const categoryCounts: { [key: string]: number } = {};
    for (const sch of userSchedules) {
      categoryCounts[sch.category] = (categoryCounts[sch.category] || 0) + 1;
    }

    return res.json({
      overview,
      monthlyTrends,
      activeTabs,
      statusBreakdown: [
        { name: 'Settled', value: settledCount, color: '#10b981' },
        { name: 'Pending', value: pendingCount, color: '#3b82f6' },
        { name: 'Partial', value: partialCount, color: '#f59e0b' },
        { name: 'Overdue', value: overdueCount, color: '#ef4444' },
      ],
      categoryCounts,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch analytics' });
  }
});

export default router;
