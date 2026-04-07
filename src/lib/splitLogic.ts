import { SplitGroup, SplitMember, SplitExpense, SplitSettlement } from '../types';

export const calculateGroupBalances = (group: SplitGroup) => {
  const balances: Record<string, number> = {};
  group.members.forEach(m => balances[m.id] = 0);

  // Add expenses
  group.expenses.forEach(exp => {
    // Payer gets credit
    balances[exp.paidByMemberId] = (balances[exp.paidByMemberId] || 0) + exp.amount;
    // Splitters get debt
    exp.splits.forEach(split => {
      balances[split.memberId] = (balances[split.memberId] || 0) - split.amount;
    });
  });

  // Add settlements
  group.settlements.forEach(set => {
    // Payer gets credit (reducing their debt or increasing their credit)
    balances[set.payerId] = (balances[set.payerId] || 0) + set.amount;
    // Receiver gets debt (reducing their credit or increasing their debt)
    balances[set.receiverId] = (balances[set.receiverId] || 0) - set.amount;
  });

  return balances;
};

export const getWhoOwesWhom = (balances: Record<string, number>, members: SplitMember[]) => {
  const creditors = Object.entries(balances)
    .filter(([_, bal]) => bal > 0.01)
    .sort((a, b) => b[1] - a[1]);
  const debtors = Object.entries(balances)
    .filter(([_, bal]) => bal < -0.01)
    .sort((a, b) => a[1] - b[1]);

  const transactions: { from: string; to: string; amount: number }[] = [];

  let cIdx = 0;
  let dIdx = 0;

  const tempCreditors = creditors.map(c => ({ id: c[0], amount: c[1] }));
  const tempDebtors = debtors.map(d => ({ id: d[0], amount: Math.abs(d[1]) }));

  while (cIdx < tempCreditors.length && dIdx < tempDebtors.length) {
    const creditor = tempCreditors[cIdx];
    const debtor = tempDebtors[dIdx];
    const amount = Math.min(creditor.amount, debtor.amount);

    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount
    });

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount < 0.01) cIdx++;
    if (debtor.amount < 0.01) dIdx++;
  }

  return transactions;
};

export const getUserNetPosition = (group: SplitGroup, currentUserId: string) => {
  const balances = calculateGroupBalances(group);
  return balances[currentUserId] || 0;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount).replace('₹', '₹ ');
};

export const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
