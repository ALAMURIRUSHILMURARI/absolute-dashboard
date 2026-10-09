import { Router, Response } from 'express';
import { db } from '../services/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { isMongoConnected } from '../services/mongo.js';
import { userStore } from '../services/users.js';
import {
  DailyPaymentModel,
  TransactionModel,
  ScheduleModel,
  ReminderModel,
  PersonModel,
  NotificationItemModel,
} from '../models/mongooseSchemas.js';

const router = Router();

// GET /api/v1/settings/export (Download full user data JSON)
router.get('/export', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = req.user;
    const people = db.people.filter(p => p.userId === userId);
    const transactions = db.transactions.filter(t => t.userId === userId);
    const dailyPayments = db.dailyPayments.filter(d => d.userId === userId);
    const schedules = db.schedules.filter(s => s.userId === userId);
    const reminders = db.reminders.filter(r => r.userId === userId);
    const notifications = db.notifications.filter(n => n.userId === userId);

    const exportPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'ABSOLUTE',
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        preferences: user?.preferences,
      },
      data: {
        people,
        transactions,
        dailyPayments,
        schedules,
        reminders,
        notifications,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=absolute_backup_${new Date().toISOString().slice(0, 10)}.json`);
    return res.json(exportPayload);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Export failed' });
  }
});

// POST /api/v1/settings/import (Restore data from JSON)
router.post('/import', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Valid backup data object is required' });
    }

    // Retain records of other users while replacing current user's records
    const otherPeople = db.people.filter(p => p.userId !== userId);
    const otherTransactions = db.transactions.filter(t => t.userId !== userId);
    const otherDailyPayments = db.dailyPayments.filter(d => d.userId !== userId);
    const otherSchedules = db.schedules.filter(s => s.userId !== userId);
    const otherReminders = db.reminders.filter(r => r.userId !== userId);
    const otherNotifications = db.notifications.filter(n => n.userId !== userId);

    const importedPeople = (data.people || []).map((p: any) => ({ ...p, userId }));
    const importedTransactions = (data.transactions || []).map((t: any) => ({ ...t, userId }));
    const importedDailyPayments = (data.dailyPayments || []).map((d: any) => ({ ...d, userId }));
    const importedSchedules = (data.schedules || []).map((s: any) => ({ ...s, userId }));
    const importedReminders = (data.reminders || []).map((r: any) => ({ ...r, userId }));
    const importedNotifications = (data.notifications || []).map((n: any) => ({ ...n, userId }));

    db.replaceAll({
      people: [...otherPeople, ...importedPeople],
      transactions: [...otherTransactions, ...importedTransactions],
      dailyPayments: [...otherDailyPayments, ...importedDailyPayments],
      schedules: [...otherSchedules, ...importedSchedules],
      reminders: [...otherReminders, ...importedReminders],
      notifications: [...otherNotifications, ...importedNotifications],
    });

    return res.json({
      message: 'Data imported successfully',
      stats: {
        people: importedPeople.length,
        transactions: importedTransactions.length,
        dailyPayments: importedDailyPayments.length,
        schedules: importedSchedules.length,
        reminders: importedReminders.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Import failed' });
  }
});

// POST /api/v1/settings/reset-demo
router.post('/reset-demo', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    if (isMongoConnected()) {
      await Promise.all([
        DailyPaymentModel.deleteMany({ userId }),
        TransactionModel.deleteMany({ userId }),
        ScheduleModel.deleteMany({ userId }),
        ReminderModel.deleteMany({ userId }),
        PersonModel.deleteMany({ userId }),
        NotificationItemModel.deleteMany({ userId }),
      ]);
    }

    // Remove current user's records (the account itself is kept)
    const people = db.people.filter(p => p.userId !== userId);
    const transactions = db.transactions.filter(t => t.userId !== userId);
    const dailyPayments = db.dailyPayments.filter(d => d.userId !== userId);
    const schedules = db.schedules.filter(s => s.userId !== userId);
    const reminders = db.reminders.filter(r => r.userId !== userId);
    const notifications = db.notifications.filter(n => n.userId !== userId);

    db.replaceAll({ people, transactions, dailyPayments, schedules, reminders, notifications });

    return res.json({ message: 'Reset to clean state completed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Reset failed' });
  }
});

// POST /api/v1/settings/smtp (Save and verify SMTP credentials)
router.post('/smtp', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { smtpUser, smtpPass, smtpHost = 'smtp.gmail.com', smtpPort = 465 } = req.body;

    if (!smtpUser || !smtpPass) {
      return res.status(400).json({ error: 'Email/Username and Password/App Password are required' });
    }

    const { emailService } = await import('../services/email.js');
    const verifyResult = await emailService.setCustomSmtp({
      user: smtpUser,
      pass: smtpPass,
      host: smtpHost,
      port: Number(smtpPort),
    });

    if (!verifyResult.success) {
      return res.status(400).json({
        error: `SMTP Authentication failed: ${verifyResult.error}. Make sure you are using a 16-character Google App Password (not your regular Gmail password).`,
      });
    }

    // Save to user preferences
    await userStore.update(userId, {
      preferences: {
        ...req.user!.preferences,
        smtpUser: smtpUser.trim(),
        smtpPass: smtpPass.trim(),
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
        alertEmail: smtpUser.trim(),
      },
    });

    return res.json({
      message: 'SMTP credentials verified and saved successfully! Live email delivery active.',
      smtpUser: smtpUser.trim(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to configure SMTP' });
  }
});

export default router;
