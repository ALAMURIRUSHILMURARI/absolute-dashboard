import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { db } from '../server/services/db.js';
import { connectMongo, isMongoConnected } from '../server/services/mongo.js';
import { seedDemoData } from '../server/services/seed.js';

import authRouter from '../server/routes/auth.js';
import peopleRouter from '../server/routes/people.js';
import transactionsRouter from '../server/routes/transactions.js';
import dailyPaymentsRouter from '../server/routes/dailyPayments.js';
import schedulesRouter from '../server/routes/schedules.js';
import duesRouter from '../server/routes/dues.js';
import remindersRouter from '../server/routes/reminders.js';
import notificationsRouter from '../server/routes/notifications.js';
import analyticsRouter from '../server/routes/analytics.js';
import searchRouter from '../server/routes/search.js';
import settingsRouter from '../server/routes/settings.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize DB
db.load();
seedDemoData();

// Vercel Serverless Middleware: Guarantee Mongo Connection BEFORE Route Execution
app.use(async (req, res, next) => {
  if (process.env.MONGODB_URI && !isMongoConnected()) {
    try {
      await connectMongo();
    } catch (err) {
      console.warn('Vercel Mongo connect middleware error:', err);
    }
  }
  next();
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/people', peopleRouter);
app.use('/api/v1/transactions', transactionsRouter);
app.use('/api/v1/daily-payments', dailyPaymentsRouter);
app.use('/api/v1/schedules', schedulesRouter);
app.use('/api/v1/dues', duesRouter);
app.use('/api/v1/reminders', remindersRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/settings', settingsRouter);

app.get('/api/v1/health', async (req, res) => {
  if (process.env.MONGODB_URI && !isMongoConnected()) {
    await connectMongo();
  }
  res.json({
    status: 'online',
    appName: 'ABSOLUTE',
    platform: 'Vercel Serverless',
    mongoConnected: isMongoConnected(),
    timestamp: new Date().toISOString(),
    smtpConfigured: Boolean(process.env.SMTP_USER || db.users.some(u => u.preferences?.smtpUser)),
  });
});

export default app;
