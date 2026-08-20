import { Transaction, Person, PersonBalanceSummary, FinancialOverviewSummary } from '../models/types.js';
import { db } from './db.js';

export function calculatePersonBalances(userId: string, personId: string): {
  youOwe: number;
  theyOweYou: number;
  netBalance: number;
  pendingCount: number;
  transactions: Transaction[];
} {
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

  // Net balance: positive means they owe you, negative means you owe them
  const netBalance = theyOweYou - youOwe;

  return {
    youOwe,
    theyOweYou,
    netBalance,
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
