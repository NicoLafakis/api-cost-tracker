import { useState, useEffect, useCallback } from 'react';
import { Household, Roommate, Room, Expense, Agreement } from '../types';
import api from '../services/api';
import socketService from '../services/socket';

const ROOMMATE_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6',
  '#ef4444', '#10b981', '#3b82f6', '#f97316', '#06b6d4'
];

export function useHouseholdApi() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [households, setHouseholds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's households
  const loadHouseholds = useCallback(async () => {
    try {
      const data = await api.getUserHouseholds();
      setHouseholds(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  // Load specific household
  const loadHousehold = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getHousehold(id);
      setHousehold(data);

      // Join socket room for real-time updates
      socketService.joinHousehold(id);

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up real-time event listeners
  useEffect(() => {
    if (!household) return;

    const unsubscribers = [
      // Household updates
      socketService.on('household-updated', (data) => {
        if (data.householdId === household.id) {
          setHousehold(prev => prev ? { ...prev, ...data } : null);
        }
      }),

      // Roommate events
      socketService.on('roommate-created', (data) => {
        if (data.householdId === household.id) {
          setHousehold(prev => prev ? {
            ...prev,
            roommates: [...prev.roommates, data]
          } : null);
        }
      }),
      socketService.on('roommate-updated', (data) => {
        setHousehold(prev => prev ? {
          ...prev,
          roommates: prev.roommates.map(r => r.id === data.id ? { ...r, ...data } : r)
        } : null);
      }),
      socketService.on('roommate-deleted', (data) => {
        setHousehold(prev => prev ? {
          ...prev,
          roommates: prev.roommates.filter(r => r.id !== data.id)
        } : null);
      }),

      // Room events
      socketService.on('room-created', (data) => {
        if (data.householdId === household.id) {
          setHousehold(prev => prev ? {
            ...prev,
            rooms: [...prev.rooms, data]
          } : null);
        }
      }),
      socketService.on('room-updated', (data) => {
        setHousehold(prev => prev ? {
          ...prev,
          rooms: prev.rooms.map(r => r.id === data.id ? { ...r, ...data } : r)
        } : null);
      }),
      socketService.on('room-deleted', (data) => {
        setHousehold(prev => prev ? {
          ...prev,
          rooms: prev.rooms.filter(r => r.id !== data.id)
        } : null);
      }),

      // Expense events
      socketService.on('expense-created', (data) => {
        if (data.householdId === household.id) {
          setHousehold(prev => prev ? {
            ...prev,
            expenses: [...prev.expenses, data]
          } : null);
        }
      }),
      socketService.on('expense-updated', (data) => {
        setHousehold(prev => prev ? {
          ...prev,
          expenses: prev.expenses.map(e => e.id === data.id ? { ...e, ...data } : e)
        } : null);
      }),
      socketService.on('expense-deleted', (data) => {
        setHousehold(prev => prev ? {
          ...prev,
          expenses: prev.expenses.filter(e => e.id !== data.id)
        } : null);
      }),

      // Split payment events
      socketService.on('split-paid', ({ expenseId, roommateId }) => {
        setHousehold(prev => prev ? {
          ...prev,
          expenses: prev.expenses.map(e => {
            if (e.id === expenseId) {
              return {
                ...e,
                splits: e.splits.map(s =>
                  s.roommateId === roommateId
                    ? { ...s, paid: true, paidDate: new Date().toISOString() }
                    : s
                )
              };
            }
            return e;
          })
        } : null);
      }),
      socketService.on('split-unpaid', ({ expenseId, roommateId }) => {
        setHousehold(prev => prev ? {
          ...prev,
          expenses: prev.expenses.map(e => {
            if (e.id === expenseId) {
              return {
                ...e,
                splits: e.splits.map(s =>
                  s.roommateId === roommateId
                    ? { ...s, paid: false, paidDate: undefined }
                    : s
                )
              };
            }
            return e;
          })
        } : null);
      }),

      // Agreement events
      socketService.on('agreement-updated', (data) => {
        if (data.householdId === household.id) {
          setHousehold(prev => prev ? { ...prev, agreement: data } : null);
        }
      }),
      socketService.on('agreement-signed', (data) => {
        if (data.householdId === household.id) {
          setHousehold(prev => {
            if (!prev || !prev.agreement) return prev;
            return {
              ...prev,
              agreement: {
                ...prev.agreement,
                signatures: [...prev.agreement.signatures, { roommateId: data.roommateId, signedAt: data.signedAt }]
              }
            };
          });
        }
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
      socketService.leaveHousehold(household.id);
    };
  }, [household?.id]);

  const createHousehold = async (name: string, totalRent: number): Promise<Household> => {
    const data = await api.createHousehold(name, totalRent);
    const newHousehold: Household = {
      id: data.id,
      name: data.name,
      totalRent: data.totalRent,
      createdAt: data.createdAt,
      roommates: [],
      rooms: [],
      expenses: []
    };
    setHousehold(newHousehold);
    socketService.joinHousehold(data.id);
    await loadHouseholds();
    return newHousehold;
  };

  const updateHousehold = async (updates: Partial<Household>) => {
    if (!household) return;
    await api.updateHousehold(household.id, updates);
    setHousehold({ ...household, ...updates });
  };

  const addRoommate = async (name: string, paymentMethods?: Roommate['paymentMethods']): Promise<Roommate> => {
    if (!household) throw new Error('No household loaded');

    const colorIndex = household.roommates.length;
    const color = ROOMMATE_COLORS[colorIndex % ROOMMATE_COLORS.length];

    const data = await api.createRoommate({
      householdId: household.id,
      name,
      color,
      paymentMethods
    });

    return data;
  };

  const updateRoommate = async (id: string, updates: Partial<Roommate>) => {
    await api.updateRoommate(id, updates);
  };

  const removeRoommate = async (id: string) => {
    await api.deleteRoommate(id);
  };

  const addRoom = async (room: Omit<Room, 'id'>): Promise<Room> => {
    if (!household) throw new Error('No household loaded');

    const data = await api.createRoom({
      householdId: household.id,
      ...room
    });

    return data;
  };

  const updateRoom = async (id: string, updates: Partial<Room>) => {
    await api.updateRoom(id, updates);
  };

  const removeRoom = async (id: string) => {
    await api.deleteRoom(id);
  };

  const addExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
    if (!household) throw new Error('No household loaded');

    const data = await api.createExpense({
      householdId: household.id,
      ...expense
    });

    return data;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    await api.updateExpense(id, updates);
  };

  const removeExpense = async (id: string) => {
    await api.deleteExpense(id);
  };

  const markSplitPaid = async (expenseId: string, roommateId: string, paid: boolean) => {
    if (paid) {
      await api.markSplitPaid(expenseId, roommateId);
    } else {
      await api.markSplitUnpaid(expenseId, roommateId);
    }
  };

  const updateAgreement = async (agreement: Agreement) => {
    if (!household) return;
    await api.saveAgreement({
      householdId: household.id,
      ...agreement
    });
  };

  const signAgreement = async (roommateId: string) => {
    if (!household) return;
    await api.signAgreement(household.id, roommateId);
  };

  const joinHousehold = async (inviteCode: string) => {
    const data = await api.joinHousehold(inviteCode);
    await loadHouseholds();
    return data;
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
    if (household) {
      socketService.leaveHousehold(household.id);
    }
    setHousehold(null);
  };

  const switchHousehold = async (id: string) => {
    if (household) {
      socketService.leaveHousehold(household.id);
    }
    await loadHousehold(id);
  };

  return {
    household,
    households,
    isLoading,
    error,
    loadHouseholds,
    loadHousehold,
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
    signAgreement,
    joinHousehold,
    exportHousehold,
    importHousehold,
    clearHousehold,
    switchHousehold
  };
}
