import { Router, Response } from 'express';
import { db } from '../services/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { Transaction } from '../models/types.js';

const router = Router();

export interface DueItem {
  transaction: Transaction;
  personName: string;
  personAvatar?: string;
  personRelationship: string;
  dueStatus: 'Overdue' | 'Due Today' | 'Due Soon' | 'Settled' | 'No Due Date';
  daysDifference: number; // positive = days until due, negative = days overdue
}

// GET /api/v1/dues
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { filter, sortBy } = req.query; // filter: all, due_soon, due_today, overdue, settled

    const userPeopleMap = new Map(
      db.people.filter(p => p.userId === userId).map(p => [p.id, p])
    );

    const userTxs = db.transactions.filter(t => t.userId === userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStr = today.toISOString().split('T')[0];

    const mapDueItem = (tx: Transaction): DueItem => {
      const person = userPeopleMap.get(tx.personId);
      let dueStatus: DueItem['dueStatus'] = 'No Due Date';
      let daysDifference = 999;

      if (tx.status === 'Settled') {
        dueStatus = 'Settled';
      } else if (tx.dueDate) {
        const dueDateObj = new Date(tx.dueDate);
        dueDateObj.setHours(0, 0, 0, 0);
        const diffTime = dueDateObj.getTime() - today.getTime();
        daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysDifference < 0) {
          dueStatus = 'Overdue';
        } else if (daysDifference === 0) {
          dueStatus = 'Due Today';
        } else if (daysDifference <= 7) {
          dueStatus = 'Due Soon';
        } else {
          dueStatus = 'No Due Date';
        }
      }

      return {
        transaction: tx,
        personName: person ? person.name : 'Unknown Person',
        personAvatar: person ? person.avatar : undefined,
        personRelationship: person ? person.relationship : 'Other',
        dueStatus,
        daysDifference,
      };
    };

    let iOweList: DueItem[] = [];
    let theyOweMeList: DueItem[] = [];

    for (const tx of userTxs) {
      const item = mapDueItem(tx);

      // Apply filter
      if (filter === 'due_today' && item.dueStatus !== 'Due Today') continue;
      if (filter === 'overdue' && item.dueStatus !== 'Overdue') continue;
      if (filter === 'due_soon' && item.dueStatus !== 'Due Soon' && item.dueStatus !== 'Due Today') continue;
      if (filter === 'settled' && item.dueStatus !== 'Settled') continue;
      if (filter === 'pending' && item.dueStatus === 'Settled') continue;

      if (tx.direction === 'I_OWE_THEM') {
        iOweList.push(item);
      } else {
        theyOweMeList.push(item);
      }
    }

    // Sorting
    const sortFn = (a: DueItem, b: DueItem) => {
      if (sortBy === 'amount') {
        return (b.transaction.remainingAmount || b.transaction.amount) - (a.transaction.remainingAmount || a.transaction.amount);
      }
      if (sortBy === 'person') {
        return a.personName.localeCompare(b.personName);
      }
      // Default sort by due urgency
      return a.daysDifference - b.daysDifference;
    };

    iOweList.sort(sortFn);
    theyOweMeList.sort(sortFn);

    const totalIOwe = iOweList
      .filter(i => i.transaction.status !== 'Settled')
      .reduce((sum, i) => sum + (i.transaction.remainingAmount ?? i.transaction.amount), 0);

    const totalTheyOweMe = theyOweMeList
      .filter(i => i.transaction.status !== 'Settled')
      .reduce((sum, i) => sum + (i.transaction.remainingAmount ?? i.transaction.amount), 0);

    return res.json({
      summary: {
        totalIOwe,
        totalTheyOweMe,
        netBalance: totalTheyOweMe - totalIOwe,
        iOweCount: iOweList.length,
        theyOweMeCount: theyOweMeList.length,
      },
      iOwe: iOweList,
      theyOweMe: theyOweMeList,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch dues' });
  }
});

export default router;
