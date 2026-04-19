import { api } from '~/lib/api';
import type {
  CreateBookingBody,
  MobilePsychologistDetail,
  MyBookingsResponse,
  PsychologistsDirectoryResponse,
} from '~/types/care';

export async function fetchPsychologistsDirectory(params?: {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
}) {
  const { data } = await api.get<PsychologistsDirectoryResponse>('/mobile/psychologists', { params });
  return data;
}

export async function fetchPsychologistDetail(id: number) {
  const { data } = await api.get<MobilePsychologistDetail>(`/mobile/psychologists/${id}`);
  return data;
}

export async function createBooking(body: CreateBookingBody) {
  const { data } = await api.post<{
    id: number;
    scheduledAt: string;
    duration: number;
    price: number;
    status: string;
    psychologist: { id: number; firstName: string; lastName: string; specialization?: string | null };
  }>('/mobile/bookings', body);
  return data;
}

export async function fetchMyBookings(params?: { page?: number; limit?: number; status?: string }) {
  const { data } = await api.get<MyBookingsResponse>('/mobile/bookings', { params });
  return data;
}
