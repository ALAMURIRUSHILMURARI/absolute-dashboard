import {
  User,
  Person,
  Transaction,
  Schedule,
  Reminder,
  NotificationItem,
  PersonBalanceSummary,
  DueItem,
  AnalyticsData,
  DailyPayment,
  DailyPaymentsSummary,
} from '../types';

const BASE_URL = '/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('absolute_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = 'An error occurred';
      try {
        const data = await res.json();
        errorMsg = data.error || errorMsg;
      } catch (e) {
        errorMsg = `Server error (${res.status})`;
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // Auth
  async login(payload: { email: string; password: string }): Promise<{ token: string; user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async signup(payload: { name: string; email: string; password: string; currency?: string }): Promise<{ token: string; user: User }> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async demoLogin(): Promise<{ token: string; user: User }> {
    return this.request('/auth/demo', {
      method: 'POST',
    });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request('/auth/me');
  }

  async updateProfile(payload: { name?: string; avatarUrl?: string; preferences?: Partial<User['preferences']> }): Promise<{ user: User }> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async updatePreferences(preferences: Partial<User['preferences']>): Promise<{ user: User }> {
    return this.updateProfile({ preferences });
  }

  async deleteAccount(): Promise<{ message: string }> {
    return this.request('/auth/account', {
      method: 'DELETE',
    });
  }

  // People
  async getPeople(): Promise<{ people: PersonBalanceSummary[] }> {
    return this.request('/people');
  }

  async getPerson(id: string): Promise<{
    person: Person;
    balances: { youOwe: number; theyOweYou: number; netBalance: number; pendingCount: number };
    transactions: Transaction[];
  }> {
    return this.request(`/people/${id}`);
  }

  async createPerson(payload: Partial<Person>): Promise<{ person: Person }> {
    return this.request('/people', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updatePerson(id: string, payload: Partial<Person>): Promise<{ person: Person }> {
    return this.request(`/people/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deletePerson(id: string): Promise<{ message: string }> {
    return this.request(`/people/${id}`, {
      method: 'DELETE',
    });
  }

  // Transactions
  async getTransactions(params?: { personId?: string; status?: string; direction?: string; limit?: number }): Promise<{ transactions: Transaction[] }> {
    const query = new URLSearchParams();
    if (params?.personId) query.set('personId', params.personId);
    if (params?.status) query.set('status', params.status);
    if (params?.direction) query.set('direction', params.direction);
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/transactions${qs}`);
  }

  async createTransaction(payload: any): Promise<{ transaction: Transaction; balances: any }> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async settleUp(payload: {
    personId: string;
    amount: number;
    paymentMethod?: string;
    date?: string;
    notes?: string;
    specificTransactionId?: string;
  }): Promise<{ message: string; settlementTransaction: Transaction; balances: any }> {
    return this.request('/transactions/settle', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTransaction(id: string, payload: Partial<Transaction>): Promise<{ transaction: Transaction }> {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTransaction(id: string): Promise<{ message: string }> {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  private getLocalVaultPayments(): DailyPayment[] {
    try {
      const stored = localStorage.getItem('ABSOLUTE_VAULT_PAYMENTS');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  private saveLocalVaultPayments(payments: DailyPayment[]) {
    try {
      const seenIds = new Set<string>();
      const seenContentKeys = new Set<string>();
      const deduped: DailyPayment[] = [];

      for (const p of payments) {
        if (!p || !p.id) continue;
        const contentKey = `${p.date}_${(p.reason || '').toLowerCase().trim()}_${p.amount}_${p.flow || 'OUTGOING'}`;
        if (!seenIds.has(p.id) && !seenContentKeys.has(contentKey)) {
          seenIds.add(p.id);
          seenContentKeys.add(contentKey);
          deduped.push(p);
        }
      }
      localStorage.setItem('ABSOLUTE_VAULT_PAYMENTS', JSON.stringify(deduped));
    } catch (e) {
      console.warn('Vault cache save warning:', e);
    }
  }

  // Daily Payments
  async getDailyPayments(params?: { date?: string; startDate?: string; endDate?: string; method?: string; flow?: string; search?: string }): Promise<{ payments: DailyPayment[]; totalCount: number }> {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.method) query.set('method', params.method);
    if (params?.flow) query.set('flow', params.flow);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';

    try {
      const res = await this.request<{ payments: DailyPayment[]; totalCount: number }>(`/daily-payments${qs}`);
      const localVault = this.getLocalVaultPayments();

      const serverIds = new Set(res.payments.map(p => p.id));
      const serverContentKeys = new Set(res.payments.map(p => `${p.date}_${(p.reason || '').toLowerCase().trim()}_${p.amount}_${p.flow || 'OUTGOING'}`));

      const missingLocalItems = localVault.filter(lp => {
        const key = `${lp.date}_${(lp.reason || '').toLowerCase().trim()}_${lp.amount}_${lp.flow || 'OUTGOING'}`;
        return !serverIds.has(lp.id) && !serverContentKeys.has(key);
      });

      if (missingLocalItems.length > 0 && !params?.date && !params?.search) {
        // Auto sync missing items back to server preserving original ID
        this.bulkCreateDailyPayments({
          items: missingLocalItems.map(item => ({
            id: item.id,
            amount: item.amount,
            reason: item.reason,
            flow: item.flow,
            paymentMethod: item.paymentMethod,
            date: item.date,
            time: item.time,
            category: item.category,
            notes: item.notes,
          })),
        }).catch(err => console.warn('Background sync warning:', err));

        const combined = [...res.payments, ...missingLocalItems];
        this.saveLocalVaultPayments(combined);
        return { payments: combined, totalCount: combined.length };
      } else {
        if (!params?.date && !params?.search && res.payments.length > 0) {
          this.saveLocalVaultPayments(res.payments);
        }
        return res;
      }
    } catch (err) {
      // Server connection fallback: return local vault cached payments
      const localVault = this.getLocalVaultPayments();
      return { payments: localVault, totalCount: localVault.length };
    }
  }

  async getDailyPaymentsSummary(): Promise<DailyPaymentsSummary> {
    return this.request('/daily-payments/summary');
  }

  async createDailyPayment(payload: Partial<DailyPayment>): Promise<{ payment: DailyPayment }> {
    const res = await this.request<{ payment: DailyPayment }>('/daily-payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res?.payment) {
      const currentVault = this.getLocalVaultPayments();
      this.saveLocalVaultPayments([res.payment, ...currentVault.filter(p => p.id !== res.payment.id)]);
    }
    return res;
  }

  async bulkCreateDailyPayments(payload: { items: Partial<DailyPayment>[]; date?: string }): Promise<{ message: string; payments: DailyPayment[] }> {
    const res = await this.request<{ message: string; payments: DailyPayment[] }>('/daily-payments/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res?.payments && Array.isArray(res.payments)) {
      const currentVault = this.getLocalVaultPayments();
      const newIds = new Set(res.payments.map(p => p.id));
      this.saveLocalVaultPayments([...res.payments, ...currentVault.filter(p => !newIds.has(p.id))]);
    }
    return res;
  }

  async updateDailyPayment(id: string, payload: Partial<DailyPayment>): Promise<{ payment: DailyPayment }> {
    const res = await this.request<{ payment: DailyPayment }>(`/daily-payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (res?.payment) {
      const currentVault = this.getLocalVaultPayments();
      this.saveLocalVaultPayments(currentVault.map(p => (p.id === id ? res.payment : p)));
    }
    return res;
  }

  async deleteDailyPayment(id: string): Promise<{ message: string }> {
    const currentVault = this.getLocalVaultPayments();
    const target = currentVault.find(p => p.id === id);

    if (target) {
      const filtered = currentVault.filter(
        p => !(p.id === id || (p.date === target.date && p.reason === target.reason && p.amount === target.amount))
      );
      try {
        localStorage.setItem('ABSOLUTE_VAULT_PAYMENTS', JSON.stringify(filtered));
      } catch (e) {}
    } else {
      const filtered = currentVault.filter(p => p.id !== id);
      try {
        localStorage.setItem('ABSOLUTE_VAULT_PAYMENTS', JSON.stringify(filtered));
      } catch (e) {}
    }

    const res = await this.request<{ message: string }>(`/daily-payments/${id}`, {
      method: 'DELETE',
    });

    return res;
  }

  // Schedules
  async getSchedules(params?: { date?: string; month?: string; category?: string; priority?: string }): Promise<{ schedules: Schedule[] }> {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.month) query.set('month', params.month);
    if (params?.category) query.set('category', params.category);
    if (params?.priority) query.set('priority', params.priority);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/schedules${qs}`);
  }

  async createSchedule(payload: Partial<Schedule>): Promise<{ schedule: Schedule }> {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateSchedule(id: string, payload: Partial<Schedule>): Promise<{ schedule: Schedule }> {
    return this.request(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async toggleSchedule(id: string): Promise<{ schedule: Schedule }> {
    return this.request(`/schedules/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async sendScheduleEmailAlert(id: string): Promise<{ message: string; result: any }> {
    return this.request(`/schedules/${id}/send-email-alert`, {
      method: 'POST',
    });
  }

  async sendTestPriorityEmail(priority: string, email?: string): Promise<{ message: string; targetEmail: string; result: any }> {
    return this.request('/schedules/test-priority-email', {
      method: 'POST',
      body: JSON.stringify({ priority, email }),
    });
  }

  async deleteSchedule(id: string): Promise<{ message: string }> {
    return this.request(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  // Dues
  async getDues(params?: { filter?: string; sortBy?: string }): Promise<{
    summary: { totalIOwe: number; totalTheyOweMe: number; netBalance: number; iOweCount: number; theyOweMeCount: number };
    iOwe: DueItem[];
    theyOweMe: DueItem[];
  }> {
    const query = new URLSearchParams();
    if (params?.filter) query.set('filter', params.filter);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/dues${qs}`);
  }

  // Reminders
  async getReminders(params?: { status?: string; type?: string }): Promise<{ reminders: Reminder[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/reminders${qs}`);
  }

  async createReminder(payload: Partial<Reminder>): Promise<{ reminder: Reminder }> {
    return this.request('/reminders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async toggleReminder(id: string): Promise<{ reminder: Reminder }> {
    return this.request(`/reminders/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteReminder(id: string): Promise<{ message: string }> {
    return this.request(`/reminders/${id}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    return this.request('/notifications');
  }

  async markNotificationRead(id: string): Promise<{ notification: NotificationItem }> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead(): Promise<{ message: string }> {
    return this.request('/notifications/read-all', {
      method: 'POST',
    });
  }

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    return this.request('/analytics');
  }

  // Global Search
  async search(query: string): Promise<{
    query: string;
    resultsCount: number;
    people: Person[];
    transactions: (Transaction & { personName: string })[];
    schedules: Schedule[];
    reminders: Reminder[];
  }> {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // Settings
  async exportData(): Promise<any> {
    return this.request('/settings/export');
  }

  async importData(data: any): Promise<{ message: string; stats: any }> {
    return this.request('/settings/import', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async saveSmtpConfig(payload: { smtpUser: string; smtpPass: string; smtpHost?: string; smtpPort?: number }): Promise<{ message: string; smtpUser: string }> {
    return this.request('/settings/smtp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resetDemoData(): Promise<{ message: string }> {
    return this.request('/settings/reset-demo', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
