import { useState } from 'react';
import { useHouseholdContext } from '../context/HouseholdContext';

export function Setup() {
  const { createHousehold, addRoommate } = useHouseholdContext();
  const [step, setStep] = useState(1);
  const [householdName, setHouseholdName] = useState('');
  const [totalRent, setTotalRent] = useState('');
  const [roommates, setRoommates] = useState<string[]>(['']);

  const handleAddRoommate = () => {
    setRoommates([...roommates, '']);
  };

  const handleRoommateChange = (index: number, value: string) => {
    const updated = [...roommates];
    updated[index] = value;
    setRoommates(updated);
  };

  const handleRemoveRoommate = (index: number) => {
    if (roommates.length > 1) {
      setRoommates(roommates.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (step === 1 && householdName && totalRent) {
      setStep(2);
    } else if (step === 2) {
      const validRoommates = roommates.filter(name => name.trim());
      if (validRoommates.length > 0) {
        createHousehold(householdName, parseFloat(totalRent));
        validRoommates.forEach(name => {
          addRoommate(name.trim());
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-500 to-primary-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">RoomSplit</h1>
          <p className="text-primary-100">Fair rent splits made easy</p>
        </div>

        <div className="card">
          {step === 1 ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Create Your Household</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Household Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., 123 Main St Apt 4B"
                    value={householdName}
                    onChange={e => setHouseholdName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Total Monthly Rent</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      className="input pl-7"
                      placeholder="0.00"
                      value={totalRent}
                      onChange={e => setTotalRent(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!householdName || !totalRent}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Add Roommates</h2>
              <div className="space-y-3 mb-4">
                {roommates.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      className="input"
                      placeholder={`Roommate ${index + 1}`}
                      value={name}
                      onChange={e => handleRoommateChange(index, e.target.value)}
                    />
                    {roommates.length > 1 && (
                      <button
                        onClick={() => handleRemoveRoommate(index)}
                        className="px-3 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddRoommate}
                className="text-primary-600 text-sm font-medium mb-4 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Another Roommate
              </button>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!roommates.some(name => name.trim())}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Household
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
