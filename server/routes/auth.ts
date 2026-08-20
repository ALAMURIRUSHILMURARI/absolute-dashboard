import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { User } from '../models/types.js';
import { authMiddleware, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';
import { seedDemoData } from '../services/seed.js';

const router = Router();

function generateToken(user: User): string {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
}

function sanitizeUser(user: User) {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

// POST /api/v1/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, currency = 'INR' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser: User = {
      id: uuidv4(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      preferences: {
        theme: 'dark',
        currency: currency || 'INR',
        soundEnabled: true,
        dueAlertsDaysBefore: 2,
        emailNotifications: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.save();

    const token = generateToken(newUser);
    return res.status(201).json({ token, user: sanitizeUser(newUser) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// POST /api/v1/auth/demo (1-click Demo Login)
router.post('/demo', async (_req, res) => {
  try {
    seedDemoData();
    const demoUser = db.users.find(u => u.email === 'demo@absolute.app');
    if (!demoUser) {
      return res.status(500).json({ error: 'Demo user initialization failed' });
    }
    const token = generateToken(demoUser);
    return res.json({ token, user: sanitizeUser(demoUser) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Demo login failed' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: sanitizeUser(req.user!) });
});

// PUT /api/v1/auth/profile
router.put('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { name, avatarUrl, preferences } = req.body;

    const userIdx = db.users.findIndex(u => u.id === user.id);
    if (userIdx === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) db.users[userIdx].name = name.trim();
    if (avatarUrl !== undefined) db.users[userIdx].avatarUrl = avatarUrl;
    if (preferences) {
      db.users[userIdx].preferences = {
        ...db.users[userIdx].preferences,
        ...preferences,
      };
    }
    db.users[userIdx].updatedAt = new Date().toISOString();
    db.save();

    return res.json({ user: sanitizeUser(db.users[userIdx]) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Profile update failed' });
  }
});

// DELETE /api/v1/auth/account
router.delete('/account', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Filter out all records for this user
    const users = db.users.filter(u => u.id !== userId);
    const people = db.people.filter(p => p.userId !== userId);
    const transactions = db.transactions.filter(t => t.userId !== userId);
    const schedules = db.schedules.filter(s => s.userId !== userId);
    const reminders = db.reminders.filter(r => r.userId !== userId);
    const notifications = db.notifications.filter(n => n.userId !== userId);

    db.replaceAll({ users, people, transactions, schedules, reminders, notifications });

    return res.json({ message: 'Account and associated data deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Account deletion failed' });
  }
});

export default router;
