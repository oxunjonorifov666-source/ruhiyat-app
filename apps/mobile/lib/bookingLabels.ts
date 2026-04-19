export function bookingStatusUz(status: string): string {
  const m: Record<string, string> = {
    PENDING: 'Kutilmoqda',
    ACCEPTED: 'Tasdiqlangan',
    REJECTED: 'Rad etilgan',
    COMPLETED: 'Yakunlangan',
    CANCELLED: 'Bekor qilingan',
  };
  return m[status] ?? status;
}

export function paymentStatusUz(status: string): string {
  const m: Record<string, string> = {
    UNPAID: 'To‘lanmagan',
    PAID: 'To‘langan',
    REFUNDED: 'Qaytarilgan',
  };
  return m[status] ?? status;
}
