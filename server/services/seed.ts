import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { User } from '../models/types.js';

export function seedDemoData(): void {
  const passwordHash = bcrypt.hashSync('demo123', 10);
  const existingDemoUser = db.users.find(u => u.email === 'demo@absolute.app');

  if (existingDemoUser) {
    existingDemoUser.passwordHash = passwordHash;
    db.save();
    return;
  }

  const userId = 'user_demo_absolute_01';
  const demoUser: User = {
    id: userId,
    name: 'Rushil Murari',
    email: 'demo@absolute.app',
    passwordHash,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    preferences: {
      theme: 'dark',
      currency: 'INR',
      soundEnabled: true,
      dueAlertsDaysBefore: 2,
      emailNotifications: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.replaceAll({
    users: [...db.users, demoUser],
  });

  console.log('Clean demo account initialized with zero default dummy transactions.');
}
