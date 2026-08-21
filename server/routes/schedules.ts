import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { isMongoConnected } from '../services/mongo.js';
import { ScheduleModel } from '../models/mongooseSchemas.js';
import { Schedule } from '../models/types.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const fetchUserSchedules = async (userId: string): Promise<Schedule[]> => {
  if (isMongoConnected()) {
    const docs = await ScheduleModel.find({ userId }).lean();
    return docs.map(d => ({
      id: d.id,
      userId: d.userId,
      title: d.title,
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime,
      location: d.location,
      description: d.description,
      priority: d.priority as any,
      category: d.category as any,
      reminder: d.reminder,
      recurring: d.recurring as any,
      isCompleted: d.isCompleted,
      completedAt: d.completedAt,
      emailAlertSent: d.emailAlertSent,
      emailAlertSentAt: d.emailAlertSentAt,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
    }));
  }
  return db.schedules.filter(s => s.userId === userId);
};

// GET /api/v1/schedules
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { date, category, priority, month } = req.query;

    let items = await fetchUserSchedules(userId);

    if (date) {
      items = items.filter(s => s.date === date);
    }
    if (month) {
      items = items.filter(s => s.date.startsWith(month as string));
    }
    if (category) {
      items = items.filter(s => s.category === category);
    }
    if (priority) {
      items = items.filter(s => s.priority === priority);
    }

    items.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.startTime.localeCompare(b.startTime);
    });

    return res.json({ schedules: items });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch schedules' });
  }
});

// POST /api/v1/schedules
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      date,
      startTime = '09:00',
      endTime = '10:00',
      location,
      description,
      priority = 'Medium',
      category = 'Personal',
      reminder = '15_min',
      recurring = 'None',
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const now = new Date().toISOString();
    const newSchedule: Schedule = {
      id: uuidv4(),
      userId,
      title: title.trim(),
      date,
      startTime,
      endTime,
      location: location ? location.trim() : undefined,
      description: description ? description.trim() : undefined,
      priority,
      category,
      reminder,
      recurring,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    if (isMongoConnected()) {
      await ScheduleModel.create(newSchedule);
    } else {
      db.schedules.push(newSchedule);
      db.save();
    }

    return res.status(201).json({ schedule: newSchedule });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create schedule' });
  }
});

// PUT /api/v1/schedules/:id
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      title,
      date,
      startTime,
      endTime,
      location,
      description,
      priority,
      category,
      reminder,
      recurring,
      isCompleted,
    } = req.body;

    if (isMongoConnected()) {
      const existing = await ScheduleModel.findOne({ id, userId });
      if (!existing) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      if (title) existing.title = title.trim();
      if (date) existing.date = date;
      if (startTime) existing.startTime = startTime;
      if (endTime) existing.endTime = endTime;
      if (location !== undefined) existing.location = location ? location.trim() : undefined;
      if (description !== undefined) existing.description = description ? description.trim() : undefined;
      if (priority) existing.priority = priority;
      if (category) existing.category = category;
      if (reminder) existing.reminder = reminder;
      if (recurring) existing.recurring = recurring;
      if (isCompleted !== undefined) {
        existing.isCompleted = isCompleted;
        existing.completedAt = isCompleted ? new Date().toISOString() : undefined;
      }

      await existing.save();
      return res.json({ schedule: existing });
    } else {
      const idx = db.schedules.findIndex(s => s.id === id && s.userId === userId);
      if (idx === -1) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      const sch = db.schedules[idx];
      if (title) sch.title = title.trim();
      if (date) sch.date = date;
      if (startTime) sch.startTime = startTime;
      if (endTime) sch.endTime = endTime;
      if (location !== undefined) sch.location = location ? location.trim() : undefined;
      if (description !== undefined) sch.description = description ? description.trim() : undefined;
      if (priority) sch.priority = priority;
      if (category) sch.category = category;
      if (reminder) sch.reminder = reminder;
      if (recurring) sch.recurring = recurring;
      if (isCompleted !== undefined) {
        sch.isCompleted = isCompleted;
        sch.completedAt = isCompleted ? new Date().toISOString() : undefined;
      }
      sch.updatedAt = new Date().toISOString();

      db.save();
      return res.json({ schedule: sch });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update schedule' });
  }
});

// PATCH /api/v1/schedules/:id/toggle
router.patch('/:id/toggle', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (isMongoConnected()) {
      const existing = await ScheduleModel.findOne({ id, userId });
      if (!existing) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      existing.isCompleted = !existing.isCompleted;
      existing.completedAt = existing.isCompleted ? new Date().toISOString() : undefined;
      await existing.save();
      return res.json({ schedule: existing });
    } else {
      const idx = db.schedules.findIndex(s => s.id === id && s.userId === userId);
      if (idx === -1) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      const sch = db.schedules[idx];
      sch.isCompleted = !sch.isCompleted;
      sch.completedAt = sch.isCompleted ? new Date().toISOString() : undefined;
      sch.updatedAt = new Date().toISOString();

      db.save();
      return res.json({ schedule: sch });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to toggle schedule' });
  }
});

// POST /api/v1/schedules/:id/send-email-alert
router.post('/:id/send-email-alert', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const items = await fetchUserSchedules(userId);
    const schedule = items.find(s => s.id === id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const user = db.users.find(u => u.id === userId);
    const targetEmail = user?.preferences?.alertEmail || 'mail4murari27@gmail.com';

    const { emailService } = await import('../services/email.js');
    const result = await emailService.sendScheduleAlert(targetEmail, schedule);

    if (isMongoConnected()) {
      await ScheduleModel.updateOne(
        { id, userId },
        { emailAlertSent: true, emailAlertSentAt: new Date().toISOString() }
      );
    } else {
      const sch = db.schedules.find(s => s.id === id && s.userId === userId);
      if (sch) {
        sch.emailAlertSent = true;
        sch.emailAlertSentAt = new Date().toISOString();
        db.save();
      }
    }

    return res.json({
      message: `Priority-styled alert email (${schedule.priority}) sent to ${targetEmail}`,
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to dispatch email alert' });
  }
});

// POST /api/v1/schedules/test-priority-email
router.post('/test-priority-email', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { priority = 'Urgent', email } = req.body;

    const user = db.users.find(u => u.id === userId);
    const targetEmail = email || user?.preferences?.alertEmail || 'mail4murari27@gmail.com';

    const { emailService } = await import('../services/email.js');
    const result = await emailService.sendTestEmail(targetEmail, priority);

    return res.json({
      message: `Test email (${priority} priority) dispatched to ${targetEmail}`,
      targetEmail,
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to send test priority email' });
  }
});

// DELETE /api/v1/schedules/:id
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (isMongoConnected()) {
      await ScheduleModel.deleteOne({ id, userId });
    }

    const schedules = db.schedules.filter(s => !(s.id === id && s.userId === userId));
    db.replaceAll({ schedules });

    return res.json({ message: 'Schedule deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete schedule' });
  }
});

export default router;
