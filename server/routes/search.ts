import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { fetchUserPeople, fetchUserTransactions } from '../services/ledger.js';
import { isMongoConnected } from '../services/mongo.js';
import { ScheduleModel, ReminderModel } from '../models/mongooseSchemas.js';
import { db } from '../services/db.js';

const router = Router();

// GET /api/v1/search?q=query
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const query = ((req.query.q as string) || '').trim().toLowerCase();

    if (!query) {
      return res.json({
        people: [],
        transactions: [],
        schedules: [],
        reminders: [],
      });
    }

    const allPeople = await fetchUserPeople(userId);
    const people = allPeople.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.phone && p.phone.toLowerCase().includes(query)) ||
      (p.email && p.email.toLowerCase().includes(query)) ||
      (p.relationship && p.relationship.toLowerCase().includes(query)) ||
      (p.notes && p.notes.toLowerCase().includes(query))
    );

    const userPeopleMap = new Map(allPeople.map(p => [p.id, p]));
    const allTxs = await fetchUserTransactions(userId);

    const transactions = allTxs
      .filter(t => {
        const person = userPeopleMap.get(t.personId);
        const personName = person ? person.name.toLowerCase() : '';
        return (
          t.description.toLowerCase().includes(query) ||
          t.type.toLowerCase().includes(query) ||
          t.paymentMethod.toLowerCase().includes(query) ||
          (t.notes && t.notes.toLowerCase().includes(query)) ||
          (t.dueDate && t.dueDate.includes(query)) ||
          personName.includes(query)
        );
      })
      .map(t => ({
        ...t,
        personName: userPeopleMap.get(t.personId)?.name || 'Unknown',
      }));

    let allSchedules: any[] = [];
    let allReminders: any[] = [];

    if (isMongoConnected()) {
      allSchedules = await ScheduleModel.find({ userId }).lean();
      allReminders = await ReminderModel.find({ userId }).lean();
    } else {
      allSchedules = db.schedules.filter(s => s.userId === userId);
      allReminders = db.reminders.filter(r => r.userId === userId);
    }

    const schedules = allSchedules.filter(s =>
      s.title.toLowerCase().includes(query) ||
      (s.description && s.description.toLowerCase().includes(query)) ||
      (s.location && s.location.toLowerCase().includes(query)) ||
      s.category.toLowerCase().includes(query) ||
      s.date.includes(query)
    );

    const reminders = allReminders.filter(r =>
      r.title.toLowerCase().includes(query) ||
      (r.notes && r.notes.toLowerCase().includes(query)) ||
      r.type.toLowerCase().includes(query) ||
      r.date.includes(query)
    );

    return res.json({
      query,
      resultsCount: people.length + transactions.length + schedules.length + reminders.length,
      people,
      transactions,
      schedules,
      reminders,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Search failed' });
  }
});

export default router;
