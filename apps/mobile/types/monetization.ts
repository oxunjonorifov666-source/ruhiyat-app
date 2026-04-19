export type MonetizationEntitlements = {
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

export type StartPremiumResponse = {
  payment: {
    id: number;
    amount: number;
    currency: string;
    status: string;
  };
  subscription: { id: number };
  amount: number;
  merchantTransId: string;
  checkoutUrl: string | null;
};

export type MobilePaymentRow = {
  id: number;
  amount: number;
  currency: string;
  status: string;
  kind: string;
  description: string | null;
  createdAt: string;
};

export type ConsumerPlanRow = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  monthlyPriceUzs: number;
  isActive: boolean;
};
