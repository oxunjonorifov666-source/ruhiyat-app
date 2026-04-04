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
  permission?: string;
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
      { title: 'Foydalanuvchilar', href: '/users', icon: Users, permission: 'users.read' },
      { title: 'Psixologlar', href: '/psychologists', icon: Brain, permission: 'psychologists.read' },
      { title: 'Administratorlar', href: '/administrators', icon: UserCog, permission: 'users.read' },
      { title: 'Rollar va ruxsatlar', href: '/roles', icon: Shield, permission: 'system.settings' },
      { title: 'Kirish nazorati', href: '/access-control', icon: UserCheck, permission: 'system.settings' },
    ],
  },
  {
    label: 'Kommunikatsiya',
    items: [
      { title: 'Chat', href: '/chat', icon: MessageSquare, permission: 'communication.read' },
      { title: 'Videochat', href: '/videochat', icon: Video, permission: 'communication.read' },
      { title: 'Bildirishnomalar', href: '/notifications', icon: Bell, permission: 'communication.read' },
      { title: "E'lonlar", href: '/announcements', icon: Megaphone, permission: 'communication.write' },
    ],
  },
  {
    label: 'Hamjamiyat',
    items: [
      { title: 'Hamjamiyat', href: '/community', icon: Globe, permission: 'community.read' },
      { title: 'Sharhlar', href: '/reviews', icon: Star, permission: 'community.read' },
      { title: 'Moderatsiya markazi', href: '/moderation', icon: AlertTriangle, permission: 'community.moderate' },
    ],
  },
  {
    label: 'Kontent',
    items: [
      { title: 'Maqolalar CMS', href: '/articles', icon: Newspaper, permission: 'content.read' },
      { title: 'Bannerlar', href: '/banners', icon: Image, permission: 'content.write' },
      { title: 'Audio kutubxona', href: '/audio', icon: Headphones, permission: 'content.read' },
      { title: 'Video kutubxona', href: '/videos', icon: PlayCircle, permission: 'content.read' },
      { title: 'Afirmatsiyalar', href: '/affirmations', icon: Heart, permission: 'content.write' },
      { title: 'Proyektiv metodikalar', href: '/projective-methods', icon: Puzzle, permission: 'content.write' },
      { title: 'Psixologik testlar', href: '/tests', icon: ClipboardList, permission: 'assessments.read' },
      { title: 'Treninglar', href: '/trainings', icon: GraduationCap, permission: 'content.read' },
    ],
  },
  {
    label: 'Uchrashuvlar',
    items: [
      { title: 'Uchrashuvlar', href: '/meetings', icon: Calendar, permission: 'meetings.read' },
      { title: 'Seanslar tarixi', href: '/sessions-history', icon: History, permission: 'meetings.read' },
    ],
  },
  {
    label: 'Moliya',
    items: [
      { title: "To'lovlar", href: '/payments', icon: CreditCard, permission: 'finance.read' },
      { title: 'Daromadlar', href: '/revenue', icon: DollarSign, permission: 'finance.read' },
      { title: 'Tranzaksiyalar', href: '/transactions', icon: ArrowLeftRight, permission: 'finance.read' },
    ],
  },
  {
    label: 'Tizim',
    items: [
      { title: 'Sozlamalar', href: '/settings', icon: Settings, permission: 'system.settings' },
      { title: 'Mobil ilova sozlamalari', href: '/mobile-settings', icon: Smartphone, permission: 'system.settings' },
      { title: 'Xavfsizlik', href: '/security', icon: Lock, permission: 'system.settings' },
      { title: 'Audit loglari', href: '/audit-logs', icon: ScrollText, permission: 'system.audit' },
      { title: 'Faollik loglari', href: '/activity-logs', icon: Activity, permission: 'system.audit' },
      { title: 'Integratsiyalar', href: '/integrations', icon: Plug, permission: 'system.settings' },
      { title: 'Texnik monitoring', href: '/monitoring', icon: Monitor, permission: 'system.settings' },
      { title: 'API kalitlar', href: '/api-keys', icon: Key, permission: 'system.settings' },
    ],
  },
];
