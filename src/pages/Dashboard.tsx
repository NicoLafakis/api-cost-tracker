import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useHouseholdContext } from '../context/HouseholdContext';
import { getRoommateBalances, formatCurrency, formatDate } from '../utils/calculations';
import { useNotifications } from '../hooks/useNotifications';

export function Dashboard() {
  const { household } = useHouseholdContext();
  const { permission, requestPermission, isSupported } = useNotifications();
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    if (isSupported && permission === 'default' && household && household.expenses.length > 0) {
      setShowNotificationPrompt(true);
    }
  }, [isSupported, permission, household]);

  const handleEnableNotifications = async () => {
    await requestPermission();
    setShowNotificationPrompt(false);
  };

  if (!household) return null;

  const balances = getRoommateBalances(household);
  const recentExpenses = [...household.expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getRoommateById = (id: string) => household.roommates.find(r => r.id === id);

  return (
    <div className="p-4 space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">{household.name}</h1>
        <p className="text-gray-500">{household.roommates.length} roommates</p>
      </header>

      {/* Notification Prompt */}
      {showNotificationPrompt && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-blue-800">Enable Notifications?</h3>
              <p className="text-sm text-blue-600 mt-1">
                Get reminders for upcoming payments
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNotificationPrompt(false)}
                className="text-sm text-blue-600"
              >
                Later
              </button>
              <button
                onClick={handleEnableNotifications}
                className="text-sm font-medium text-blue-700"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/expenses?add=true" className="card flex items-center gap-3 hover:bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-medium">Add Expense</span>
        </Link>
        <Link to="/settle" className="card flex items-center gap-3 hover:bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-medium">Settle Up</span>
        </Link>
      </div>

      {/* Payment Streaks */}
      {household.roommates.some(r => (r.paymentStreak || 0) > 0) && (
        <section className="card">
          <h2 className="font-semibold mb-2">Payment Streaks 🔥</h2>
          <div className="flex flex-wrap gap-2">
            {household.roommates
              .filter(r => (r.paymentStreak || 0) > 0)
              .sort((a, b) => (b.paymentStreak || 0) - (a.paymentStreak || 0))
              .map(roommate => (
                <div
                  key={roommate.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                  style={{ backgroundColor: `${roommate.color}20`, color: roommate.color }}
                >
                  <span className="font-medium">{roommate.name}</span>
                  <span className="text-orange-500">🔥</span>
                  <span>{roommate.paymentStreak}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Analytics Link */}
      <Link to="/analytics" className="card flex items-center justify-between hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <span className="font-medium">View Analytics</span>
            <p className="text-xs text-gray-500">Spending insights & trends</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Balance Summary */}
      <section>
        <h2 className="font-semibold mb-3">Balances</h2>
        <div className="space-y-2">
          {balances.map(balance => {
            const roommate = getRoommateById(balance.roommateId);
            if (!roommate) return null;

            return (
              <div key={balance.roommateId} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: roommate.color }}
                  >
                    {roommate.name[0]}
                  </div>
                  <span className="font-medium">{roommate.name}</span>
                </div>
                <div className="text-right">
                  {balance.net > 0 ? (
                    <span className="text-green-600 font-medium">
                      +{formatCurrency(balance.net)}
                    </span>
                  ) : balance.net < 0 ? (
                    <span className="text-red-600 font-medium">
                      {formatCurrency(balance.net)}
                    </span>
                  ) : (
                    <span className="text-gray-500">Settled</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Expenses */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent Expenses</h2>
          <Link to="/expenses" className="text-primary-600 text-sm font-medium">
            View All
          </Link>
        </div>
        {recentExpenses.length > 0 ? (
          <div className="space-y-2">
            {recentExpenses.map(expense => {
              const paidBy = getRoommateById(expense.paidBy);
              return (
                <div key={expense.id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {paidBy?.name} paid · {formatDate(expense.date)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center text-gray-500 py-8">
            <p>No expenses yet</p>
            <Link to="/expenses?add=true" className="text-primary-600 font-medium">
              Add your first expense
            </Link>
          </div>
        )}
      </section>

      {/* Monthly Rent */}
      <section className="card bg-primary-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-700">Total Monthly Rent</p>
            <p className="text-2xl font-bold text-primary-900">{formatCurrency(household.totalRent)}</p>
          </div>
          <Link to="/calculator" className="btn-primary text-sm">
            Calculate Split
          </Link>
        </div>
      </section>
    </div>
  );
}
