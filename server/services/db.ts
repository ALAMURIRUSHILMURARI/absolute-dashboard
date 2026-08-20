import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Person, Transaction, Schedule, Reminder, NotificationItem, DailyPayment } from '../models/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

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
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public load(): DatabaseSchema {
    this.ensureDataDir();
    try {
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
      } else {
        this.data = defaultData;
        this.save();
      }
    } catch (err) {
      console.error('Error loading db.json, initializing default:', err);
      this.data = defaultData;
      this.save();
    }
    this.isLoaded = true;
    return this.data;
  }

  public save(): void {
    this.ensureDataDir();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db.json:', err);
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
