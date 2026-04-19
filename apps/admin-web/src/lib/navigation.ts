import {
  LayoutDashboard, Users, GraduationCap, Brain, UserCog,
  BookOpen, UsersRound, CreditCard, FileText, PieChart,
  DollarSign, ArrowLeftRight, ClipboardList, BarChart3,
  MessageSquare, MessageSquareWarning, Bell, CalendarCheck, History, Megaphone,
  Settings, Shield, Lock, Plug, Ban, EyeOff, Video, Activity,   Layers,
  Scale,
  type LucideIcon
} from 'lucide-react'

import { SUPERADMIN_ONLY_HREFS } from "@/lib/superadmin-only-routes"

export { SUPERADMIN_ONLY_HREFS }

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Navigation visible to the signed-in user (ADMINISTRATOR vs SUPERADMIN). */
export function getAdminNavGroupsForRole(role: string | undefined): NavGroup[] {
  if (role === "SUPERADMIN") {
    return adminNavGroups
  }
  return adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !SUPERADMIN_ONLY_HREFS.has(item.href)),
    }))
    .filter((group) => group.items.length > 0)
}

export const adminNavGroups: NavGroup[] = [
  {
    label: 'BOSHQARUV PANELI',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'FOYDALANUVCHILAR BOSHQARUVI',
    items: [
      { title: "O'quvchilar", href: '/students', icon: GraduationCap },
      { title: "O'qituvchilar", href: '/teachers', icon: Users },
      { title: 'Psixologlar', href: '/psychologists', icon: Brain },
      { title: 'Xodimlar', href: '/staff', icon: UserCog },
    ],
  },
  {
    label: "TA'LIM BOSHQARUVI",
    items: [
      { title: 'Kurslar', href: '/courses', icon: BookOpen },
      { title: 'Guruhlar', href: '/groups', icon: UsersRound },
    ],
  },
  {
    label: 'MOLIYA',
    items: [
      { title: "To'lovlar", href: '/payments', icon: CreditCard },
      { title: 'Tarif va limitlar', href: '/center-tariff', icon: Layers },
      { title: 'Hisobotlar', href: '/reports', icon: FileText },
      { title: 'Statistika', href: '/statistics', icon: PieChart },
      { title: 'Daromadlar', href: '/revenue', icon: DollarSign },
      { title: 'Tranzaksiyalar', href: '/transactions', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'PSIXOLOGIYA / TEST',
    items: [
      { title: 'Testlar', href: '/tests', icon: ClipboardList },
      { title: 'Natijalar analitikasi', href: '/results-analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'MULOQOT',
    items: [
      { title: 'Chat', href: '/chat', icon: MessageSquare },
      { title: 'Bildirishnomalar', href: '/notifications', icon: Bell },
      { title: 'Shikoyatlar', href: '/complaints', icon: MessageSquareWarning },
    ],
  },
  {
    label: 'FAOLIYAT',
    items: [
      { title: 'Seanslar', href: '/sessions', icon: Video },
      { title: 'Seanslar tarixi', href: '/sessions/history', icon: History },
      { title: 'Uchrashuvlar', href: '/meetings', icon: CalendarCheck },
      { title: 'Faollik jurnali', href: '/audit-logs', icon: Activity },
    ],
  },
  {
    label: 'KONTENT',
    items: [
      { title: "E'lonlar", href: '/announcements', icon: Megaphone },
      { title: 'Kontent nazorati', href: '/content-moderation', icon: EyeOff },
    ],
  },
  {
    label: 'SOZLAMALAR',
    items: [
      { title: 'Markaz sozlamalari', href: '/center-settings', icon: Settings },
      { title: 'Xodim rollari', href: '/staff-roles', icon: Shield },
      { title: 'Xavfsizlik', href: '/security', icon: Lock },
      { title: 'Bloklash', href: '/blocking', icon: Ban },
      { title: 'Integratsiyalar', href: '/integrations', icon: Plug },
      { title: 'Huquqiy va maxfiylik', href: '/legal-compliance', icon: Scale },
    ],
  },
];
