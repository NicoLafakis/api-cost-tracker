import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHouseholdContext } from '../context/HouseholdContext';
import { formatCurrency, formatDate } from '../utils/calculations';
import { Expense, ExpenseCategory, SplitMethod, Split } from '../types';

export function Expenses() {
  const { household, addExpense, updateExpense, removeExpense, markSplitPaid } = useHouseholdContext();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(searchParams.get('add') === 'true');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  if (!household) return null;

  const filteredExpenses = [...household.expenses]
    .filter(e => filterCategory === 'all' || e.category === filterCategory)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getRoommateById = (id: string) => household.roommates.find(r => r.id === id);

  const handleSaveExpense = (expenseData: Omit<Expense, 'id'>) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData);
      setEditingExpense(null);
    } else {
      addExpense(expenseData);
    }
    setShowForm(false);
  };

  const categoryColors: Record<ExpenseCategory, string> = {
    rent: 'bg-purple-100 text-purple-700',
    utilities: 'bg-blue-100 text-blue-700',
    groceries: 'bg-green-100 text-green-700',
    supplies: 'bg-orange-100 text-orange-700',
    other: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="p-4 space-y-4">
      <header className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-gray-500">{household.expenses.length} total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Add Expense
        </button>
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'rent', 'utilities', 'groceries', 'supplies', 'other'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              filterCategory === cat
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Expense List */}
      {filteredExpenses.length > 0 ? (
        <div className="space-y-3">
          {filteredExpenses.map(expense => {
            const paidBy = getRoommateById(expense.paidBy);
            const unpaidCount = expense.splits.filter(s => !s.paid && s.roommateId !== expense.paidBy).length;

            return (
              <div key={expense.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{expense.description}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[expense.category]}`}>
                        {expense.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {paidBy?.name} paid · {formatDate(expense.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(expense.amount)}</p>
                    {unpaidCount > 0 && (
                      <p className="text-xs text-orange-600">{unpaidCount} unpaid</p>
                    )}
                  </div>
                </div>

                {/* Splits */}
                <div className="border-t pt-2 mt-2">
                  <div className="space-y-2">
                    {expense.splits.map(split => {
                      const roommate = getRoommateById(split.roommateId);
                      if (!roommate || split.roommateId === expense.paidBy) return null;

                      return (
                        <div key={split.roommateId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                              style={{ backgroundColor: roommate.color }}
                            >
                              {roommate.name[0]}
                            </div>
                            <span className="text-sm">{roommate.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{formatCurrency(split.amount)}</span>
                            <button
                              onClick={() => markSplitPaid(expense.id, split.roommateId, !split.paid)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                split.paid
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300'
                              }`}
                            >
                              {split.paid && (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
                  <button
                    onClick={() => {
                      setEditingExpense(expense);
                      setShowForm(true);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeExpense(expense.id)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center text-gray-500 py-12">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mb-2">No expenses found</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-primary-600 font-medium"
          >
            Add your first expense
          </button>
        </div>
      )}

      {/* Expense Form Modal */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          roommates={household.roommates}
          onSave={handleSaveExpense}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
        />
      )}
    </div>
  );
}

interface ExpenseFormProps {
  expense: Expense | null;
  roommates: { id: string; name: string; color: string }[];
  onSave: (expense: Omit<Expense, 'id'>) => void;
  onClose: () => void;
}

function ExpenseForm({ expense, roommates, onSave, onClose }: ExpenseFormProps) {
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount.toString() || '');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'other');
  const [date, setDate] = useState(expense?.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState(expense?.paidBy || roommates[0]?.id || '');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(expense?.splitMethod || 'equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>(() => {
    if (expense?.splitMethod === 'custom') {
      const splits: Record<string, string> = {};
      expense.splits.forEach(s => {
        splits[s.roommateId] = s.amount.toString();
      });
      return splits;
    }
    return {};
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = parseFloat(amount);
    let splits: Split[];

    if (splitMethod === 'equal') {
      const perPerson = totalAmount / roommates.length;
      splits = roommates.map(r => ({
        roommateId: r.id,
        amount: Math.round(perPerson * 100) / 100,
        paid: r.id === paidBy || (expense?.splits.find(s => s.roommateId === r.id)?.paid || false)
      }));
    } else {
      splits = roommates.map(r => ({
        roommateId: r.id,
        amount: parseFloat(customSplits[r.id] || '0'),
        paid: r.id === paidBy || (expense?.splits.find(s => s.roommateId === r.id)?.paid || false)
      }));
    }

    onSave({
      description,
      amount: totalAmount,
      category,
      date: new Date(date).toISOString(),
      paidBy,
      splitMethod,
      splits
    });
  };

  const handleCustomSplitChange = (roommateId: string, value: string) => {
    setCustomSplits(prev => ({
      ...prev,
      [roommateId]: value
    }));
  };

  const splitEvenly = () => {
    const perPerson = parseFloat(amount) / roommates.length;
    const splits: Record<string, string> = {};
    roommates.forEach(r => {
      splits[r.id] = (Math.round(perPerson * 100) / 100).toString();
    });
    setCustomSplits(splits);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="label">Description</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Electric bill"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                className="input pl-7"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="input"
              >
                <option value="rent">Rent</option>
                <option value="utilities">Utilities</option>
                <option value="groceries">Groceries</option>
                <option value="supplies">Supplies</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Paid By</label>
            <div className="flex flex-wrap gap-2">
              {roommates.map(roommate => (
                <button
                  key={roommate.id}
                  type="button"
                  onClick={() => setPaidBy(roommate.id)}
                  className={`py-1.5 px-3 rounded-full text-sm ${
                    paidBy === roommate.id
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  style={paidBy === roommate.id ? { backgroundColor: roommate.color } : undefined}
                >
                  {roommate.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Split Method</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSplitMethod('equal')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium ${
                  splitMethod === 'equal'
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                Equal
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod('custom')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium ${
                  splitMethod === 'custom'
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {splitMethod === 'custom' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Custom Amounts</label>
                <button
                  type="button"
                  onClick={splitEvenly}
                  className="text-xs text-primary-600 font-medium"
                >
                  Split Evenly
                </button>
              </div>
              <div className="space-y-2">
                {roommates.map(roommate => (
                  <div key={roommate.id} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{ backgroundColor: roommate.color }}
                    >
                      {roommate.name[0]}
                    </div>
                    <span className="text-sm flex-1">{roommate.name}</span>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="input pl-6 py-1.5 text-sm"
                        placeholder="0.00"
                        value={customSplits[roommate.id] || ''}
                        onChange={e => handleCustomSplitChange(roommate.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {expense ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
