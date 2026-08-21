import dotenv from 'dotenv';
dotenv.config();

import { connectMongo, isMongoConnected } from '../server/services/mongo.js';

async function runTest() {
  console.log('Testing MongoDB connection to:', process.env.MONGODB_URI);
  const success = await connectMongo();
  console.log('Connect result:', success);
  console.log('Is Mongo Connected:', isMongoConnected());
  process.exit(0);
}

runTest();
