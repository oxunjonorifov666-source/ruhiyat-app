"use client"

import * as React from "react"
import { Moon, Sun, RefreshCw, LogOut, User, Settings, CloudSun, CalendarDays, Clock, Bell, Check } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"

interface Notification {
  id: number
  title: string
  body: string | null
  type: string
  isRead: boolean
  createdAt: string
}

const roleLabels: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  ADMINISTRATOR: "Administrator",
  MOBILE_USER: "Foydalanuvchi",
}

function DateDisplay() {
  const [now, setNow] = React.useState(new Date())
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
      <CalendarDays className="size-3.5" />
      <span>
        {new Intl.DateTimeFormat("uz-UZ", { year: "numeric", month: "long", day: "numeric" }).format(now)}
      </span>
    </div>
  )
}

function TimeDisplay() {
  const [now, setNow] = React.useState(new Date())
  React.useEffect(() => {
    const tick = () => setNow(new Date())
    const timer = setInterval(tick, 5000)
    tick()
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="hidden lg:flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
      <Clock className="size-3.5" />
      <span>
        {new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit" }).format(now)}
      </span>
    </div>
  )
}

function WeatherWidget() {
  const [weather, setWeather] = React.useState<{ temp: string; city: string } | null>(null)
  React.useEffect(() => {
    fetch("https://wttr.in/Tashkent?format=%t&m")
      .then((r) => r.text())
      .then((text) => {
        const temp = text.trim().replace("+", "")
        setWeather({ temp, city: "Toshkent" })
      })
      .catch(() => {})
  }, [])
  if (!weather) return null
  return (
    <div className="hidden xl:flex items-center gap-1.5 text-sm text-muted-foreground">
      <CloudSun className="size-3.5" />
      <span>{weather.city} {weather.temp}</span>
    </div>
  )
}

function formatTimeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Hozirgina"
  if (mins < 60) return `${mins} daqiqa oldin`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  return `${days} kun oldin`
}

function NotificationBell() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [open, setOpen] = React.useState(false)

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await apiClient<{ data: Notification[]; total: number }>("/notifications", {
        params: { limit: 10, page: 1 },
      })
      setNotifications(res.data || [])
      setUnreadCount((res.data || []).filter((n) => !n.isRead).length)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [])

  React.useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 90000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markRead = async (id: number) => {
    try {
      await apiClient(`/notifications/${id}/read`, { method: "PATCH" })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  const typeIcons: Record<string, string> = {
    session: "bg-blue-100 text-blue-600",
    payment: "bg-green-100 text-green-600",
    alert: "bg-red-100 text-red-600",
    general: "bg-gray-100 text-gray-600",
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 relative">
          <Bell className="size-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Bildirishnomalar</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {unreadCount} ta yangi
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-[320px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Bildirishnomalar yo'q
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${!n.isRead ? "bg-muted/50" : ""}`}
                onClick={() => !n.isRead && markRead(n.id)}
              >
                <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${typeIcons[n.type] || typeIcons.general}`}>
                  <Bell className="size-3" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className={`text-sm truncate ${!n.isRead ? "font-semibold" : ""}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground">{formatTimeSince(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <div className="mt-1 size-2 rounded-full bg-blue-500 shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function getInitials(user: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) {
  if (!user) return "SA"
  if (user.firstName && user.lastName) return (user.firstName[0] + user.lastName[0]).toUpperCase()
  if (user.email) return user.email.substring(0, 2).toUpperCase()
  return "SA"
}

function getDisplayName(user: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) {
  if (!user) return "Superadmin"
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  return user.email || "Superadmin"
}

export function AppHeader() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4" />

      <DateDisplay />
      <Separator orientation="vertical" className="!h-4 hidden md:block" />
      <TimeDisplay />
      <Separator orientation="vertical" className="!h-4 hidden lg:block" />
      <WeatherWidget />

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />

        <Button variant="ghost" size="icon" className="size-8" onClick={() => window.location.reload()}>
          <RefreshCw className="size-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="size-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Separator orientation="vertical" className="!h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">{getInitials(user)}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-medium leading-none">{getDisplayName(user)}</span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  {roleLabels[(user as any)?.role] || "Superadmin"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="font-medium">{getDisplayName(user)}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                <Badge variant="secondary" className="w-fit text-[10px]">
                  {roleLabels[(user as any)?.role] || "Superadmin"}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 size-4" />
              Sozlamalar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 size-4" />
              Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
