import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './services/db.js';
import { seedDemoData } from './services/seed.js';

import authRouter from './routes/auth.js';
import peopleRouter from './routes/people.js';
import transactionsRouter from './routes/transactions.js';
import dailyPaymentsRouter from './routes/dailyPayments.js';
import schedulesRouter from './routes/schedules.js';
import duesRouter from './routes/dues.js';
import remindersRouter from './routes/reminders.js';
import notificationsRouter from './routes/notifications.js';
import analyticsRouter from './routes/analytics.js';
import searchRouter from './routes/search.js';
import settingsRouter from './routes/settings.js';
import { alertWorker } from './services/alertWorker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Initialize database & Seed initial demo user and records
db.load();
seedDemoData();

// REST API v1 Routes
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

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'ABSOLUTE',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    smtpConfigured: Boolean(process.env.SMTP_USER || db.users.some(u => u.preferences?.smtpUser)),
  });
});

// Serve compiled static production frontend if dist exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA Client Routing Fallback for non-API requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 ABSOLUTE Command Center Production Web Application active on http://localhost:${PORT}`);
  alertWorker.start(30000); // Start background schedule alert worker
});
