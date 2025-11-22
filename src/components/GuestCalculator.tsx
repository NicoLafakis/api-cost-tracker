import { useState } from 'react';
import { formatCurrency } from '../utils/calculations';

interface GuestCalculatorProps {
  monthlyUtilities: number;
  totalRoommates: number;
  onClose: () => void;
}

export function GuestCalculator({ monthlyUtilities, totalRoommates, onClose }: GuestCalculatorProps) {
  const [nightsPerMonth, setNightsPerMonth] = useState('7');
  const [includeSupplies, setIncludeSupplies] = useState(true);
  const [suppliesCost, setSuppliesCost] = useState('50');

  const nights = parseInt(nightsPerMonth) || 0;
  const supplies = includeSupplies ? (parseFloat(suppliesCost) || 0) : 0;

  // Calculate guest cost
  const dailyUtilityCost = monthlyUtilities / 30;
  const perPersonDaily = dailyUtilityCost / totalRoommates;
  const guestUtilityCost = perPersonDaily * nights;
  const guestSuppliesCost = (supplies / totalRoommates) * (nights / 30);
  const totalGuestCost = guestUtilityCost + guestSuppliesCost;

  // Show different scenarios
  const scenarios = [
    { nights: 3, label: 'Weekend visit' },
    { nights: 7, label: '1 week' },
    { nights: 14, label: '2 weeks' },
    { nights: 30, label: 'Full month' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Guest Cost Calculator</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Input */}
          <div>
            <label className="label">Nights per month</label>
            <input
              type="number"
              className="input"
              value={nightsPerMonth}
              onChange={e => setNightsPerMonth(e.target.value)}
              min="0"
              max="30"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeSupplies}
              onChange={e => setIncludeSupplies(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm">Include household supplies</span>
          </label>

          {includeSupplies && (
            <div>
              <label className="label">Monthly supplies cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  className="input pl-7"
                  value={suppliesCost}
                  onChange={e => setSuppliesCost(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Result */}
          <div className="card bg-primary-50 border-primary-200">
            <p className="text-sm text-primary-700 mb-1">Estimated guest cost</p>
            <p className="text-3xl font-bold text-primary-900">{formatCurrency(totalGuestCost)}</p>
            <p className="text-xs text-primary-600 mt-1">per month for {nights} nights</p>
          </div>

          {/* Breakdown */}
          <div className="card">
            <h3 className="font-medium mb-2">Cost Breakdown</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Utilities share</span>
                <span>{formatCurrency(guestUtilityCost)}</span>
              </div>
              {includeSupplies && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplies share</span>
                  <span>{formatCurrency(guestSuppliesCost)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-1 border-t">
                <span>Total</span>
                <span>{formatCurrency(totalGuestCost)}</span>
              </div>
            </div>
          </div>

          {/* Scenarios */}
          <div className="card">
            <h3 className="font-medium mb-2">Quick Scenarios</h3>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map(scenario => {
                const cost = (perPersonDaily * scenario.nights) +
                  (includeSupplies ? (parseFloat(suppliesCost) || 0) / totalRoommates * (scenario.nights / 30) : 0);
                return (
                  <button
                    key={scenario.nights}
                    onClick={() => setNightsPerMonth(scenario.nights.toString())}
                    className={`p-2 rounded-lg border text-left ${
                      nights === scenario.nights
                        ? 'bg-primary-50 border-primary-500'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-xs text-gray-500">{scenario.label}</p>
                    <p className="font-semibold">{formatCurrency(cost)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rent Adjustment Suggestion */}
          <div className="card bg-yellow-50 border-yellow-200">
            <h3 className="font-medium text-yellow-800 mb-1">Rent Renegotiation</h3>
            <p className="text-sm text-yellow-700">
              If a guest stays regularly, consider adding {formatCurrency(totalGuestCost)} to that roommate's monthly share to keep things fair.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
