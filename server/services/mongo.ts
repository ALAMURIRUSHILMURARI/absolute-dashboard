import mongoose from 'mongoose';
import { db } from './db.js';
import {
  UserModel,
  DailyPaymentModel,
  TransactionModel,
  ScheduleModel,
  ReminderModel,
  PersonModel,
  NotificationItemModel,
} from '../models/mongooseSchemas.js';

let isConnected = false;

export const connectMongo = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('ℹ️ [MongoDB] MONGODB_URI not configured in environment. JsonDB fallback active.');
    return false;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    await mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('🍃 [MongoDB] Connected to Cloud Database successfully!');

    // Trigger auto-migration from JsonDB to MongoDB if collections are empty
    autoMigrateFromJsonDB().catch(e => console.warn('Migration warning:', e));
    return true;
  } catch (err: any) {
    console.error('❌ [MongoDB] Connection warning:', err.message);
    console.log('🔄 [MongoDB] JsonDB fallback active.');
    return false;
  }
};

export const isMongoConnected = (): boolean => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Auto-migrate records from db.json into MongoDB if MongoDB collections are newly created
const autoMigrateFromJsonDB = async () => {
  try {
    const jsonSchema = db.load();

    // 1. Users
    const userCount = await UserModel.countDocuments();
    if (userCount === 0 && jsonSchema.users.length > 0) {
      await UserModel.insertMany(jsonSchema.users);
      console.log(`📦 [MongoDB Migration] Migrated ${jsonSchema.users.length} users into MongoDB.`);
    }

    // 2. Daily Payments
    const paymentCount = await DailyPaymentModel.countDocuments();
    if (paymentCount === 0 && jsonSchema.dailyPayments.length > 0) {
      await DailyPaymentModel.insertMany(jsonSchema.dailyPayments);
      console.log(`📦 [MongoDB Migration] Migrated ${jsonSchema.dailyPayments.length} daily payments into MongoDB.`);
    }

    // 3. Transactions
    const txCount = await TransactionModel.countDocuments();
    if (txCount === 0 && jsonSchema.transactions.length > 0) {
      await TransactionModel.insertMany(jsonSchema.transactions);
      console.log(`📦 [MongoDB Migration] Migrated ${jsonSchema.transactions.length} transactions into MongoDB.`);
    }

    // 4. Schedules
    const schedCount = await ScheduleModel.countDocuments();
    if (schedCount === 0 && jsonSchema.schedules.length > 0) {
      await ScheduleModel.insertMany(jsonSchema.schedules);
      console.log(`📦 [MongoDB Migration] Migrated ${jsonSchema.schedules.length} schedules into MongoDB.`);
    }

    // 5. Reminders
    const remCount = await ReminderModel.countDocuments();
    if (remCount === 0 && jsonSchema.reminders.length > 0) {
      await ReminderModel.insertMany(jsonSchema.reminders);
      console.log(`📦 [MongoDB Migration] Migrated ${jsonSchema.reminders.length} reminders into MongoDB.`);
    }

    // 6. People
    const peopleCount = await PersonModel.countDocuments();
    if (peopleCount === 0 && jsonSchema.people.length > 0) {
      await PersonModel.insertMany(jsonSchema.people);
      console.log(`📦 [MongoDB Migration] Migrated ${jsonSchema.people.length} people into MongoDB.`);
    }
  } catch (err: any) {
    console.error('⚠️ [MongoDB Migration Warning]:', err.message);
  }
};
