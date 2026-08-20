import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { User, Person, Transaction, Schedule, Reminder, NotificationItem, DailyPayment } from '../models/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Original read-only seed data location
const SEED_DATA_DIR = path.resolve(__dirname, '../data');
const SEED_DB_FILE = path.join(SEED_DATA_DIR, 'db.json');

// Writable target location (use os.tmpdir() on serverless / Vercel, fallback to local data dir)
const WRITABLE_DIR = process.env.VERCEL || process.env.NODE_ENV === 'production'
  ? os.tmpdir()
  : SEED_DATA_DIR;

const DB_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), 'absolute_db.json')
  : path.join(WRITABLE_DIR, 'db.json');

export interface DatabaseSchema {
  users: User[];
  people: Person[];
  transactions: Transaction[];
  dailyPayments: DailyPayment[];
  schedules: Schedule[];
  reminders: Reminder[];
  notifications: NotificationItem[];
}

const defaultData: DatabaseSchema = {
  users: [],
  people: [],
  transactions: [],
  dailyPayments: [],
  schedules: [],
  reminders: [],
  notifications: [],
};

class JsonDB {
  private data: DatabaseSchema = defaultData;
  private isLoaded = false;

  constructor() {
    this.ensureDataDir();
    this.load();
  }

  private ensureDataDir() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.warn('⚠️ Data dir warning:', e);
    }
  }

  public load(): DatabaseSchema {
    this.ensureDataDir();
    try {
      // 1. Check if writable DB_FILE exists
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          users: parsed.users || [],
          people: parsed.people || [],
          transactions: parsed.transactions || [],
          dailyPayments: parsed.dailyPayments || [],
          schedules: parsed.schedules || [],
          reminders: parsed.reminders || [],
          notifications: parsed.notifications || [],
        };
        console.log(`📂 [JsonDB] Loaded ${this.data.dailyPayments.length} daily payments, ${this.data.schedules.length} schedules from ${DB_FILE}`);
      } else if (fs.existsSync(SEED_DB_FILE)) {
        // 2. Initial seed load from project seed file
        const seedContent = fs.readFileSync(SEED_DB_FILE, 'utf-8');
        const parsed = JSON.parse(seedContent);
        this.data = {
          users: parsed.users || [],
          people: parsed.people || [],
          transactions: parsed.transactions || [],
          dailyPayments: parsed.dailyPayments || [],
          schedules: parsed.schedules || [],
          reminders: parsed.reminders || [],
          notifications: parsed.notifications || [],
        };
        console.log(`🌱 [JsonDB] Seeded ${this.data.dailyPayments.length} daily payments from ${SEED_DB_FILE}`);
        this.save();
      } else {
        this.data = defaultData;
        this.save();
      }
    } catch (err) {
      console.error('⚠️ [JsonDB] Load error, retaining current memory data:', err);
    }
    this.isLoaded = true;
    return this.data;
  }

  public save(): void {
    this.ensureDataDir();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      console.log(`💾 [JsonDB] Saved database (${this.data.dailyPayments.length} daily payments) to ${DB_FILE}`);
    } catch (err: any) {
      console.error('❌ [JsonDB] Error saving db:', err.message);
    }
  }

  // Collections accessors
  public get users(): User[] {
    if (!this.isLoaded) this.load();
    return this.data.users;
  }

  public get people(): Person[] {
    if (!this.isLoaded) this.load();
    return this.data.people;
  }

  public get transactions(): Transaction[] {
    if (!this.isLoaded) this.load();
    return this.data.transactions;
  }

  public get dailyPayments(): DailyPayment[] {
    if (!this.isLoaded) this.load();
    return this.data.dailyPayments;
  }

  public get schedules(): Schedule[] {
    if (!this.isLoaded) this.load();
    return this.data.schedules;
  }

  public get reminders(): Reminder[] {
    if (!this.isLoaded) this.load();
    return this.data.reminders;
  }

  public get notifications(): NotificationItem[] {
    if (!this.isLoaded) this.load();
    return this.data.notifications;
  }

  // Bulk replace (for restore/import/seed)
  public replaceAll(newData: Partial<DatabaseSchema>): void {
    this.data = {
      users: newData.users || this.data.users,
      people: newData.people || this.data.people,
      transactions: newData.transactions || this.data.transactions,
      dailyPayments: newData.dailyPayments || this.data.dailyPayments,
      schedules: newData.schedules || this.data.schedules,
      reminders: newData.reminders || this.data.reminders,
      notifications: newData.notifications || this.data.notifications,
    };
    this.save();
  }
}

export const db = new JsonDB();
