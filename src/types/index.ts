export interface Household {
  id: string;
  name: string;
  totalRent: number;
  createdAt: string;
  roommates: Roommate[];
  rooms: Room[];
  expenses: Expense[];
  agreement?: Agreement;
}

export interface Roommate {
  id: string;
  name: string;
  color: string;
  paymentMethods?: PaymentMethod[];
  paymentStreak?: number;
}

export interface Room {
  id: string;
  name: string;
  squareFootage: number;
  amenities: string[];
  occupants: string[];
  rentAmount?: number;
  tier?: 'premium' | 'standard' | 'economy';
  isCouple?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paidBy: string;
  splitMethod: SplitMethod;
  splits: Split[];
  recurring?: RecurringConfig;
}

export type ExpenseCategory = 'rent' | 'utilities' | 'groceries' | 'supplies' | 'other';

export type SplitMethod = 'equal' | 'custom' | 'percentage';

export interface Split {
  roommateId: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
}

export interface RecurringConfig {
  frequency: 'weekly' | 'monthly';
  nextDue: string;
}

export interface PaymentMethod {
  type: 'venmo' | 'cashapp' | 'zelle';
  handle: string;
}

export type CalculationMethod = 'equal' | 'sqft' | 'tiered' | 'custom';

export interface RentCalculation {
  method: CalculationMethod;
  roomBreakdown: RoomBreakdown[];
  commonAreaSplit: number;
  coupleAdjustment: number;
}

export interface RoomBreakdown {
  roomId: string;
  roomName: string;
  baseRent: number;
  commonAreaShare: number;
  totalRent: number;
  occupants: string[];
  perPersonRent: number;
}

export interface Agreement {
  guestPolicy: string;
  paymentDeadline: string;
  choreRotation: string;
  quietHours: string;
  customSections: AgreementSection[];
  signatures: Signature[];
}

export interface AgreementSection {
  title: string;
  content: string;
}

export interface Signature {
  roommateId: string;
  signedAt: string;
}

export interface Balance {
  from: string;
  to: string;
  amount: number;
}

export interface RoommateBalance {
  roommateId: string;
  owes: number;
  owed: number;
  net: number;
}
