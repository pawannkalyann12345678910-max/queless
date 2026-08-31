import type { 
  Organization, 
  Queue, 
  Token, 
  User, 
  StaffAssignment, 
  AnalyticsSummary, 
  HDMIDisplayPayload 
} from '../types';

const ENV_API_URL = import.meta.env.VITE_API_BASE_URL;
const API_PORT = import.meta.env.VITE_API_PORT || '5000';

const API_BASE = ENV_API_URL 
  ? ENV_API_URL 
  : typeof window !== 'undefined' 
    ? `http://${window.location.hostname || 'localhost'}:${API_PORT}/api` 
    : `http://localhost:${API_PORT}/api`;

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
    isActive?: boolean | number;
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

  async toggleQueueVisibility(queueId: string): Promise<{ message: string; isActive: boolean }> {
    return this.request(`/queues/${queueId}/toggle-visibility`, { method: 'POST' });
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

  async requestDelay(tokenId: string, delayMins: number = 5, reason: string = '🚗 Parking / Traffic Delay'): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/delay-request`, {
      method: 'POST',
      body: JSON.stringify({ delayMins, reason })
    });
  }

  async approveDelay(tokenId: string, customShift?: number): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/delay-approve`, {
      method: 'POST',
      body: JSON.stringify({ customShift })
    });
  }

  async rejectDelay(tokenId: string): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/delay-reject`, { method: 'POST' });
  }

  async offerReschedule(tokenId: string, reason?: string): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/offer-reschedule`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async rescheduleToken(tokenId: string, choice?: 'NEXT_DAY' | 'NEXT_WEEK', targetDate?: string): Promise<{ message: string; token: Token }> {
    return this.request(`/tokens/${tokenId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ choice, targetDate })
    });
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
  // 7. Analytics
  async getAnalytics(orgId: string): Promise<AnalyticsSummary> {
    return this.request(`/analytics/org/${orgId}`);
  }

  getExportCsvUrl(orgId: string): string {
    return `${API_BASE}/analytics/org/${orgId}/export`;
  }

  // 8. WhatsApp Integration
  async getWhatsAppStatus(sessionId: string): Promise<{
    sessionId: string;
    status: 'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED';
    qrCodeUrl: string | null;
    userNumber: string | null;
    userName?: string | null;
  }> {
    return this.request(`/whatsapp/status/${sessionId}`);
  }

  async connectWhatsApp(sessionId: string): Promise<any> {
    return this.request(`/whatsapp/connect/${sessionId}`, { method: 'POST' });
  }

  async disconnectWhatsApp(sessionId: string): Promise<any> {
    return this.request(`/whatsapp/disconnect/${sessionId}`, { method: 'POST' });
  }

  async sendTokenWhatsAppAlert(payload: {
    orgId?: string;
    queueId?: string;
    tokenId: string;
    phone?: string;
    messageType?: 'CALL' | 'ADVANCE_5M' | 'CUSTOM';
    customText?: string;
  }): Promise<{
    success: boolean;
    connected: boolean;
    message?: string;
    senderType?: 'STAFF' | 'ADMIN';
    sender?: string;
    recipient?: string;
    directWaLink?: string;
    messageBody?: string;
  }> {
    return this.request('/whatsapp/send-token-alert', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async toggleQueueStaffWhatsApp(queueId: string, allowStaffWhatsApp: boolean): Promise<{ success: boolean; allowStaffWhatsApp: number }> {
    return this.request(`/whatsapp/queue/${queueId}/toggle-staff-whatsapp`, {
      method: 'PUT',
      body: JSON.stringify({ allowStaffWhatsApp })
    });
  }

  // 9. Vapi Voice AI Calling
  async getVapiConfig(orgId: string): Promise<{
    configured: boolean;
    apiKeyMasked: string;
    phoneNumberId: string;
    phoneNumber: string;
    assistantId: string;
  }> {
    return this.request(`/vapi/config/${orgId}`);
  }

  async saveVapiConfig(orgId: string, data: { apiKey: string; phoneNumberId?: string; assistantId?: string }): Promise<{
    success: boolean;
    message: string;
    phoneNumberId: string;
    phoneNumber: string;
    assistantId: string;
    availablePhoneNumbers: Array<{ id: string; number: string; name: string }>;
    availableAssistants: Array<{ id: string; name: string }>;
  }> {
    return this.request(`/vapi/config/${orgId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async testVapiCall(orgId: string, testPhone: string): Promise<{
    success: boolean;
    message: string;
    callId: string;
    status: string;
  }> {
    return this.request(`/vapi/test-call/${orgId}`, {
      method: 'POST',
      body: JSON.stringify({ testPhone })
    });
  }

  async callTokenViaVapi(payload: { tokenId: string; queueId?: string; orgId?: string }): Promise<{
    success: boolean;
    callId: string;
    status: string;
    recipient: string;
    tokenNumber: string;
    customerName: string;
  }> {
    return this.request('/vapi/call-token', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

export const api = new ApiClient();
