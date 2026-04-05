import {
  LayoutDashboard, Users, GraduationCap, Brain, UserCog,
  BookOpen, UsersRound, CreditCard, FileText, PieChart,
  DollarSign, ArrowLeftRight, ClipboardList, BarChart3,
  MessageSquare, Bell, CalendarCheck, History, Megaphone,
  Settings, Shield, Lock, ScrollText, Plug,
  type LucideIcon
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
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
    ],
  },
  {
    label: 'FAOLIYAT',
    items: [
      { title: 'Uchrashuvlar', href: '/meetings', icon: CalendarCheck },
      { title: 'Seanslar tarixi', href: '/sessions', icon: History },
    ],
  },
  {
    label: 'KONTENT',
    items: [
      { title: "E'lonlar", href: '/announcements', icon: Megaphone },
    ],
  },
  {
    label: 'SOZLAMALAR',
    items: [
      { title: 'Markaz sozlamalari', href: '/center-settings', icon: Settings },
      { title: 'Xodim rollari', href: '/staff-roles', icon: Shield },
      { title: 'Xavfsizlik', href: '/security', icon: Lock },
      { title: 'Audit loglari', href: '/audit-logs', icon: ScrollText },
      { title: 'Integratsiyalar', href: '/integrations', icon: Plug },
    ],
  },
];
