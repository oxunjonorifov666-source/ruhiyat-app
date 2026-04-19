import { api } from './api';
import type { AccountDeletionRequestResponse, ComplianceState } from '~/types/compliance';

export async function recordMobileConsent(termsVersion: string, privacyVersion: string) {
  const { data } = await api.post('/mobile/account/consent', {
    termsVersion,
    privacyVersion,
  });
  return data;
}

export async function fetchComplianceState() {
  const { data } = await api.get<ComplianceState>('/mobile/compliance-state');
  return data;
}

export async function requestAccountDeletion() {
  const { data } = await api.post<AccountDeletionRequestResponse>('/mobile/account/deletion-request');
  return data;
}

export async function cancelAccountDeletion() {
  const { data } = await api.post<{ ok: boolean }>('/mobile/account/deletion-cancel');
  return data;
}
