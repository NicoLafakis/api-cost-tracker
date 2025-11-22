const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('roomsplit-token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('roomsplit-token', token);
    } else {
      localStorage.removeItem('roomsplit-token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, name: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async verifyToken() {
    return this.request<{ valid: boolean; user: any }>('/auth/verify');
  }

  async logout() {
    this.setToken(null);
  }

  // User endpoints
  async getProfile() {
    return this.request<any>('/users/me');
  }

  async updateProfile(data: { name?: string; avatarUrl?: string; preferences?: any }) {
    return this.request<any>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<any>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getUserHouseholds() {
    return this.request<any[]>('/users/me/households');
  }

  async getNotifications() {
    return this.request<any[]>('/users/me/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/users/me/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  // Household endpoints
  async createHousehold(name: string, totalRent: number) {
    return this.request<any>('/households', {
      method: 'POST',
      body: JSON.stringify({ name, totalRent }),
    });
  }

  async getHousehold(id: string) {
    return this.request<any>(`/households/${id}`);
  }

  async updateHousehold(id: string, data: { name?: string; totalRent?: number }) {
    return this.request<any>(`/households/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHousehold(id: string) {
    return this.request<any>(`/households/${id}`, {
      method: 'DELETE',
    });
  }

  async joinHousehold(inviteCode: string) {
    return this.request<any>('/households/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  }

  async regenerateInviteCode(householdId: string) {
    return this.request<{ inviteCode: string }>(`/households/${householdId}/invite-code`, {
      method: 'POST',
    });
  }

  async getHouseholdMembers(householdId: string) {
    return this.request<any[]>(`/households/${householdId}/members`);
  }

  async removeHouseholdMember(householdId: string, userId: string) {
    return this.request<any>(`/households/${householdId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async getActivityLog(householdId: string, limit?: number) {
    return this.request<any[]>(`/households/${householdId}/activity?limit=${limit || 50}`);
  }

  // Roommate endpoints
  async createRoommate(data: {
    householdId: string;
    name: string;
    color: string;
    paymentMethods?: any[];
    userId?: string;
  }) {
    return this.request<any>('/roommates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRoommate(id: string, data: {
    name?: string;
    color?: string;
    paymentMethods?: any[];
    paymentStreak?: number;
  }) {
    return this.request<any>(`/roommates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoommate(id: string) {
    return this.request<any>(`/roommates/${id}`, {
      method: 'DELETE',
    });
  }

  async linkRoommateToAccount(id: string) {
    return this.request<any>(`/roommates/${id}/link`, {
      method: 'POST',
    });
  }

  // Room endpoints
  async createRoom(data: {
    householdId: string;
    name: string;
    squareFootage: number;
    amenities?: string[];
    occupants?: string[];
    rentAmount?: number;
    tier?: string;
    isCouple?: boolean;
  }) {
    return this.request<any>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRoom(id: string, data: {
    name?: string;
    squareFootage?: number;
    amenities?: string[];
    occupants?: string[];
    rentAmount?: number;
    tier?: string;
    isCouple?: boolean;
  }) {
    return this.request<any>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoom(id: string) {
    return this.request<any>(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }

  // Expense endpoints
  async createExpense(data: {
    householdId: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    paidBy: string;
    splitMethod: string;
    splits: any[];
    recurring?: any;
  }) {
    return this.request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpense(id: string, data: {
    description?: string;
    amount?: number;
    category?: string;
    date?: string;
    paidBy?: string;
    splitMethod?: string;
    splits?: any[];
    recurring?: any;
  }) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async markSplitPaid(expenseId: string, roommateId: string) {
    return this.request<any>(`/expenses/${expenseId}/splits/${roommateId}/pay`, {
      method: 'POST',
    });
  }

  async markSplitUnpaid(expenseId: string, roommateId: string) {
    return this.request<any>(`/expenses/${expenseId}/splits/${roommateId}/unpay`, {
      method: 'POST',
    });
  }

  async getExpensesByCategory(householdId: string) {
    return this.request<any[]>(`/expenses/household/${householdId}/by-category`);
  }

  // Agreement endpoints
  async saveAgreement(data: {
    householdId: string;
    guestPolicy?: string;
    paymentDeadline?: string;
    choreRotation?: string;
    quietHours?: string;
    customSections?: any[];
  }) {
    return this.request<any>('/agreements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signAgreement(householdId: string, roommateId: string) {
    return this.request<any>(`/agreements/${householdId}/sign`, {
      method: 'POST',
      body: JSON.stringify({ roommateId }),
    });
  }

  async unsignAgreement(householdId: string, roommateId: string) {
    return this.request<any>(`/agreements/${householdId}/sign/${roommateId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
export default api;
