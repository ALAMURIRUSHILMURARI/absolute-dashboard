import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { isMongoConnected } from '../services/mongo.js';
import { PersonModel, TransactionModel } from '../models/mongooseSchemas.js';
import { Person } from '../models/types.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getAllPeopleSummariesAsync, calculatePersonBalancesAsync, fetchUserPeople } from '../services/ledger.js';

const router = Router();

// GET /api/v1/people
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const summaries = await getAllPeopleSummariesAsync(userId);
    return res.json({ people: summaries });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch people' });
  }
});

// GET /api/v1/people/:id
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const people = await fetchUserPeople(userId);
    const person = people.find(p => p.id === id);

    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const balances = await calculatePersonBalancesAsync(userId, person.id);

    return res.json({
      person,
      balances: {
        youOwe: balances.youOwe,
        theyOweYou: balances.theyOweYou,
        netBalance: balances.netBalance,
        pendingCount: balances.pendingCount,
      },
      transactions: balances.transactions,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch person details' });
  }
});

// POST /api/v1/people
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, phone, email, avatar, relationship = 'Friend', notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const now = new Date().toISOString();
    const newPerson: Person = {
      id: uuidv4(),
      userId,
      name: name.trim(),
      phone: phone ? phone.trim() : undefined,
      email: email ? email.trim() : undefined,
      avatar: avatar || undefined,
      relationship,
      notes: notes ? notes.trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (isMongoConnected()) {
      await PersonModel.create(newPerson);
    } else {
      db.people.push(newPerson);
      db.save();
    }

    return res.status(201).json({ person: newPerson });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create person' });
  }
});

// PUT /api/v1/people/:id
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, phone, email, avatar, relationship, notes } = req.body;

    if (isMongoConnected()) {
      const existing = await PersonModel.findOne({ id, userId });
      if (!existing) {
        return res.status(404).json({ error: 'Person not found' });
      }

      if (name) existing.name = name.trim();
      if (phone !== undefined) existing.phone = phone.trim();
      if (email !== undefined) existing.email = email.trim();
      if (avatar !== undefined) existing.avatar = avatar;
      if (relationship) existing.relationship = relationship;
      if (notes !== undefined) existing.notes = notes.trim();

      await existing.save();
      return res.json({ person: existing });
    } else {
      const personIdx = db.people.findIndex(p => p.id === id && p.userId === userId);
      if (personIdx === -1) {
        return res.status(404).json({ error: 'Person not found' });
      }

      if (name) db.people[personIdx].name = name.trim();
      if (phone !== undefined) db.people[personIdx].phone = phone.trim();
      if (email !== undefined) db.people[personIdx].email = email.trim();
      if (avatar !== undefined) db.people[personIdx].avatar = avatar;
      if (relationship) db.people[personIdx].relationship = relationship;
      if (notes !== undefined) db.people[personIdx].notes = notes.trim();
      db.people[personIdx].updatedAt = new Date().toISOString();

      db.save();
      return res.json({ person: db.people[personIdx] });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update person' });
  }
});

// DELETE /api/v1/people/:id
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (isMongoConnected()) {
      await PersonModel.deleteOne({ id, userId });
      await TransactionModel.deleteMany({ personId: id, userId });
    }

    const people = db.people.filter(p => !(p.id === id && p.userId === userId));
    const transactions = db.transactions.filter(t => !(t.personId === id && t.userId === userId));
    db.replaceAll({ people, transactions });

    return res.json({ message: 'Person and associated ledger history deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete person' });
  }
});

export default router;
