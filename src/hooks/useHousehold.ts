import { useLocalStorage } from './useLocalStorage';
import { Household, Roommate, Room, Expense, Agreement } from '../types';
import { v4 as uuidv4 } from 'uuid';

const ROOMMATE_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6',
  '#ef4444', '#10b981', '#3b82f6', '#f97316', '#06b6d4'
];

export function useHousehold() {
  const [household, setHousehold] = useLocalStorage<Household | null>('roomsplit-household', null);

  const createHousehold = (name: string, totalRent: number): Household => {
    const newHousehold: Household = {
      id: uuidv4(),
      name,
      totalRent,
      createdAt: new Date().toISOString(),
      roommates: [],
      rooms: [],
      expenses: []
    };
    setHousehold(newHousehold);
    return newHousehold;
  };

  const updateHousehold = (updates: Partial<Household>) => {
    if (!household) return;
    setHousehold({ ...household, ...updates });
  };

  const addRoommate = (name: string, paymentMethods?: Roommate['paymentMethods']): Roommate => {
    const colorIndex = household?.roommates.length || 0;
    const newRoommate: Roommate = {
      id: uuidv4(),
      name,
      color: ROOMMATE_COLORS[colorIndex % ROOMMATE_COLORS.length],
      paymentMethods,
      paymentStreak: 0
    };

    if (household) {
      setHousehold({
        ...household,
        roommates: [...household.roommates, newRoommate]
      });
    }

    return newRoommate;
  };

  const updateRoommate = (id: string, updates: Partial<Roommate>) => {
    if (!household) return;
    setHousehold({
      ...household,
      roommates: household.roommates.map(r =>
        r.id === id ? { ...r, ...updates } : r
      )
    });
  };

  const removeRoommate = (id: string) => {
    if (!household) return;
    setHousehold({
      ...household,
      roommates: household.roommates.filter(r => r.id !== id),
      rooms: household.rooms.map(room => ({
        ...room,
        occupants: room.occupants.filter(o => o !== id)
      })),
      expenses: household.expenses.map(expense => ({
        ...expense,
        splits: expense.splits.filter(s => s.roommateId !== id)
      }))
    });
  };

  const addRoom = (room: Omit<Room, 'id'>): Room => {
    const newRoom: Room = {
      ...room,
      id: uuidv4()
    };

    if (household) {
      setHousehold({
        ...household,
        rooms: [...household.rooms, newRoom]
      });
    }

    return newRoom;
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    if (!household) return;
    setHousehold({
      ...household,
      rooms: household.rooms.map(r =>
        r.id === id ? { ...r, ...updates } : r
      )
    });
  };

  const removeRoom = (id: string) => {
    if (!household) return;
    setHousehold({
      ...household,
      rooms: household.rooms.filter(r => r.id !== id)
    });
  };

  const addExpense = (expense: Omit<Expense, 'id'>): Expense => {
    const newExpense: Expense = {
      ...expense,
      id: uuidv4()
    };

    if (household) {
      setHousehold({
        ...household,
        expenses: [...household.expenses, newExpense]
      });
    }

    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    if (!household) return;
    setHousehold({
      ...household,
      expenses: household.expenses.map(e =>
        e.id === id ? { ...e, ...updates } : e
      )
    });
  };

  const removeExpense = (id: string) => {
    if (!household) return;
    setHousehold({
      ...household,
      expenses: household.expenses.filter(e => e.id !== id)
    });
  };

  const markSplitPaid = (expenseId: string, roommateId: string, paid: boolean) => {
    if (!household) return;
    setHousehold({
      ...household,
      expenses: household.expenses.map(expense => {
        if (expense.id === expenseId) {
          return {
            ...expense,
            splits: expense.splits.map(split => {
              if (split.roommateId === roommateId) {
                return {
                  ...split,
                  paid,
                  paidDate: paid ? new Date().toISOString() : undefined
                };
              }
              return split;
            })
          };
        }
        return expense;
      })
    });
  };

  const updateAgreement = (agreement: Agreement) => {
    if (!household) return;
    setHousehold({
      ...household,
      agreement
    });
  };

  const exportHousehold = (): string => {
    return JSON.stringify(household);
  };

  const importHousehold = (data: string) => {
    try {
      const imported = JSON.parse(data) as Household;
      setHousehold(imported);
      return true;
    } catch {
      return false;
    }
  };

  const clearHousehold = () => {
    setHousehold(null);
  };

  return {
    household,
    createHousehold,
    updateHousehold,
    addRoommate,
    updateRoommate,
    removeRoommate,
    addRoom,
    updateRoom,
    removeRoom,
    addExpense,
    updateExpense,
    removeExpense,
    markSplitPaid,
    updateAgreement,
    exportHousehold,
    importHousehold,
    clearHousehold
  };
}
