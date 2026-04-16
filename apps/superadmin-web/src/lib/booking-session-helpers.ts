export interface SessionUser {
  id: number
  email: string | null
  firstName: string | null
  lastName: string | null
  role: string
}

export interface SessionPsychologist {
  id: number
  firstName: string
  lastName: string
  specialization: string | null
  hourlyRate: number | null
  avatarUrl?: string | null
  rating?: number | null
  userId?: number
}

export interface SessionMeeting {
  id: number
  title: string
  meetingUrl: string | null
  status: string
  scheduledAt: string
  duration: number
  participants?: { user: SessionUser }[]
}

export interface SessionChat {
  id: number
  _count: { messages: number }
}

export interface BookingSession {
  id: number
  userId: number
  psychologistId: number
  administratorId: number | null
  scheduledAt: string
  duration: number
  price: number
  status: string
  paymentStatus: string
  meetingId: number | null
  chatId: number | null
  notes: string | null
  cancelReason: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  user: SessionUser
  psychologist: SessionPsychologist
  meeting?: SessionMeeting | null
  chat?: SessionChat | null
}

export interface SessionStats {
  total: number
  pending: number
  accepted: number
  completed: number
  cancelled: number
  rejected: number
  todaySessions: number
  monthSessions: number
  paidCount: number
  totalRevenue: number
}

export const statusLabels: Record<string, string> = {
  PENDING: "Kutilmoqda",
  ACCEPTED: "Qabul qilingan",
  REJECTED: "Rad etilgan",
  COMPLETED: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
}

export const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  ACCEPTED: "default",
  REJECTED: "destructive",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
}

export const paymentLabels: Record<string, string> = {
  UNPAID: "To'lanmagan",
  PAID: "To'langan",
  REFUNDED: "Qaytarilgan",
}

export const paymentColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  UNPAID: "outline",
  PAID: "default",
  REFUNDED: "destructive",
}

export function getUserName(user: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  if (user.firstName) return `${user.firstName} ${user.lastName || ""}`.trim()
  return user.email || "Noma'lum"
}

export function getPsychName(p: { firstName: string; lastName: string }) {
  return `${p.firstName} ${p.lastName}`.trim()
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("uz-UZ")
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString("uz-UZ")
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm"
}

export function exportSessionsCSV(data: BookingSession[], filenamePrefix: string) {
  const headers = ["ID", "Foydalanuvchi", "Psixolog", "Sana", "Davomiyligi", "Narxi", "Holat", "To'lov holati", "Yaratilgan"]
  const rows = data.map((s) => [
    s.id,
    getUserName(s.user),
    getPsychName(s.psychologist),
    formatDateTime(s.scheduledAt),
    `${s.duration} min`,
    s.price,
    statusLabels[s.status] || s.status,
    paymentLabels[s.paymentStatus] || s.paymentStatus,
    formatDate(s.createdAt),
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `${filenamePrefix}_${new Date().toISOString().split("T")[0]}.csv`
  link.click()
}
