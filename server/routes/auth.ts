import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { isMongoConnected } from '../services/mongo.js';
import { userStore, isReservedLoginId } from '../services/users.js';
import {
  DailyPaymentModel,
  TransactionModel,
  ScheduleModel,
  ReminderModel,
  PersonModel,
  NotificationItemModel,
} from '../models/mongooseSchemas.js';
import { User } from '../models/types.js';
import { authMiddleware, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';

const router = Router();

const LOGIN_ID_PATTERN = /^\d+$/;
const MAX_LOGIN_ID_LENGTH = 64;

// Login has no password, so throttle failed attempts per client to make ID guessing impractical
const FAIL_LIMIT = 8;
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  return (ip || req.ip || 'unknown').trim();
}

function isBlocked(key: string): boolean {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (entry.resetAt <= Date.now()) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= FAIL_LIMIT;
}

function recordFailure(key: string) {
  const entry = failedAttempts.get(key);
  if (!entry || entry.resetAt <= Date.now()) {
    failedAttempts.set(key, { count: 1, resetAt: Date.now() + FAIL_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function normalizeLoginId(raw: unknown): string {
  return String(raw ?? '').trim();
}

function generateToken(user: User): string {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
}

function sanitizeUser(user: User) {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

// POST /api/v1/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, currency = 'INR' } = req.body;
    const loginId = normalizeLoginId(req.body.loginId);

    if (!name || !String(name).trim() || !loginId) {
      return res.status(400).json({ error: 'Name and user ID are required' });
    }
    if (!LOGIN_ID_PATTERN.test(loginId) || loginId.length > MAX_LOGIN_ID_LENGTH) {
      return res.status(400).json({ error: 'User ID must contain digits only' });
    }

    if (isReservedLoginId(loginId) || (await userStore.findByLoginId(loginId))) {
      return res.status(400).json({ error: 'This user ID is already taken. Choose another one.' });
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: uuidv4(),
      name: String(name).trim(),
      loginId,
      preferences: {
        theme: 'dark',
        currency: currency || 'INR',
        soundEnabled: true,
        dueAlertsDaysBefore: 2,
        emailNotifications: true,
      },
      createdAt: now,
      updatedAt: now,
    };

    await userStore.create(newUser);

    const token = generateToken(newUser);
    return res.status(201).json({ token, user: sanitizeUser(newUser) });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(400).json({ error: 'This user ID is already taken. Choose another one.' });
    }
    return res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const key = clientKey(req);
    if (isBlocked(key)) {
      return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
    }

    const loginId = normalizeLoginId(req.body.loginId);
    if (!loginId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = LOGIN_ID_PATTERN.test(loginId) ? await userStore.findByLoginId(loginId) : undefined;
    if (!user) {
      recordFailure(key);
      return res.status(401).json({ error: 'User ID not found' });
    }

    failedAttempts.delete(key);
    const token = generateToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: sanitizeUser(req.user!) });
});

// PUT /api/v1/auth/profile
router.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { name, avatarUrl, preferences } = req.body;

    const patch: Partial<User> = {};
    if (name) patch.name = String(name).trim();
    if (avatarUrl !== undefined) patch.avatarUrl = avatarUrl;
    if (preferences) {
      patch.preferences = { ...user.preferences, ...preferences };
    }

    const updated = await userStore.update(user.id, patch);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: sanitizeUser(updated) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Profile update failed' });
  }
});

// DELETE /api/v1/auth/account
router.delete('/account', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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

    await userStore.remove(userId);
    db.replaceAll({
      people: db.people.filter(p => p.userId !== userId),
      transactions: db.transactions.filter(t => t.userId !== userId),
      dailyPayments: db.dailyPayments.filter(d => d.userId !== userId),
      schedules: db.schedules.filter(s => s.userId !== userId),
      reminders: db.reminders.filter(r => r.userId !== userId),
      notifications: db.notifications.filter(n => n.userId !== userId),
    });

    return res.json({ message: 'Account and associated data deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Account deletion failed' });
  }
});

export default router;
