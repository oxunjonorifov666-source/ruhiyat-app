import {
  LayoutDashboard, Users, GraduationCap, Brain, UserCog,
  BookOpen, UsersRound, CreditCard, FileText, PieChart,
  DollarSign, ArrowLeftRight, ClipboardList, BarChart3,
  MessageSquare, Bell, Calendar, Megaphone, Settings,
  Shield, Lock, ScrollText, Plug, type LucideIcon
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
    label: 'Asosiy',
    items: [
      { title: 'Boshqaruv paneli', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Hisobotlar', href: '/reports', icon: FileText },
      { title: 'Statistika', href: '/statistics', icon: PieChart },
    ],
  },
  {
    label: 'Markaz boshqaruvi',
    items: [
      { title: "O'quvchilar", href: '/students', icon: Users },
      { title: "O'qituvchilar", href: '/teachers', icon: GraduationCap },
      { title: 'Psixologlar', href: '/psychologists', icon: Brain },
      { title: 'Xodimlar', href: '/staff', icon: UserCog },
      { title: 'Kurslar', href: '/courses', icon: BookOpen },
      { title: 'Guruhlar', href: '/groups', icon: UsersRound },
    ],
  },
  {
    label: 'Moliya',
    items: [
      { title: "To'lovlar", href: '/payments', icon: CreditCard },
      { title: 'Daromadlar', href: '/revenue', icon: DollarSign },
      { title: 'Tranzaksiyalar', href: '/transactions', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Baholash',
    items: [
      { title: 'Testlar', href: '/tests', icon: ClipboardList },
      { title: 'Natijalar analitikasi', href: '/results-analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Kommunikatsiya',
    items: [
      { title: 'Chat', href: '/chat', icon: MessageSquare },
      { title: 'Bildirishnomalar', href: '/notifications', icon: Bell },
      { title: 'Uchrashuvlar', href: '/meetings', icon: Calendar },
      { title: "E'lonlar", href: '/announcements', icon: Megaphone },
    ],
  },
  {
    label: 'Tizim',
    items: [
      { title: 'Markaz sozlamalari', href: '/center-settings', icon: Settings },
      { title: 'Xodim rollari', href: '/staff-roles', icon: Shield },
      { title: 'Xavfsizlik', href: '/security', icon: Lock },
      { title: 'Audit loglari', href: '/audit-logs', icon: ScrollText },
      { title: 'Integratsiyalar', href: '/integrations', icon: Plug },
    ],
  },
];
