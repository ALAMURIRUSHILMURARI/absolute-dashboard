import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import { connectMongo, isMongoConnected } from '../server/services/mongo.js';
import { DailyPaymentModel, TransactionModel, PersonModel, ScheduleModel, ReminderModel, UserModel } from '../server/models/mongooseSchemas.js';

async function check() {
  await connectMongo();
  console.log('Is Mongo Connected:', isMongoConnected());
  if (isMongoConnected()) {
    const dailyPayments = await DailyPaymentModel.find().lean();
    const transactions = await TransactionModel.find().lean();
    const people = await PersonModel.find().lean();
    const schedules = await ScheduleModel.find().lean();
    const reminders = await ReminderModel.find().lean();
    const users = await UserModel.find().lean();

    console.log('--- MONGODB ATLAS CONTENTS ---');
    console.log('Users count:', users.length);
    console.log('Daily Payments count:', dailyPayments.length);
    console.log('Transactions count:', transactions.length);
    console.log('People count:', people.length);
    console.log('Schedules count:', schedules.length);
    console.log('Reminders count:', reminders.length);
  }
  process.exit(0);
}

check();
