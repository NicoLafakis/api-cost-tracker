import { useMemo } from 'react';
import { useHouseholdContext } from '../context/HouseholdContext';
import { formatCurrency } from '../utils/calculations';
import { ExpenseCategory } from '../types';

export function Analytics() {
  const { household } = useHouseholdContext();

  const analytics = useMemo(() => {
    if (!household) return null;

    const expenses = household.expenses;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Category breakdown
    const categoryTotals: Record<ExpenseCategory, number> = {
      rent: 0,
      utilities: 0,
      groceries: 0,
      supplies: 0,
      other: 0
    };

    let totalSpent = 0;
    let thisMonthSpent = 0;
    let lastMonthSpent = 0;

    expenses.forEach(expense => {
      categoryTotals[expense.category] += expense.amount;
      totalSpent += expense.amount;

      const expenseDate = new Date(expense.date);
      if (expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear) {
        thisMonthSpent += expense.amount;
      }
      if (
        expenseDate.getMonth() === (thisMonth - 1 + 12) % 12 &&
        (thisMonth === 0 ? expenseDate.getFullYear() === thisYear - 1 : expenseDate.getFullYear() === thisYear)
      ) {
        lastMonthSpent += expense.amount;
      }
    });

    // Per roommate spending
    const roommateSpending: Record<string, number> = {};
    household.roommates.forEach(r => {
      roommateSpending[r.id] = 0;
    });

    expenses.forEach(expense => {
      roommateSpending[expense.paidBy] += expense.amount;
    });

    // Monthly trend (last 6 months)
    const monthlyTrend: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(thisYear, thisMonth - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthExpenses = expenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate.getMonth() === date.getMonth() && expDate.getFullYear() === date.getFullYear();
      });
      const amount = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      monthlyTrend.push({ month: monthName, amount });
    }

    // Payment punctuality per roommate
    const punctuality: Record<string, { onTime: number; late: number; total: number }> = {};
    household.roommates.forEach(r => {
      punctuality[r.id] = { onTime: 0, late: 0, total: 0 };
    });

    expenses.forEach(expense => {
      expense.splits.forEach(split => {
        if (split.roommateId === expense.paidBy) return;
        punctuality[split.roommateId].total++;
        if (split.paid) {
          // Consider paid within 7 days as on-time
          if (split.paidDate) {
            const expDate = new Date(expense.date);
            const paidDate = new Date(split.paidDate);
            const daysDiff = (paidDate.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff <= 7) {
              punctuality[split.roommateId].onTime++;
            } else {
              punctuality[split.roommateId].late++;
            }
          } else {
            punctuality[split.roommateId].onTime++;
          }
        }
      });
    });

    return {
      categoryTotals,
      totalSpent,
      thisMonthSpent,
      lastMonthSpent,
      roommateSpending,
      monthlyTrend,
      punctuality
    };
  }, [household]);

  if (!household || !analytics) return null;

  const maxCategoryAmount = Math.max(...Object.values(analytics.categoryTotals));
  const maxMonthlyAmount = Math.max(...analytics.monthlyTrend.map(m => m.amount));
  const getRoommateById = (id: string) => household.roommates.find(r => r.id === id);

  const categoryColors: Record<ExpenseCategory, string> = {
    rent: '#a855f7',
    utilities: '#3b82f6',
    groceries: '#22c55e',
    supplies: '#f97316',
    other: '#6b7280'
  };

  const monthChange = analytics.lastMonthSpent > 0
    ? ((analytics.thisMonthSpent - analytics.lastMonthSpent) / analytics.lastMonthSpent) * 100
    : 0;

  return (
    <div className="p-4 space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500">Spending insights</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-xl font-bold">{formatCurrency(analytics.thisMonthSpent)}</p>
          {monthChange !== 0 && (
            <p className={`text-xs ${monthChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {monthChange > 0 ? '↑' : '↓'} {Math.abs(monthChange).toFixed(0)}% vs last month
            </p>
          )}
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">All Time</p>
          <p className="text-xl font-bold">{formatCurrency(analytics.totalSpent)}</p>
          <p className="text-xs text-gray-500">{household.expenses.length} expenses</p>
        </div>
      </div>

      {/* Monthly Trend */}
      <section className="card">
        <h2 className="font-semibold mb-3">Monthly Trend</h2>
        <div className="flex items-end justify-between h-32 gap-1">
          {analytics.monthlyTrend.map((month, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center justify-end h-24">
                <div
                  className="w-full bg-primary-500 rounded-t transition-all"
                  style={{
                    height: maxMonthlyAmount > 0 ? `${(month.amount / maxMonthlyAmount) * 100}%` : '0%',
                    minHeight: month.amount > 0 ? '4px' : '0'
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">{month.month}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Category Breakdown */}
      <section className="card">
        <h2 className="font-semibold mb-3">By Category</h2>
        <div className="space-y-3">
          {(Object.entries(analytics.categoryTotals) as [ExpenseCategory, number][])
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm capitalize">{category}</span>
                  <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: maxCategoryAmount > 0 ? `${(amount / maxCategoryAmount) * 100}%` : '0%',
                      backgroundColor: categoryColors[category]
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Spending by Roommate */}
      <section className="card">
        <h2 className="font-semibold mb-3">Who's Paying</h2>
        <div className="space-y-2">
          {Object.entries(analytics.roommateSpending)
            .sort((a, b) => b[1] - a[1])
            .map(([roommateId, amount]) => {
              const roommate = getRoommateById(roommateId);
              if (!roommate) return null;
              const percentage = analytics.totalSpent > 0 ? (amount / analytics.totalSpent) * 100 : 0;

              return (
                <div key={roommateId} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: roommate.color }}
                  >
                    {roommate.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{roommate.name}</span>
                      <span className="text-sm">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: roommate.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Payment Punctuality */}
      <section className="card">
        <h2 className="font-semibold mb-3">Payment Punctuality</h2>
        <div className="space-y-2">
          {household.roommates.map(roommate => {
            const stats = analytics.punctuality[roommate.id];
            const rate = stats.total > 0 ? (stats.onTime / stats.total) * 100 : 100;

            return (
              <div key={roommate.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: roommate.color }}
                  >
                    {roommate.name[0]}
                  </div>
                  <span className="font-medium">{roommate.name}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {rate.toFixed(0)}%
                  </span>
                  <p className="text-xs text-gray-500">
                    {stats.onTime}/{stats.total} on time
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
