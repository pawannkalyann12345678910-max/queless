// ====================================================================
// Queless Master TypeScript Type Definitions
// ====================================================================

export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface User {
  USER_ID: string;
  EMAIL: string;
  DISPLAY_NAME: string;
  PHONE?: string;
  PHOTO_URL?: string;
  PROFILE_COMPLETE: number; // 0 = false, 1 = true
  ROLE: UserRole;
  CREATED_AT?: string;
  UPDATED_AT?: string;
}

export type OrgCategory = 
  | 'Clinic'
  | 'Hospital'
  | 'Bank'
  | 'University'
  | 'Government'
  | 'Salon'
  | 'Restaurant'
  | 'Retail'
  | 'Service Center'
  | 'Other';

export interface Organization {
  ORG_ID: string;
  NAME: string;
  CATEGORY: OrgCategory;
  DESCRIPTION?: string;
  LOGO_URL?: string;
  BANNER_URL?: string;
  ADMIN_UID: string;
  ADMIN_EMAIL: string;
  SUBSCRIPTION_TIER: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  ADDRESS?: string;
  CITY?: string;
  DISTANCE_KM?: number;
  LAT?: number;
  LNG?: number;
  IS_ACTIVE: number;
  TOTAL_QUEUES?: number;
  ACTIVE_WAITING_TOKENS?: number;
  CREATED_AT?: string;
  UPDATED_AT?: string;
}

export interface Queue {
  QUEUE_ID: string;
  ORG_ID: string;
  NAME: string;
  PREFIX: string;
  COUNTER_LABEL: string;
  AVG_SERVICE_MINS: number;
  MAX_DAILY_TOKENS: number;
  CURRENT_TOKEN_SEQ: number;
  IS_ACTIVE: number;
  IS_PAUSED: number;
  ALLOW_STAFF_WHATSAPP?: number;
  OPERATING_HOURS?: string;
  WAITING_COUNT?: number;
  COMPLETED_TODAY?: number;
  NOSHOW_TODAY?: number;
  PENDING_DELAYS?: number;
  CURRENT_SERVING_TOKEN?: string;
  ORG_NAME?: string;
  ORG_CATEGORY?: OrgCategory;
  ORG_LOGO_URL?: string;
  CREATED_AT?: string;
}

export interface StaffAssignment {
  ASSIGNMENT_ID: string;
  QUEUE_ID: string;
  ORG_ID: string;
  STAFF_EMAIL: string;
  STAFF_NAME?: string;
  ROLE: 'OPERATOR' | 'SENIOR_MANAGER';
  QUEUE_NAME?: string;
  COUNTER_LABEL?: string;
  ORG_NAME?: string;
  USER_PHOTO?: string;
  CREATED_AT?: string;
}

export type TokenStatus = 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
export type DelayStatus = 'NONE' | 'REQUESTED_5M' | 'REQUESTED_10M' | 'REQUESTED_15M' | 'APPROVED_5M' | 'APPROVED_10M' | 'APPROVED_15M' | 'REJECTED_5M' | 'RESCHEDULED';

export interface Token {
  TOKEN_ID: string;
  QUEUE_ID: string;
  ORG_ID: string;
  USER_ID: string;
  TOKEN_NUMBER: string;
  TOKEN_SEQ: number;
  CUSTOMER_NAME: string;
  CUSTOMER_PHONE: string;
  CUSTOMER_EMAIL?: string;
  CUSTOMER_ADDRESS?: string;
  CUSTOMER_PHOTO?: string;
  SERVICE_NOTE?: string;
  STATUS: TokenStatus;
  DELAY_STATUS: DelayStatus;
  DELAY_MINUTES?: number;
  DELAY_REASON?: string;
  DELAY_REQUESTED_AT?: string;
  POSITION_IN_QUEUE: number;
  ESTIMATED_WAIT_MINS: number;
  BOOKING_DATE: string;
  CALLED_AT?: string;
  SERVE_STARTED_AT?: string;
  COMPLETED_AT?: string;
  CREATED_AT: string;
  
  // Joined Queue / Org metadata
  QUEUE_NAME?: string;
  COUNTER_LABEL?: string;
  AVG_SERVICE_MINS?: number;
  OPERATING_HOURS?: string;
  ORG_NAME?: string;
  ORG_CATEGORY?: OrgCategory;
  ORG_LOGO_URL?: string;
  CURRENT_SERVING_TOKEN?: string;
}

export interface ProximityAlert {
  level: 'NONE' | 'ADVANCE_10M' | 'URGENT_5M';
  message: string;
  peopleAhead: number;
  estimatedMinutes: number;
}

export interface HDMIDisplayPayload {
  queue: Queue;
  nowServing: {
    TOKEN_ID: string;
    TOKEN_NUMBER: string;
    STATUS: TokenStatus;
    CALLED_AT: string;
  } | null;
  nextInLine: Array<{
    TOKEN_ID: string;
    TOKEN_NUMBER: string;
    POSITION_IN_QUEUE: number;
    ESTIMATED_WAIT_MINS: number;
  }>;
  stats: {
    TOTAL_WAITING: number;
    TOTAL_SERVED_TODAY: number;
  };
  timestamp: string;
}

export interface AnalyticsSummary {
  kpis: {
    totalTokens: number;
    completedTokens: number;
    noShowTokens: number;
    activeWaiting: number;
    avgWaitMins: number;
    completionRate: number;
  };
  queueStats: Array<{
    QUEUE_ID: string;
    QUEUE_NAME: string;
    COUNTER_LABEL: string;
    AVG_SERVICE_MINS: number;
    TOTAL_ISSUED: number;
    COMPLETED: number;
    NO_SHOW: number;
    WAITING: number;
  }>;
  hourlyTraffic: Array<{
    hour: string;
    volume: number;
  }>;
}
