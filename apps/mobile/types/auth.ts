export type AuthUserPayload = {
  id: number;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  centerId?: number | null;
  /** From GET /auth/me (mobile context). */
  accountLifecycle?: string | null;
  scheduledDeletionAt?: string | null;
  deletionRequestedAt?: string | null;
};

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  accessTtlMs: number;
  refreshTtlMs: number;
  user: AuthUserPayload;
};
