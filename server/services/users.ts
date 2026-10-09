import { db } from './db.js';
import { isMongoConnected } from './mongo.js';
import { UserModel } from '../models/mongooseSchemas.js';
import { User } from '../models/types.js';

// Single access point for user accounts: MongoDB when connected, JsonDB otherwise.

const fromDoc = (d: any): User => {
  const { _id, __v, ...rest } = d;
  return {
    ...rest,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
  } as User;
};

// Fixed login IDs for existing accounts (login ID -> internal user id).
// These resolve without touching the stored account and can never be claimed by a new signup.
const RESERVED_LOGIN_IDS: Record<string, string> = {
  '27': 'user_demo_absolute_01',
};

export const isReservedLoginId = (loginId: string): boolean => loginId in RESERVED_LOGIN_IDS;

export const userStore = {
  async findById(id: string): Promise<User | undefined> {
    if (isMongoConnected()) {
      const doc = await UserModel.findOne({ id }).lean();
      if (doc) return fromDoc(doc);
      // Fall through to JsonDB so accounts that only exist there (e.g. the demo account) keep working
    }
    return db.users.find(u => u.id === id);
  },

  async findByLoginId(loginId: string): Promise<User | undefined> {
    const reservedFor = RESERVED_LOGIN_IDS[loginId];
    if (reservedFor) {
      const owner = await this.findById(reservedFor);
      return owner ? { ...owner, loginId } : undefined;
    }
    if (isMongoConnected()) {
      const doc = await UserModel.findOne({ loginId }).lean();
      return doc ? fromDoc(doc) : undefined;
    }
    return db.users.find(u => u.loginId === loginId);
  },

  async create(user: User): Promise<void> {
    if (isMongoConnected()) {
      await UserModel.create(user);
      return;
    }
    db.users.push(user);
    db.save();
  },

  async update(id: string, patch: Partial<User>): Promise<User | undefined> {
    const updatedAt = new Date().toISOString();
    if (isMongoConnected()) {
      const doc = await UserModel.findOneAndUpdate({ id }, { ...patch, updatedAt }, { new: true }).lean();
      if (doc) return fromDoc(doc);
    }
    const user = db.users.find(u => u.id === id);
    if (!user) return undefined;
    Object.assign(user, patch, { updatedAt });
    db.save();
    return user;
  },

  async remove(id: string): Promise<void> {
    if (isMongoConnected()) {
      await UserModel.deleteOne({ id });
    }
    const idx = db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      db.users.splice(idx, 1);
      db.save();
    }
  },

  async all(): Promise<User[]> {
    if (isMongoConnected()) {
      return (await UserModel.find().lean()).map(fromDoc);
    }
    return db.users;
  },
};
