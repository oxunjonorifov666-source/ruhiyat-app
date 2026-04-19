import { api } from '~/lib/api';
import type {
  ConsumerPlanRow,
  MobilePaymentRow,
  MonetizationEntitlements,
  StartPremiumResponse,
} from '~/types/monetization';

export async function fetchMyEntitlements() {
  const { data } = await api.get<MonetizationEntitlements>('/monetization/me/entitlements');
  return data;
}

export async function fetchConsumerPlans() {
  const { data } = await api.get<ConsumerPlanRow[]>('/monetization/consumer-plans');
  return data;
}

export async function startPremiumSubscription() {
  const { data } = await api.post<StartPremiumResponse>('/monetization/mobile/premium/start');
  return data;
}

export async function fetchMyMobilePayments() {
  const { data } = await api.get<MobilePaymentRow[]>('/monetization/mobile/my-payments');
  return data;
}

export async function fetchPremiumPaymentStatus(paymentId: number) {
  const { data } = await api.get<{
    payment: { id: number; status: string; amount: number; currency: string };
    isPremium: boolean;
  }>(`/monetization/mobile/premium/payment-status/${paymentId}`);
  return data;
}
