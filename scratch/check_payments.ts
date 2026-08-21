import dotenv from 'dotenv';
dotenv.config();

import { connectMongo, isMongoConnected } from '../server/services/mongo.js';
import { DailyPaymentModel } from '../server/models/mongooseSchemas.js';
import { db } from '../server/services/db.js';

async function check() {
  await connectMongo();
  if (isMongoConnected()) {
    const mongoPayments = await DailyPaymentModel.find().lean();
    console.log('MongoDB Payments count:', mongoPayments.length);
    console.log('MongoDB Payments:', JSON.stringify(mongoPayments, null, 2));
  }
  const jsonPayments = db.load().dailyPayments;
  console.log('JsonDB Payments count:', jsonPayments.length);
  process.exit(0);
}

check();
