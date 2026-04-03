import {
  LayoutDashboard, BarChart3, FileText, Users, Brain, UserCog,
  Shield, MessageSquare, Video, Globe, Star, Megaphone, Newspaper,
  Image, Bell, Headphones, PlayCircle, Heart, Puzzle, ClipboardList,
  GraduationCap, Calendar, History, Activity, AlertTriangle, CreditCard,
  DollarSign, ArrowLeftRight, PieChart, Settings, Smartphone, Lock,
  ScrollText, Plug, Monitor, Key, UserCheck, type LucideIcon
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

export const superadminNavGroups: NavGroup[] = [
  {
    label: 'Asosiy',
    items: [
      { title: 'Boshqaruv paneli', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Analitika', href: '/analytics', icon: BarChart3 },
      { title: 'Hisobotlar', href: '/reports', icon: FileText },
      { title: 'Statistika', href: '/statistics', icon: PieChart },
    ],
  },
  {
    label: 'Foydalanuvchilar',
    items: [
      { title: 'Foydalanuvchilar', href: '/users', icon: Users },
      { title: 'Psixologlar', href: '/psychologists', icon: Brain },
      { title: 'Administratorlar', href: '/administrators', icon: UserCog },
      { title: 'Rollar va ruxsatlar', href: '/roles', icon: Shield },
      { title: 'Kirish nazorati', href: '/access-control', icon: UserCheck },
    ],
  },
  {
    label: 'Kommunikatsiya',
    items: [
      { title: 'Chat', href: '/chat', icon: MessageSquare },
      { title: 'Videochat', href: '/videochat', icon: Video },
      { title: 'Bildirishnomalar', href: '/notifications', icon: Bell },
      { title: "E'lonlar", href: '/announcements', icon: Megaphone },
    ],
  },
  {
    label: 'Hamjamiyat',
    items: [
      { title: 'Hamjamiyat', href: '/community', icon: Globe },
      { title: 'Sharhlar', href: '/reviews', icon: Star },
      { title: 'Moderatsiya markazi', href: '/moderation', icon: AlertTriangle },
    ],
  },
  {
    label: 'Kontent',
    items: [
      { title: 'Maqolalar CMS', href: '/articles', icon: Newspaper },
      { title: 'Bannerlar', href: '/banners', icon: Image },
      { title: 'Audio kutubxona', href: '/audio', icon: Headphones },
      { title: 'Video kutubxona', href: '/videos', icon: PlayCircle },
      { title: 'Afirmatsiyalar', href: '/affirmations', icon: Heart },
      { title: 'Proyektiv metodikalar', href: '/projective-methods', icon: Puzzle },
      { title: 'Psixologik testlar', href: '/tests', icon: ClipboardList },
      { title: 'Treninglar', href: '/trainings', icon: GraduationCap },
    ],
  },
  {
    label: 'Uchrashuvlar',
    items: [
      { title: 'Uchrashuvlar', href: '/meetings', icon: Calendar },
      { title: 'Seanslar tarixi', href: '/sessions-history', icon: History },
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
    label: 'Tizim',
    items: [
      { title: 'Sozlamalar', href: '/settings', icon: Settings },
      { title: 'Mobil ilova sozlamalari', href: '/mobile-settings', icon: Smartphone },
      { title: 'Xavfsizlik', href: '/security', icon: Lock },
      { title: 'Audit loglari', href: '/audit-logs', icon: ScrollText },
      { title: 'Faollik loglari', href: '/activity-logs', icon: Activity },
      { title: 'Integratsiyalar', href: '/integrations', icon: Plug },
      { title: 'Texnik monitoring', href: '/monitoring', icon: Monitor },
      { title: 'API kalitlar', href: '/api-keys', icon: Key },
    ],
  },
];
