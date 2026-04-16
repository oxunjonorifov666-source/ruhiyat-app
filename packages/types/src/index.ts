export const UserRole = {
  SUPERADMIN: 'SUPERADMIN',
  ADMINISTRATOR: 'ADMINISTRATOR',
  MOBILE_USER: 'MOBILE_USER',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const ComplaintStatus = {
  PENDING: 'PENDING',
  REVIEWING: 'REVIEWING',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;
export type ComplaintStatus = typeof ComplaintStatus[keyof typeof ComplaintStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const MeetingStatus = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type MeetingStatus = typeof MeetingStatus[keyof typeof MeetingStatus];

export const MeetingType = {
  CONSULTATION: 'CONSULTATION',
  THERAPY: 'THERAPY',
  GROUP_SESSION: 'GROUP_SESSION',
  TRAINING: 'TRAINING',
  OTHER: 'OTHER',
} as const;
export type MeetingType = typeof MeetingType[keyof typeof MeetingType];

export const ChatType = {
  DIRECT: 'DIRECT',
  GROUP: 'GROUP',
  SUPPORT: 'SUPPORT',
} as const;
export type ChatType = typeof ChatType[keyof typeof ChatType];

export interface AuthUser {
  id: number;
  email: string | null;
  phone: string | null;
  role: UserRole;
  centerId?: number | null;
  permissions?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  /** Barqaror client mapping uchun (masalan NETWORK_ERROR, VALIDATION_ERROR) */
  code?: string;
  statusCode?: number;
  timestamp?: string;
  path?: string;
  stack?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
