import type { 
  Organization, 
  Queue, 
  Token, 
  User, 
  StaffAssignment, 
  AnalyticsSummary, 
  HDMIDisplayPayload 
} from '../types';

const API_BASE = 'http://localhost:5000/api';

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const rawUser = localStorage.getItem('queless_user_session');
    if (!rawUser) return {};
    
    try {
      const user = JSON.parse(rawUser);
      // Pass token payload
      const tokenPayload = JSON.stringify({
        uid: user.USER_ID || user.uid,
        email: user.EMAIL || user.email,
        displayName: user.DISPLAY_NAME || user.displayName,
        photoURL: user.PHOTO_URL || user.photoURL
      });
      return { 'Authorization': `Bearer ${tokenPayload}` };
    } catch {
      return {};
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers || {})
    };

    const res = await fetch(url, { ...options, headers });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // 1. Auth & Profile
  async verifyAuth(): Promise<{ user: User; role: string; adminOrgs: Organization[]; staffAssignments: StaffAssignment[] }> {
    return this.request('/auth/verify', { method: 'POST' });
  }

  async getMe(): Promise<{ user: User; role: string; adminOrgs: Organization[]; staffAssignments: StaffAssignment[] }> {
    return this.request('/users/me');
  }

  async updateProfile(displayName: string, phone: string): Promise<{ message: string; user: User }> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ displayName, phone })
    });
  }

  // 2. Organizations
  async getOrganizations(params?: { category?: string; search?: string; city?: string }): Promise<{ organizations: Organization[] }> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.city) query.set('city', params.city);
    
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/organizations${qs}`);
  }

  async getOrganizationDetails(orgId: string): Promise<{ organization: Organization; queues: Queue[] }> {
    return this.request(`/organizations/${orgId}`);
  }

  async registerOrganization(data: {
    name: string;
    category: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    subscriptionTier?: string;
    address?: string;
    city?: string;
  }): Promise<{ message: string; organization: Organization }> {
    return this.request('/organizations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateOrganization(orgId: string, data: Record<string, any>): Promise<{ message: string; organization: Organization }> {
    return this.request(`/organizations/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // 3. Queues
  async createQueue(orgId: string, data: {
    name: string;
    prefix?: string;
    counterLabel?: string;
    avgServiceMins?: number;
    maxDailyTokens?: number;
    operatingHours?: string;
    staffEmails?: string[];
  }): Promise<{ message: string; queue: Queue; staff: StaffAssignment[] }> {
    return this.request(`/queues/org/${orgId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateQueue(queueId: string, data: Record<string, any>): Promise<{ message: string; queue: Queue }> {
    return this.request(`/queues/${queueId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async togglePauseQueue(queueId: string): Promise<{ message: string; isPaused: boolean }> {
    return this.request(`/queues/${queueId}/toggle-pause`, { method: 'POST' });
  }

  async deleteQueue(queueId: string): Promise<{ message: string }> {
    return this.request(`/queues/${queueId}`, { method: 'DELETE' });
  }

  // 4. Staff & Auto-Routing
  async getMyStaffQueues(): Promise<{ queues: Queue[] }> {
    return this.request('/staff/my-queues');
  }

  async getQueueStaff(queueId: string): Promise<{ staff: StaffAssignment[] }> {
    return this.request(`/staff/queue/${queueId}`);
  }

  async assignStaff(queueId: string, staffEmail: string, role: string = 'OPERATOR'): Promise<{ message: string; assignment: StaffAssignment }> {
    return this.request(`/staff/queue/${queueId}`, {
      method: 'POST',
      body: JSON.stringify({ staffEmail, role })
    });
  }

  async removeStaff(assignmentId: string): Promise<{ message: string }> {
    return this.request(`/staff/${assignmentId}`, { method: 'DELETE' });
  }

  // 5. Tokens & Customer Pass Operations
  async bookToken(queueId: string, data: { customerName?: string; customerPhone?: string; serviceNote?: string }): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/queue/${queueId}/book`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getMyTokens(): Promise<{ tokens: Token[] }> {
    return this.request('/tokens/my-tokens');
  }

  async getQueueTokens(queueId: string): Promise<{ queue: Queue; tokens: Token[] }> {
    return this.request(`/tokens/queue/${queueId}`);
  }

  async callToken(tokenId: string): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/call`, { method: 'POST' });
  }

  async serveToken(tokenId: string): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/serve`, { method: 'POST' });
  }

  async completeToken(tokenId: string): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/complete`, { method: 'POST' });
  }

  async markNoShow(tokenId: string): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/no-show`, { method: 'POST' });
  }

  async cancelToken(tokenId: string): Promise<{ message: string }> {
    return this.request(`/tokens/${tokenId}/cancel`, { method: 'POST' });
  }

  async requestDelay(tokenId: string): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/delay-request`, { method: 'POST' });
  }

  async approveDelay(tokenId: string): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/delay-approve`, { method: 'POST' });
  }

  async rejectDelay(tokenId: string): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/delay-reject`, { method: 'POST' });
  }

  async rescheduleToken(tokenId: string): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/reschedule`, { method: 'POST' });
  }

  async transferToken(tokenId: string, targetQueueId: string): Promise<{ message: string }> {
    return this.request(`/tokens/${tokenId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ targetQueueId })
    });
  }

  async issueWalkInToken(queueId: string, data: { customerName: string; customerPhone: string; serviceNote?: string }): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/queue/${queueId}/walk-in`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 6. HDMI Screen Data
  async getHDMIDisplayData(queueId: string): Promise<HDMIDisplayPayload> {
    return this.request(`/display/queue/${queueId}`);
  }

  // 7. Analytics
  async getAnalytics(orgId: string): Promise<AnalyticsSummary> {
    return this.request(`/analytics/org/${orgId}`);
  }

  getExportCsvUrl(orgId: string): string {
    return `${API_BASE}/analytics/org/${orgId}/export`;
  }
}

export const api = new ApiClient();
