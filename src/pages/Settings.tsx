import { useState } from 'react';
import { useHouseholdContext } from '../context/HouseholdContext';
import { Roommate, PaymentMethod } from '../types';

export function Settings() {
  const {
    household,
    updateHousehold,
    addRoommate,
    updateRoommate,
    removeRoommate,
    exportHousehold,
    importHousehold,
    clearHousehold
  } = useHouseholdContext();

  const [showAddRoommate, setShowAddRoommate] = useState(false);
  const [editingRoommate, setEditingRoommate] = useState<Roommate | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  if (!household) return null;

  const handleExport = () => {
    const data = exportHousehold();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roomsplit-${household.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = importHousehold(reader.result as string);
        if (!result) {
          alert('Failed to import data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveRoommate = (data: { name: string; paymentMethods: PaymentMethod[] }) => {
    if (editingRoommate) {
      updateRoommate(editingRoommate.id, data);
      setEditingRoommate(null);
    } else {
      addRoommate(data.name, data.paymentMethods);
    }
    setShowAddRoommate(false);
  };

  return (
    <div className="p-4 space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      {/* Household Settings */}
      <section className="card">
        <h2 className="font-semibold mb-3">Household</h2>
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              className="input"
              value={household.name}
              onChange={e => updateHousehold({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Total Monthly Rent</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                className="input pl-7"
                value={household.totalRent}
                onChange={e => updateHousehold({ totalRent: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Roommates */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Roommates</h2>
          <button
            onClick={() => setShowAddRoommate(true)}
            className="text-primary-600 text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>
        <div className="space-y-2">
          {household.roommates.map(roommate => (
            <div key={roommate.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: roommate.color }}
                  >
                    {roommate.name[0]}
                  </div>
                  <div>
                    <h3 className="font-medium">{roommate.name}</h3>
                    {roommate.paymentMethods && roommate.paymentMethods.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {roommate.paymentMethods.map(m => m.type).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingRoommate(roommate);
                      setShowAddRoommate(true);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  {household.roommates.length > 1 && (
                    <button
                      onClick={() => removeRoommate(roommate.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Data Management */}
      <section className="card">
        <h2 className="font-semibold mb-3">Data</h2>
        <div className="space-y-2">
          <button onClick={handleExport} className="btn-secondary w-full justify-center">
            Export Data
          </button>
          <label className="btn-secondary w-full justify-center cursor-pointer block text-center">
            Import Data
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={() => setShowConfirmClear(true)}
            className="btn-danger w-full justify-center"
          >
            Clear All Data
          </button>
        </div>
      </section>

      {/* About */}
      <section className="card">
        <h2 className="font-semibold mb-2">About</h2>
        <p className="text-sm text-gray-500">
          RoomSplit v1.0.0<br />
          Fair rent splits and expense tracking for roommates.
        </p>
      </section>

      {/* Add/Edit Roommate Modal */}
      {showAddRoommate && (
        <RoommateModal
          roommate={editingRoommate}
          onSave={handleSaveRoommate}
          onClose={() => {
            setShowAddRoommate(false);
            setEditingRoommate(null);
          }}
        />
      )}

      {/* Confirm Clear Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Clear All Data?</h3>
            <p className="text-gray-500 mb-4">
              This will permanently delete your household, roommates, and all expenses. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearHousehold();
                  setShowConfirmClear(false);
                }}
                className="btn-danger flex-1"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface RoommateModalProps {
  roommate: Roommate | null;
  onSave: (data: { name: string; paymentMethods: PaymentMethod[] }) => void;
  onClose: () => void;
}

function RoommateModal({ roommate, onSave, onClose }: RoommateModalProps) {
  const [name, setName] = useState(roommate?.name || '');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    roommate?.paymentMethods || []
  );

  const handleAddPaymentMethod = (type: 'venmo' | 'cashapp' | 'zelle') => {
    if (!paymentMethods.find(m => m.type === type)) {
      setPaymentMethods([...paymentMethods, { type, handle: '' }]);
    }
  };

  const handleUpdatePaymentMethod = (type: string, handle: string) => {
    setPaymentMethods(prev =>
      prev.map(m => (m.type === type ? { ...m, handle } : m))
    );
  };

  const handleRemovePaymentMethod = (type: string) => {
    setPaymentMethods(prev => prev.filter(m => m.type !== type));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      paymentMethods: paymentMethods.filter(m => m.handle.trim())
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {roommate ? 'Edit Roommate' : 'Add Roommate'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              className="input"
              placeholder="Roommate name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Payment Methods</label>
            <div className="space-y-3">
              {paymentMethods.map(method => (
                <div key={method.type} className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    method.type === 'venmo' ? 'bg-blue-100 text-blue-700' :
                    method.type === 'cashapp' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {method.type === 'venmo' ? 'Venmo' :
                     method.type === 'cashapp' ? 'Cash App' : 'Zelle'}
                  </span>
                  <input
                    type="text"
                    className="input flex-1 py-1.5"
                    placeholder={method.type === 'zelle' ? 'Email or phone' : '@username'}
                    value={method.handle}
                    onChange={e => handleUpdatePaymentMethod(method.type, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePaymentMethod(method.type)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                {!paymentMethods.find(m => m.type === 'venmo') && (
                  <button
                    type="button"
                    onClick={() => handleAddPaymentMethod('venmo')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Venmo
                  </button>
                )}
                {!paymentMethods.find(m => m.type === 'cashapp') && (
                  <button
                    type="button"
                    onClick={() => handleAddPaymentMethod('cashapp')}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    + Cash App
                  </button>
                )}
                {!paymentMethods.find(m => m.type === 'zelle') && (
                  <button
                    type="button"
                    onClick={() => handleAddPaymentMethod('zelle')}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    + Zelle
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {roommate ? 'Save Changes' : 'Add Roommate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
