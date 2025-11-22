import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useHouseholdContext } from '../context/HouseholdContext';
import { getRoommateBalances, formatCurrency, formatDate } from '../utils/calculations';
import { useNotifications } from '../hooks/useNotifications';
import { AnimatedCurrency } from '../components/AnimatedNumber';
import { Confetti } from '../components/Confetti';
import { EmptyState } from '../components/EmptyState';

export function Dashboard() {
  const { household } = useHouseholdContext();
  const { permission, requestPermission, isSupported } = useNotifications();
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isSupported && permission === 'default' && household && household.expenses.length > 0) {
      setShowNotificationPrompt(true);
    }
  }, [isSupported, permission, household]);

  // Check for all settled - celebrate!
  useEffect(() => {
    if (household) {
      const balances = getRoommateBalances(household);
      const allSettled = balances.every(b => Math.abs(b.net) < 0.01);
      if (allSettled && household.expenses.length > 0) {
        setShowConfetti(true);
      }
    }
  }, [household]);

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
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <header className="pt-2 animate-fade-in-down">
        <h1 className="text-2xl font-bold text-gradient">{household.name}</h1>
        <p className="text-gray-500">{household.roommates.length} roommates</p>
      </header>

      {/* Notification Prompt */}
      {showNotificationPrompt && (
        <div className="card bg-blue-50 border-blue-200 animate-slide-in-right">
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
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleEnableNotifications}
                className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/expenses?add=true"
          className="card-interactive flex items-center gap-3 shine"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-medium">Add Expense</span>
        </Link>
        <Link
          to="/settle"
          className="card-interactive flex items-center gap-3 shine"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-medium">Settle Up</span>
        </Link>
      </div>

      {/* Payment Streaks */}
      {household.roommates.some(r => (r.paymentStreak || 0) > 0) && (
        <section className="card animate-bounce-in">
          <h2 className="font-semibold mb-2">Payment Streaks 🔥</h2>
          <div className="flex flex-wrap gap-2">
            {household.roommates
              .filter(r => (r.paymentStreak || 0) > 0)
              .sort((a, b) => (b.paymentStreak || 0) - (a.paymentStreak || 0))
              .map(roommate => (
                <div
                  key={roommate.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm animate-pulse-once shadow-sm"
                  style={{ backgroundColor: `${roommate.color}20`, color: roommate.color }}
                >
                  <span className="font-medium">{roommate.name}</span>
                  <span className="animate-float">🔥</span>
                  <span className="font-bold">{roommate.paymentStreak}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Analytics Link */}
      <Link
        to="/analytics"
        className="card-interactive flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <span className="font-medium">View Analytics</span>
            <p className="text-xs text-gray-500">Spending insights & trends</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Balance Summary */}
      <section className="animate-fade-in-up">
        <h2 className="font-semibold mb-3">Balances</h2>
        <div className="space-y-2 stagger-children">
          {balances.map(balance => {
            const roommate = getRoommateById(balance.roommateId);
            if (!roommate) return null;

            return (
              <div
                key={balance.roommateId}
                className="card flex items-center justify-between group hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: roommate.color }}
                  >
                    {roommate.name[0]}
                  </div>
                  <span className="font-medium">{roommate.name}</span>
                </div>
                <div className="text-right">
                  {balance.net > 0 ? (
                    <span className="text-green-600 font-medium">
                      +<AnimatedCurrency value={balance.net} />
                    </span>
                  ) : balance.net < 0 ? (
                    <span className="text-red-600 font-medium">
                      -<AnimatedCurrency value={Math.abs(balance.net)} />
                    </span>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Settled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Expenses */}
      <section className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent Expenses</h2>
          <Link to="/expenses" className="text-primary-600 text-sm font-medium hover:text-primary-700 transition-colors">
            View All
          </Link>
        </div>
        {recentExpenses.length > 0 ? (
          <div className="space-y-2 stagger-children">
            {recentExpenses.map(expense => {
              const paidBy = getRoommateById(expense.paidBy);
              return (
                <div
                  key={expense.id}
                  className="card hover:scale-[1.01] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {paidBy?.name} paid · {formatDate(expense.date)}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">{formatCurrency(expense.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="receipt"
            title="No expenses yet"
            description="Start tracking your shared expenses"
            action={{
              label: "Add First Expense",
              onClick: () => window.location.href = '/expenses?add=true'
            }}
          />
        )}
      </section>

      {/* Monthly Rent */}
      <section className="card bg-gradient-to-br from-primary-50 to-purple-50 border-primary-200 animate-fade-in-up animate-glow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-700">Total Monthly Rent</p>
            <p className="text-2xl font-bold text-primary-900">
              <AnimatedCurrency value={household.totalRent} />
            </p>
          </div>
          <Link to="/calculator" className="btn-primary text-sm ripple">
            Calculate Split
          </Link>
        </div>
      </section>
    </div>
  );
}
