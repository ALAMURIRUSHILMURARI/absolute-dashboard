import mongoose, { Schema, Document } from 'mongoose';
import { User, Person, Transaction, Schedule, Reminder, NotificationItem, DailyPayment } from './types.js';

// User Schema
const UserSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String },
    preferences: {
      theme: { type: String, default: 'dark' },
      currency: { type: String, default: 'INR' },
      soundEnabled: { type: Boolean, default: true },
      dueAlertsDaysBefore: { type: Number, default: 2 },
      emailNotifications: { type: Boolean, default: true },
      alertEmail: { type: String, default: 'mail4murari27@gmail.com' },
      smtpUser: { type: String, default: 'mail4murari27@gmail.com' },
      smtpPass: { type: String },
      smtpHost: { type: String, default: 'smtp.gmail.com' },
      smtpPort: { type: Number, default: 465 },
    },
  },
  { timestamps: true }
);

// Daily Payment Schema
const DailyPaymentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    paymentMethod: { type: String, enum: ['UPI', 'Cash'], required: true },
    flow: { type: String, enum: ['OUTGOING', 'INCOMING'], default: 'OUTGOING' },
    date: { type: String, required: true, index: true },
    time: { type: String },
    category: { type: String, default: 'Other' },
    notes: { type: String },
  },
  { timestamps: true }
);

// Transaction Schema (Owed money / Split)
const TransactionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    personId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    direction: { type: String, enum: ['THEY_OWE_ME', 'I_OWE_THEM'], required: true },
    type: { type: String, default: 'Expense' },
    description: { type: String, required: true },
    date: { type: String, required: true, index: true },
    paymentMethod: { type: String, default: 'UPI' },
    status: { type: String, enum: ['Pending', 'Partial', 'Settled', 'Overdue'], default: 'Pending' },
    dueDate: { type: String },
    notes: { type: String },
    originalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    isSettlement: { type: Boolean, default: false },
    settlementForId: { type: String },
  },
  { timestamps: true }
);

// Schedule Schema
const ScheduleSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    location: { type: String },
    description: { type: String },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    category: { type: String, default: 'Personal' },
    reminder: { type: String, default: '15_min' },
    recurring: { type: String, default: 'None' },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: String },
    emailAlertSent: { type: Boolean, default: false },
    emailAlertSentAt: { type: String },
  },
  { timestamps: true }
);

// Reminder Schema
const ReminderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    date: { type: String, required: true, index: true },
    time: { type: String, default: '09:00' },
    type: { type: String, default: 'Personal' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    relatedPersonId: { type: String },
    relatedScheduleId: { type: String },
    amount: { type: Number },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: String },
    isSnoozed: { type: Boolean, default: false },
    snoozedUntil: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

// Person Schema
const PersonSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    avatar: { type: String },
    relationship: { type: String, default: 'Friend' },
    notes: { type: String },
  },
  { timestamps: true }
);

// Notification Schema
const NotificationItemSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

// Export Mongoose Models (with safety check for re-compilation)
export const UserModel = mongoose.models.User || mongoose.model<User & Document>('User', UserSchema);
export const DailyPaymentModel = mongoose.models.DailyPayment || mongoose.model<DailyPayment & Document>('DailyPayment', DailyPaymentSchema);
export const TransactionModel = mongoose.models.Transaction || mongoose.model<Transaction & Document>('Transaction', TransactionSchema);
export const ScheduleModel = mongoose.models.Schedule || mongoose.model<Schedule & Document>('Schedule', ScheduleSchema);
export const ReminderModel = mongoose.models.Reminder || mongoose.model<Reminder & Document>('Reminder', ReminderSchema);
export const PersonModel = mongoose.models.Person || mongoose.model<Person & Document>('Person', PersonSchema);
export const NotificationItemModel = mongoose.models.NotificationItem || mongoose.model<NotificationItem & Document>('NotificationItem', NotificationItemSchema);
