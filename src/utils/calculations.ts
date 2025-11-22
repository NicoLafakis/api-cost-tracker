import { Household, Room, CalculationMethod, RoomBreakdown, Balance, RoommateBalance } from '../types';

export function calculateRentSplit(
  household: Household,
  method: CalculationMethod,
  coupleMultiplier: number = 1.5
): RoomBreakdown[] {
  const { totalRent, rooms, roommates } = household;

  if (rooms.length === 0 || roommates.length === 0) {
    return [];
  }

  // Calculate total occupants accounting for couples
  let totalOccupants = 0;
  rooms.forEach(room => {
    const occupantCount = room.isCouple ? coupleMultiplier : room.occupants.length;
    totalOccupants += occupantCount;
  });

  // Calculate common area rent (typically 10-30% of total)
  const commonAreaPercent = 0.2;
  const commonAreaRent = totalRent * commonAreaPercent;
  const roomsRent = totalRent - commonAreaRent;

  switch (method) {
    case 'equal':
      return calculateEqualSplit(rooms, roomsRent, commonAreaRent, totalOccupants, coupleMultiplier);
    case 'sqft':
      return calculateSqftSplit(rooms, roomsRent, commonAreaRent, totalOccupants, coupleMultiplier);
    case 'tiered':
      return calculateTieredSplit(rooms, roomsRent, commonAreaRent, totalOccupants, coupleMultiplier);
    case 'custom':
      return calculateCustomSplit(rooms, commonAreaRent, totalOccupants, coupleMultiplier);
    default:
      return calculateEqualSplit(rooms, roomsRent, commonAreaRent, totalOccupants, coupleMultiplier);
  }
}

function calculateEqualSplit(
  rooms: Room[],
  roomsRent: number,
  commonAreaRent: number,
  totalOccupants: number,
  coupleMultiplier: number
): RoomBreakdown[] {
  const rentPerRoom = roomsRent / rooms.length;
  const commonAreaPerOccupant = commonAreaRent / totalOccupants;

  return rooms.map(room => {
    const occupantCount = room.isCouple ? coupleMultiplier : room.occupants.length;
    const commonAreaShare = commonAreaPerOccupant * occupantCount;
    const totalRent = rentPerRoom + commonAreaShare;
    const perPersonRent = room.occupants.length > 0 ? totalRent / room.occupants.length : 0;

    return {
      roomId: room.id,
      roomName: room.name,
      baseRent: rentPerRoom,
      commonAreaShare,
      totalRent,
      occupants: room.occupants,
      perPersonRent
    };
  });
}

function calculateSqftSplit(
  rooms: Room[],
  roomsRent: number,
  commonAreaRent: number,
  totalOccupants: number,
  coupleMultiplier: number
): RoomBreakdown[] {
  const totalSqft = rooms.reduce((sum, room) => sum + room.squareFootage, 0);
  const commonAreaPerOccupant = commonAreaRent / totalOccupants;

  return rooms.map(room => {
    const sqftRatio = room.squareFootage / totalSqft;
    const baseRent = roomsRent * sqftRatio;
    const occupantCount = room.isCouple ? coupleMultiplier : room.occupants.length;
    const commonAreaShare = commonAreaPerOccupant * occupantCount;
    const totalRent = baseRent + commonAreaShare;
    const perPersonRent = room.occupants.length > 0 ? totalRent / room.occupants.length : 0;

    return {
      roomId: room.id,
      roomName: room.name,
      baseRent,
      commonAreaShare,
      totalRent,
      occupants: room.occupants,
      perPersonRent
    };
  });
}

function calculateTieredSplit(
  rooms: Room[],
  roomsRent: number,
  commonAreaRent: number,
  totalOccupants: number,
  coupleMultiplier: number
): RoomBreakdown[] {
  const tierMultipliers = {
    premium: 1.3,
    standard: 1.0,
    economy: 0.7
  };

  const totalWeight = rooms.reduce((sum, room) => {
    const multiplier = tierMultipliers[room.tier || 'standard'];
    return sum + multiplier;
  }, 0);

  const commonAreaPerOccupant = commonAreaRent / totalOccupants;

  return rooms.map(room => {
    const multiplier = tierMultipliers[room.tier || 'standard'];
    const baseRent = (roomsRent * multiplier) / totalWeight;
    const occupantCount = room.isCouple ? coupleMultiplier : room.occupants.length;
    const commonAreaShare = commonAreaPerOccupant * occupantCount;
    const totalRent = baseRent + commonAreaShare;
    const perPersonRent = room.occupants.length > 0 ? totalRent / room.occupants.length : 0;

    return {
      roomId: room.id,
      roomName: room.name,
      baseRent,
      commonAreaShare,
      totalRent,
      occupants: room.occupants,
      perPersonRent
    };
  });
}

function calculateCustomSplit(
  rooms: Room[],
  commonAreaRent: number,
  totalOccupants: number,
  coupleMultiplier: number
): RoomBreakdown[] {
  const commonAreaPerOccupant = commonAreaRent / totalOccupants;

  return rooms.map(room => {
    const baseRent = room.rentAmount || 0;
    const occupantCount = room.isCouple ? coupleMultiplier : room.occupants.length;
    const commonAreaShare = commonAreaPerOccupant * occupantCount;
    const totalRent = baseRent + commonAreaShare;
    const perPersonRent = room.occupants.length > 0 ? totalRent / room.occupants.length : 0;

    return {
      roomId: room.id,
      roomName: room.name,
      baseRent,
      commonAreaShare,
      totalRent,
      occupants: room.occupants,
      perPersonRent
    };
  });
}

export function calculateBalances(household: Household): Balance[] {
  const { expenses, roommates } = household;

  // Calculate net balance for each roommate
  const roommateBalances: Record<string, number> = {};
  roommates.forEach(r => {
    roommateBalances[r.id] = 0;
  });

  expenses.forEach(expense => {
    // Add what the payer is owed
    expense.splits.forEach(split => {
      if (split.roommateId !== expense.paidBy && !split.paid) {
        roommateBalances[expense.paidBy] += split.amount;
        roommateBalances[split.roommateId] -= split.amount;
      }
    });
  });

  // Simplify debts
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  Object.entries(roommateBalances).forEach(([id, amount]) => {
    if (amount > 0.01) {
      creditors.push({ id, amount });
    } else if (amount < -0.01) {
      debtors.push({ id, amount: -amount });
    }
  });

  // Sort by amount descending
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const balances: Balance[] = [];

  // Match debtors to creditors
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0.01) {
      balances.push({
        from: debtor.id,
        to: creditor.id,
        amount: Math.round(amount * 100) / 100
      });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount < 0.01) creditors.shift();
    if (debtor.amount < 0.01) debtors.shift();
  }

  return balances;
}

export function getRoommateBalances(household: Household): RoommateBalance[] {
  const { expenses, roommates } = household;

  return roommates.map(roommate => {
    let owes = 0;
    let owed = 0;

    expenses.forEach(expense => {
      if (expense.paidBy === roommate.id) {
        // This roommate paid - they are owed by others
        expense.splits.forEach(split => {
          if (split.roommateId !== roommate.id && !split.paid) {
            owed += split.amount;
          }
        });
      } else {
        // Someone else paid - check if this roommate owes
        const mySplit = expense.splits.find(s => s.roommateId === roommate.id);
        if (mySplit && !mySplit.paid) {
          owes += mySplit.amount;
        }
      }
    });

    return {
      roommateId: roommate.id,
      owes: Math.round(owes * 100) / 100,
      owed: Math.round(owed * 100) / 100,
      net: Math.round((owed - owes) * 100) / 100
    };
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function generatePaymentLink(
  type: 'venmo' | 'cashapp' | 'zelle',
  handle: string,
  amount: number,
  note: string
): string {
  const encodedNote = encodeURIComponent(note);

  switch (type) {
    case 'venmo':
      return `venmo://paycharge?txn=pay&recipients=${handle}&amount=${amount}&note=${encodedNote}`;
    case 'cashapp':
      return `https://cash.app/$${handle}/${amount}`;
    case 'zelle':
      // Zelle doesn't have a universal deep link, open the app
      return `zelle://`;
    default:
      return '';
  }
}

export function calculateGuestCost(
  monthlyUtilities: number,
  nightsPerMonth: number,
  totalRoommates: number
): number {
  const dailyUtilityCost = monthlyUtilities / 30;
  const perPersonDaily = dailyUtilityCost / totalRoommates;
  return perPersonDaily * nightsPerMonth;
}
