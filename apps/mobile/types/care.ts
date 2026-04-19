export type MobilePsychologistListItem = {
  id: number;
  firstName: string;
  lastName: string;
  patronymic?: string | null;
  gender?: string | null;
  specialization?: string | null;
  experienceYears?: number | null;
  verificationStatus?: string;
  isVerified?: boolean;
  isAvailable?: boolean;
  hourlyRate?: number | null;
  rating?: number | null;
  totalSessions?: number;
  bio?: string | null;
  avatarUrl?: string | null;
  sessionPrice?: number | null;
  center?: { id: number; name: string } | null;
  user?: { email?: string | null; phone?: string | null; isActive?: boolean };
};

export type PsychologistsDirectoryResponse = {
  data: MobilePsychologistListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MobilePsychologistDetail = MobilePsychologistListItem & {
  education?: string | null;
  certifications?: string[];
  licenseNumber?: string | null;
};

export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export type BookingPaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export type MyBookingRow = {
  id: number;
  scheduledAt: string;
  duration: number;
  price: number;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  notes?: string | null;
  psychologist: {
    id: number;
    firstName: string;
    lastName: string;
    specialization?: string | null;
    avatarUrl?: string | null;
  };
  meeting?: { id: number; meetingUrl?: string | null; status?: string | null } | null;
};

export type MyBookingsResponse = {
  data: MyBookingRow[];
  total: number;
  page: number;
  limit: number;
};

export type CreateBookingBody = {
  psychologistId: number;
  scheduledAt: string;
  duration?: number;
  notes?: string;
};
