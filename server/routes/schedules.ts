import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { Schedule } from '../models/types.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/schedules
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { date, category, priority, month } = req.query;

    let items = db.schedules.filter(s => s.userId === userId);

    if (date) {
      items = items.filter(s => s.date === date);
    }
    if (month) {
      // month format: YYYY-MM
      items = items.filter(s => s.date.startsWith(month as string));
    }
    if (category) {
      items = items.filter(s => s.category === category);
    }
    if (priority) {
      items = items.filter(s => s.priority === priority);
    }

    // Sort by date then startTime
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
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.schedules.push(newSchedule);
    db.save();

    return res.status(201).json({ schedule: newSchedule });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create schedule' });
  }
});

// PUT /api/v1/schedules/:id
router.put('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update schedule' });
  }
});

// PATCH /api/v1/schedules/:id/toggle
router.patch('/:id/toggle', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

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
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to toggle schedule' });
  }
});

// POST /api/v1/schedules/:id/send-email-alert
router.post('/:id/send-email-alert', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const schedule = db.schedules.find(s => s.id === id && s.userId === userId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const user = db.users.find(u => u.id === userId);
    const targetEmail = user?.preferences?.alertEmail || 'mail4murari27@gmail.com';

    const { emailService } = await import('../services/email.js');
    const result = await emailService.sendScheduleAlert(targetEmail, schedule);

    schedule.emailAlertSent = true;
    schedule.emailAlertSentAt = new Date().toISOString();
    db.save();

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
router.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const exists = db.schedules.some(s => s.id === id && s.userId === userId);
    if (!exists) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const schedules = db.schedules.filter(s => !(s.id === id && s.userId === userId));
    db.replaceAll({ schedules });

    return res.json({ message: 'Schedule deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete schedule' });
  }
});

export default router;
