import axios from 'axios';
import { getApiBaseUrl } from './env';
import type { PublicLegalBundle } from '~/types/legal';

/** Unauthenticated — safe for onboarding. */
export async function fetchPublicLegalBundle(region = 'GLOBAL'): Promise<PublicLegalBundle> {
  const base = getApiBaseUrl();
  const { data } = await axios.get<PublicLegalBundle>(`${base}/public/legal-bundle`, {
    params: { region },
    timeout: 20_000,
  });
  return data;
}
