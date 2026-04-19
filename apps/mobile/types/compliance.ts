/** Matches `MobileComplianceService.getComplianceState` response. */
export type ComplianceState = {
  activeTermsVersion: string | null;
  activePrivacyVersion: string | null;
  acceptedTermsVersion: string | null;
  acceptedPrivacyVersion: string | null;
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
  accountLifecycle: string;
  deletionRequestedAt: string | null;
  scheduledDeletionAt: string | null;
  deletionGraceDays: number;
};

export type AccountDeletionRequestResponse = {
  ok: boolean;
  deletionRequestedAt: string;
  scheduledDeletionAt: string;
  graceDays: number;
};
