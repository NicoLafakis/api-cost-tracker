import { useState } from 'react';
import { useHouseholdContext } from '../context/HouseholdContext';
import { calculateRentSplit, formatCurrency } from '../utils/calculations';
import { CalculationMethod, Room } from '../types';

export function RentCalculator() {
  const { household, addRoom, updateRoom, removeRoom } = useHouseholdContext();
  const [method, setMethod] = useState<CalculationMethod>('equal');
  const [coupleMultiplier, setCoupleMultiplier] = useState(1.5);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  if (!household) return null;

  const breakdown = calculateRentSplit(household, method, coupleMultiplier);
  const getRoommateById = (id: string) => household.roommates.find(r => r.id === id);

  const handleSaveRoom = (room: Omit<Room, 'id'>) => {
    if (editingRoom) {
      updateRoom(editingRoom.id, room);
      setEditingRoom(null);
    } else {
      addRoom(room);
    }
    setShowAddRoom(false);
  };

  return (
    <div className="p-4 space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Rent Calculator</h1>
        <p className="text-gray-500">Total: {formatCurrency(household.totalRent)}/month</p>
      </header>

      {/* Calculation Method */}
      <section className="card">
        <h2 className="font-semibold mb-3">Calculation Method</h2>
        <div className="grid grid-cols-2 gap-2">
          {(['equal', 'sqft', 'tiered', 'custom'] as CalculationMethod[]).map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                method === m
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {m === 'equal' && 'Equal Split'}
              {m === 'sqft' && 'By Sq Ft'}
              {m === 'tiered' && 'Tiered'}
              {m === 'custom' && 'Custom'}
            </button>
          ))}
        </div>

        {/* Couple Adjustment */}
        <div className="mt-4 pt-4 border-t">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Couple Common Area Multiplier</span>
            <select
              value={coupleMultiplier}
              onChange={e => setCoupleMultiplier(parseFloat(e.target.value))}
              className="input w-20 text-sm py-1"
            >
              <option value="1">1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Couples share a room but use more common areas
          </p>
        </div>
      </section>

      {/* Rooms */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Rooms</h2>
          <button
            onClick={() => setShowAddRoom(true)}
            className="text-primary-600 text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Room
          </button>
        </div>

        {household.rooms.length > 0 ? (
          <div className="space-y-2">
            {household.rooms.map(room => (
              <div key={room.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{room.name}</h3>
                      {room.isCouple && (
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                          Couple
                        </span>
                      )}
                      {room.tier && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          room.tier === 'premium' ? 'bg-yellow-100 text-yellow-700' :
                          room.tier === 'economy' ? 'bg-gray-100 text-gray-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {room.tier}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {room.squareFootage} sq ft
                      {room.amenities.length > 0 && ` · ${room.amenities.join(', ')}`}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {room.occupants.map(id => {
                        const roommate = getRoommateById(id);
                        return roommate ? (
                          <span
                            key={id}
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: roommate.color }}
                          >
                            {roommate.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingRoom(room);
                        setShowAddRoom(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeRoom(room.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center text-gray-500 py-8">
            <p>No rooms added yet</p>
            <button
              onClick={() => setShowAddRoom(true)}
              className="text-primary-600 font-medium"
            >
              Add your first room
            </button>
          </div>
        )}
      </section>

      {/* Results */}
      {breakdown.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Rent Breakdown</h2>
          <div className="space-y-2">
            {breakdown.map(item => (
              <div key={item.roomId} className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{item.roomName}</h3>
                  <span className="font-bold">{formatCurrency(item.totalRent)}</span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Room rent</span>
                    <span>{formatCurrency(item.baseRent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Common area</span>
                    <span>{formatCurrency(item.commonAreaShare)}</span>
                  </div>
                </div>
                {item.occupants.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Per person</span>
                      <span className="font-semibold text-primary-600">
                        {formatCurrency(item.perPersonRent)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add/Edit Room Modal */}
      {showAddRoom && (
        <RoomModal
          room={editingRoom}
          roommates={household.roommates}
          onSave={handleSaveRoom}
          onClose={() => {
            setShowAddRoom(false);
            setEditingRoom(null);
          }}
        />
      )}
    </div>
  );
}

interface RoomModalProps {
  room: Room | null;
  roommates: { id: string; name: string; color: string }[];
  onSave: (room: Omit<Room, 'id'>) => void;
  onClose: () => void;
}

function RoomModal({ room, roommates, onSave, onClose }: RoomModalProps) {
  const [name, setName] = useState(room?.name || '');
  const [squareFootage, setSquareFootage] = useState(room?.squareFootage.toString() || '');
  const [amenities, setAmenities] = useState<string[]>(room?.amenities || []);
  const [occupants, setOccupants] = useState<string[]>(room?.occupants || []);
  const [tier, setTier] = useState<'premium' | 'standard' | 'economy'>(room?.tier || 'standard');
  const [isCouple, setIsCouple] = useState(room?.isCouple || false);
  const [customRent, setCustomRent] = useState(room?.rentAmount?.toString() || '');

  const amenityOptions = ['Private Bathroom', 'Balcony', 'Walk-in Closet', 'En-suite', 'Window', 'AC Unit'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      squareFootage: parseFloat(squareFootage) || 0,
      amenities,
      occupants,
      tier,
      isCouple,
      rentAmount: customRent ? parseFloat(customRent) : undefined
    });
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const toggleOccupant = (id: string) => {
    setOccupants(prev =>
      prev.includes(id)
        ? prev.filter(o => o !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{room ? 'Edit Room' : 'Add Room'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="label">Room Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Master Bedroom"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Square Footage</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={squareFootage}
              onChange={e => setSquareFootage(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Tier</label>
            <div className="flex gap-2">
              {(['premium', 'standard', 'economy'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium ${
                    tier === t
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Custom Rent (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                className="input pl-7"
                placeholder="Auto-calculated"
                value={customRent}
                onChange={e => setCustomRent(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {amenityOptions.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`py-1 px-3 rounded-full text-sm ${
                    amenities.includes(amenity)
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Occupants</label>
            <div className="flex flex-wrap gap-2">
              {roommates.map(roommate => (
                <button
                  key={roommate.id}
                  type="button"
                  onClick={() => toggleOccupant(roommate.id)}
                  className={`py-1 px-3 rounded-full text-sm ${
                    occupants.includes(roommate.id)
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  style={occupants.includes(roommate.id) ? { backgroundColor: roommate.color } : undefined}
                >
                  {roommate.name}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isCouple}
              onChange={e => setIsCouple(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm">This room has a couple</span>
          </label>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {room ? 'Save Changes' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
