import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { Reminder } from '../models/types.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/reminders
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, type } = req.query;

    let items = db.reminders.filter(r => r.userId === userId);

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
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.reminders.push(newReminder);
    db.save();

    return res.status(201).json({ reminder: newReminder });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create reminder' });
  }
});

// PATCH /api/v1/reminders/:id/toggle
router.patch('/:id/toggle', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

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
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to toggle reminder' });
  }
});

// DELETE /api/v1/reminders/:id
router.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const exists = db.reminders.some(r => r.id === id && r.userId === userId);
    if (!exists) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const reminders = db.reminders.filter(r => !(r.id === id && r.userId === userId));
    db.replaceAll({ reminders });

    return res.json({ message: 'Reminder deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete reminder' });
  }
});

export default router;
