import { useHouseholdContext } from '../context/HouseholdContext';
import { calculateBalances, getRoommateBalances, formatCurrency, generatePaymentLink } from '../utils/calculations';

export function Settlement() {
  const { household, markSplitPaid } = useHouseholdContext();

  if (!household) return null;

  const balances = calculateBalances(household);
  const roommateBalances = getRoommateBalances(household);
  const getRoommateById = (id: string) => household.roommates.find(r => r.id === id);

  const handleMarkAllPaid = (fromId: string, toId: string) => {
    household.expenses.forEach(expense => {
      if (expense.paidBy === toId) {
        const split = expense.splits.find(s => s.roommateId === fromId);
        if (split && !split.paid) {
          markSplitPaid(expense.id, fromId, true);
        }
      }
    });
  };

  return (
    <div className="p-4 space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Settle Up</h1>
        <p className="text-gray-500">Clear your balances</p>
      </header>

      {/* Balance Overview */}
      <section>
        <h2 className="font-semibold mb-3">Balance Summary</h2>
        <div className="grid grid-cols-1 gap-2">
          {roommateBalances.map(balance => {
            const roommate = getRoommateById(balance.roommateId);
            if (!roommate) return null;

            return (
              <div key={balance.roommateId} className="card">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: roommate.color }}
                  >
                    {roommate.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{roommate.name}</h3>
                    <div className="text-sm text-gray-500">
                      {balance.owed > 0 && <span>Owed {formatCurrency(balance.owed)}</span>}
                      {balance.owed > 0 && balance.owes > 0 && <span> · </span>}
                      {balance.owes > 0 && <span>Owes {formatCurrency(balance.owes)}</span>}
                      {balance.owed === 0 && balance.owes === 0 && <span>All settled</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${
                      balance.net > 0 ? 'text-green-600' : balance.net < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {balance.net > 0 ? '+' : ''}{formatCurrency(balance.net)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Simplified Payments */}
      {balances.length > 0 ? (
        <section>
          <h2 className="font-semibold mb-3">Payments to Make</h2>
          <div className="space-y-3">
            {balances.map((balance, index) => {
              const from = getRoommateById(balance.from);
              const to = getRoommateById(balance.to);
              if (!from || !to) return null;

              const paymentMethods = to.paymentMethods || [];

              return (
                <div key={index} className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: from.color }}
                    >
                      {from.name[0]}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-medium">{from.name}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="font-medium">{to.name}</span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(balance.amount)}</span>
                  </div>

                  {/* Payment Links */}
                  <div className="flex flex-wrap gap-2">
                    {paymentMethods.map(method => (
                      <a
                        key={method.type}
                        href={generatePaymentLink(method.type, method.handle, balance.amount, `RoomSplit - ${household.name}`)}
                        className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg text-center text-sm font-medium ${
                          method.type === 'venmo' ? 'bg-blue-100 text-blue-700' :
                          method.type === 'cashapp' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {method.type === 'venmo' ? 'Venmo' :
                         method.type === 'cashapp' ? 'Cash App' : 'Zelle'}
                      </a>
                    ))}
                    {paymentMethods.length === 0 && (
                      <span className="text-sm text-gray-500 italic">
                        No payment methods set up for {to.name}
                      </span>
                    )}
                  </div>

                  {/* Mark as Paid */}
                  <button
                    onClick={() => handleMarkAllPaid(balance.from, balance.to)}
                    className="w-full mt-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Mark as Paid
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="card text-center py-8">
          <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-lg mb-1">All Settled Up!</h3>
          <p className="text-gray-500">No outstanding balances</p>
        </section>
      )}

      {/* Payment History */}
      <section>
        <h2 className="font-semibold mb-3">Recent Payments</h2>
        {household.expenses.some(e => e.splits.some(s => s.paid && s.paidDate)) ? (
          <div className="space-y-2">
            {household.expenses
              .flatMap(expense =>
                expense.splits
                  .filter(split => split.paid && split.paidDate && split.roommateId !== expense.paidBy)
                  .map(split => ({
                    expense,
                    split,
                    payer: getRoommateById(split.roommateId),
                    payee: getRoommateById(expense.paidBy)
                  }))
              )
              .filter(item => item.payer && item.payee)
              .sort((a, b) => new Date(b.split.paidDate!).getTime() - new Date(a.split.paidDate!).getTime())
              .slice(0, 10)
              .map((item, index) => (
                <div key={index} className="card py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: item.payer!.color }}
                      >
                        {item.payer!.name[0]}
                      </div>
                      <span className="text-sm">
                        {item.payer!.name} paid {item.payee!.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{formatCurrency(item.split.amount)}</span>
                      <p className="text-xs text-gray-500">
                        {new Date(item.split.paidDate!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="card text-center text-gray-500 py-6">
            <p>No payment history yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
