import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { isMongoConnected } from '../services/mongo.js';
import { ReminderModel } from '../models/mongooseSchemas.js';
import { Reminder } from '../models/types.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const fetchUserReminders = async (userId: string): Promise<Reminder[]> => {
  if (isMongoConnected()) {
    const docs = await ReminderModel.find({ userId }).lean();
    return docs.map(d => ({
      id: d.id,
      userId: d.userId,
      title: d.title,
      date: d.date,
      time: d.time,
      type: d.type as any,
      priority: d.priority as any,
      relatedPersonId: d.relatedPersonId,
      relatedScheduleId: d.relatedScheduleId,
      amount: d.amount,
      isCompleted: d.isCompleted,
      completedAt: d.completedAt,
      isSnoozed: d.isSnoozed,
      snoozedUntil: d.snoozedUntil,
      notes: d.notes,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
    }));
  }
  return db.reminders.filter(r => r.userId === userId);
};

// GET /api/v1/reminders
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, type } = req.query;

    let items = await fetchUserReminders(userId);

    if (status === 'completed') {
      items = items.filter(r => r.isCompleted);
    } else if (status === 'active') {
      items = items.filter(r => !r.isCompleted);
    }

    if (type) {
      items = items.filter(r => r.type === type);
    }

    items.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.time.localeCompare(b.time);
    });

    return res.json({ reminders: items });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch reminders' });
  }
});

// POST /api/v1/reminders
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      date = new Date().toISOString().split('T')[0],
      time = '09:00',
      type = 'Personal',
      priority = 'Medium',
      relatedPersonId,
      relatedScheduleId,
      amount,
      notes,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Reminder title is required' });
    }

    const now = new Date().toISOString();
    const newReminder: Reminder = {
      id: uuidv4(),
      userId,
      title: title.trim(),
      date,
      time,
      type,
      priority,
      relatedPersonId: relatedPersonId || undefined,
      relatedScheduleId: relatedScheduleId || undefined,
      amount: amount ? parseFloat(amount) : undefined,
      isCompleted: false,
      notes: notes ? notes.trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (isMongoConnected()) {
      await ReminderModel.create(newReminder);
    } else {
      db.reminders.push(newReminder);
      db.save();
    }

    return res.status(201).json({ reminder: newReminder });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create reminder' });
  }
});

// PATCH /api/v1/reminders/:id/toggle
router.patch('/:id/toggle', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (isMongoConnected()) {
      const existing = await ReminderModel.findOne({ id, userId });
      if (!existing) {
        return res.status(404).json({ error: 'Reminder not found' });
      }
      existing.isCompleted = !existing.isCompleted;
      existing.completedAt = existing.isCompleted ? new Date().toISOString() : undefined;
      await existing.save();
      return res.json({ reminder: existing });
    } else {
      const idx = db.reminders.findIndex(r => r.id === id && r.userId === userId);
      if (idx === -1) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      const rem = db.reminders[idx];
      rem.isCompleted = !rem.isCompleted;
      rem.completedAt = rem.isCompleted ? new Date().toISOString() : undefined;
      rem.updatedAt = new Date().toISOString();

      db.save();
      return res.json({ reminder: rem });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to toggle reminder' });
  }
});

// DELETE /api/v1/reminders/:id
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (isMongoConnected()) {
      await ReminderModel.deleteOne({ id, userId });
    }

    const reminders = db.reminders.filter(r => !(r.id === id && r.userId === userId));
    db.replaceAll({ reminders });

    return res.json({ message: 'Reminder deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete reminder' });
  }
});

export default router;
