import { apiClient } from './api';

export type ConsumerPlan = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  monthlyPriceUzs: number;
  featurePsychChat: boolean;
  featureVideoConsultation: boolean;
  featureCourses: boolean;
  featurePremiumContent: boolean;
  sortOrder: number;
  isActive: boolean;
};

export type Entitlements = {
  isPremium: boolean;
  premiumUntil: string | null;
  planCode: string;
  features: {
    psychChat: boolean;
    videoConsultation: boolean;
    courses: boolean;
    premiumContent: boolean;
  };
};

export type PaymentRow = {
  id: number;
  amount: number;
  currency: string;
  status: string;
  kind: string;
  description: string | null;
  createdAt: string;
};

export const monetizationService = {
  listPlans() {
    return apiClient.get<ConsumerPlan[]>('/monetization/consumer-plans');
  },

  getEntitlements() {
    return apiClient.get<Entitlements>('/monetization/me/entitlements');
  },

  startPremium() {
    return apiClient.post<{
      payment: { id: number; status: string; amount: number };
      subscription: { id: number; status: string };
      amount: number;
      merchantTransId: string;
      checkoutUrl: string | null;
    }>('/monetization/mobile/premium/start', {});
  },

  getPremiumPaymentStatus(paymentId: number) {
    return apiClient.get<{
      payment: { id: number; status: string; amount: number; currency: string };
      isPremium: boolean;
    }>(`/monetization/mobile/premium/payment-status/${paymentId}`);
  },

  confirmPremiumPayment(paymentId: number) {
    return apiClient.post<{ message: string; payment: unknown }>('/monetization/mobile/premium/confirm', {
      paymentId,
    });
  },

  listMyPayments() {
    return apiClient.get<PaymentRow[]>('/monetization/mobile/my-payments');
  },
};
