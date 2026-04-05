import {
  LayoutDashboard, Users, Brain, CalendarCheck,
  CreditCard, DollarSign, ArrowLeftRight,
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
    label: 'Asosiy',
    items: [
      { title: 'Boshqaruv paneli', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Boshqaruv',
    items: [
      { title: 'Psixologlar', href: '/psychologists', icon: Brain },
      { title: "Foydalanuvchilar", href: '/users', icon: Users },
      { title: 'Seanslar', href: '/sessions', icon: CalendarCheck },
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
];
