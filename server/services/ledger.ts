import { Transaction, Person, PersonBalanceSummary, FinancialOverviewSummary } from '../models/types.js';
import { db } from './db.js';
import { isMongoConnected } from './mongo.js';
import { PersonModel, TransactionModel } from '../models/mongooseSchemas.js';

export async function fetchUserPeople(userId: string): Promise<Person[]> {
  if (isMongoConnected()) {
    const docs = await PersonModel.find({ userId }).lean();
    return docs.map(d => ({
      id: d.id,
      userId: d.userId,
      name: d.name,
      phone: d.phone,
      email: d.email,
      avatar: d.avatar,
      relationship: d.relationship as any,
      notes: d.notes,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
    }));
  }
  return db.people.filter(p => p.userId === userId);
}

export async function fetchUserTransactions(userId: string): Promise<Transaction[]> {
  if (isMongoConnected()) {
    const docs = await TransactionModel.find({ userId }).lean();
    return docs.map(d => ({
      id: d.id,
      userId: d.userId,
      personId: d.personId,
      amount: d.amount,
      direction: d.direction as any,
      type: d.type as any,
      description: d.description,
      date: d.date,
      paymentMethod: d.paymentMethod as any,
      status: d.status as any,
      dueDate: d.dueDate,
      notes: d.notes,
      originalAmount: d.originalAmount,
      paidAmount: d.paidAmount,
      remainingAmount: d.remainingAmount,
      isSettlement: d.isSettlement,
      settlementForId: d.settlementForId,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
    }));
  }
  return db.transactions.filter(t => t.userId === userId);
}

export async function calculatePersonBalancesAsync(userId: string, personId: string): Promise<{
  youOwe: number;
  theyOweYou: number;
  netBalance: number;
  pendingCount: number;
  transactions: Transaction[];
}> {
  const allTxs = await fetchUserTransactions(userId);
  const transactions = allTxs
    .filter(t => t.personId === personId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let youOwe = 0;
  let theyOweYou = 0;
  let pendingCount = 0;

  for (const t of transactions) {
    if (t.status !== 'Settled') {
      pendingCount++;
      const remaining = t.remainingAmount ?? t.amount;
      if (t.direction === 'I_OWE_THEM') {
        youOwe += remaining;
      } else if (t.direction === 'THEY_OWE_ME') {
        theyOweYou += remaining;
      }
    }
  }

  const netBalance = theyOweYou - youOwe;

  return {
    youOwe,
    theyOweYou,
    netBalance,
    pendingCount,
    transactions,
  };
}

export async function getAllPeopleSummariesAsync(userId: string): Promise<PersonBalanceSummary[]> {
  const userPeople = await fetchUserPeople(userId);
  const allTxs = await fetchUserTransactions(userId);

  return userPeople.map(person => {
    const personTxs = allTxs
      .filter(t => t.personId === person.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let youOwe = 0;
    let theyOweYou = 0;
    let pendingCount = 0;

    for (const t of personTxs) {
      if (t.status !== 'Settled') {
        pendingCount++;
        const remaining = t.remainingAmount ?? t.amount;
        if (t.direction === 'I_OWE_THEM') {
          youOwe += remaining;
        } else if (t.direction === 'THEY_OWE_ME') {
          theyOweYou += remaining;
        }
      }
    }

    const lastTx = personTxs[0];

    return {
      person,
      youOwe,
      theyOweYou,
      netBalance: theyOweYou - youOwe,
      pendingCount,
      totalTransactionsCount: personTxs.length,
      lastTransactionDate: lastTx ? lastTx.date : undefined,
    };
  });
}

export async function getFinancialOverviewAsync(userId: string): Promise<FinancialOverviewSummary> {
  const allUserTxs = await fetchUserTransactions(userId);
  const userPeople = await fetchUserPeople(userId);

  const todayStr = new Date().toISOString().split('T')[0];

  let totalYouOwe = 0;
  let totalOthersOweYou = 0;
  let dueTodayAmount = 0;
  let overdueAmount = 0;
  let pendingDuesCount = 0;

  for (const t of allUserTxs) {
    if (t.status !== 'Settled') {
      pendingDuesCount++;
      const remaining = t.remainingAmount ?? t.amount;

      if (t.direction === 'I_OWE_THEM') {
        totalYouOwe += remaining;
      } else {
        totalOthersOweYou += remaining;
      }

      if (t.dueDate) {
        if (t.dueDate === todayStr) {
          dueTodayAmount += remaining;
        } else if (t.dueDate < todayStr) {
          overdueAmount += remaining;
        }
      }
    }
  }

  const netBalance = totalOthersOweYou - totalYouOwe;

  return {
    totalYouOwe,
    totalOthersOweYou,
    netBalance,
    dueTodayAmount,
    overdueAmount,
    activeTabsCount: userPeople.length,
    totalTransactionsCount: allUserTxs.length,
    pendingDuesCount,
  };
}

// Synchronous legacy fallbacks
export function calculatePersonBalances(userId: string, personId: string) {
  const transactions = db.transactions
    .filter(t => t.userId === userId && t.personId === personId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let youOwe = 0;
  let theyOweYou = 0;
  let pendingCount = 0;

  for (const t of transactions) {
    if (t.status !== 'Settled') {
      pendingCount++;
      const remaining = t.remainingAmount ?? t.amount;
      if (t.direction === 'I_OWE_THEM') {
        youOwe += remaining;
      } else if (t.direction === 'THEY_OWE_ME') {
        theyOweYou += remaining;
      }
    }
  }

  return {
    youOwe,
    theyOweYou,
    netBalance: theyOweYou - youOwe,
    pendingCount,
    transactions,
  };
}

export function getAllPeopleSummaries(userId: string): PersonBalanceSummary[] {
  const userPeople = db.people.filter(p => p.userId === userId);
  return userPeople.map(person => {
    const balanceInfo = calculatePersonBalances(userId, person.id);
    const lastTx = balanceInfo.transactions[0];
    return {
      person,
      youOwe: balanceInfo.youOwe,
      theyOweYou: balanceInfo.theyOweYou,
      netBalance: balanceInfo.netBalance,
      pendingCount: balanceInfo.pendingCount,
      totalTransactionsCount: balanceInfo.transactions.length,
      lastTransactionDate: lastTx ? lastTx.date : undefined,
    };
  });
}

export function getFinancialOverview(userId: string): FinancialOverviewSummary {
  const allUserTxs = db.transactions.filter(t => t.userId === userId);
  const userPeople = db.people.filter(p => p.userId === userId);
  const todayStr = new Date().toISOString().split('T')[0];

  let totalYouOwe = 0;
  let totalOthersOweYou = 0;
  let dueTodayAmount = 0;
  let overdueAmount = 0;
  let pendingDuesCount = 0;

  for (const t of allUserTxs) {
    if (t.status !== 'Settled') {
      pendingDuesCount++;
      const remaining = t.remainingAmount ?? t.amount;
      if (t.direction === 'I_OWE_THEM') {
        totalYouOwe += remaining;
      } else {
        totalOthersOweYou += remaining;
      }
      if (t.dueDate) {
        if (t.dueDate === todayStr) {
          dueTodayAmount += remaining;
        } else if (t.dueDate < todayStr) {
          overdueAmount += remaining;
        }
      }
    }
  }

  return {
    totalYouOwe,
    totalOthersOweYou,
    netBalance: totalOthersOweYou - totalYouOwe,
    dueTodayAmount,
    overdueAmount,
    activeTabsCount: userPeople.length,
    totalTransactionsCount: allUserTxs.length,
    pendingDuesCount,
  };
}
