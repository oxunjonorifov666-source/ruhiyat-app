"use client"

import * as React from "react"
import { Moon, Sun, RefreshCw, LogOut, User, Bell, Heart, CloudRain } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
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
  isRead: boolean
  createdAt: string
}

function DateTime() {
  const [now, setNow] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatted = new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now)

  const datePart = new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "long" }).format(now)
  const timePart = new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now)

  return (
    <div className="flex flex-col md:flex-row md:gap-3 items-end md:items-center text-sm text-muted-foreground mr-4">
      <span className="font-medium whitespace-nowrap capitalize">{datePart}</span>
      <span className="text-xs md:text-sm font-bold whitespace-nowrap">{timePart}</span>
    </div>
  )
}

function WeatherWidget() {
  const [temp, setTemp] = React.useState<number | null>(null)

  React.useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=41.2646&longitude=69.2163&current=temperature_2m")
        const data = await res.json()
        if (data?.current?.temperature_2m) {
          setTemp(data.current.temperature_2m)
        }
      } catch (err) {
        setTemp(22) // Mock fallback temp
      }
    }
    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // 10 minutes
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="hidden items-center gap-1.5 rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1 text-sm text-muted-foreground lg:flex">
      <CloudRain className="size-4 text-primary/80" />
      <span>Toshkent: {temp !== null ? `${temp}°C` : "--°C"}</span>
    </div>
  )
}

function getInitials(user: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) {
  if (!user) return "AD"
  if (user.firstName && user.lastName) return (user.firstName[0] + user.lastName[0]).toUpperCase()
  if (user.email) return user.email.substring(0, 2).toUpperCase()
  return "AD"
}

function getDisplayName(user: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) {
  if (!user) return "Administrator"
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  return user.email || "Administrator"
}

function NotificationBell() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await apiClient<{ data: Notification[]; total: number }>("/notifications", {
        params: { limit: 10 },
      })
      setNotifications(res.data || [])
      setUnreadCount((res.data || []).filter((n) => !n.isRead).length)
    } catch {}
  }, [])

  React.useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (id: number) => {
    try {
      await apiClient(`/notifications/${id}/read`, { method: "PATCH" })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {}
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Bildirishnomalar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Bildirishnomalar yo'q
          </div>
        ) : (
          notifications.slice(0, 5).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              onClick={() => !n.isRead && markAsRead(n.id)}
            >
              <div className="flex items-center gap-2 w-full">
                {!n.isRead && <span className="size-2 rounded-full bg-blue-500 shrink-0" />}
                <span className={`text-sm font-medium ${n.isRead ? "text-muted-foreground" : ""}`}>
                  {n.title}
                </span>
              </div>
              {n.body && <span className="text-xs text-muted-foreground line-clamp-1">{n.body}</span>}
              <span className="text-[10px] text-muted-foreground">
                {new Date(n.createdAt).toLocaleString("uz-UZ")}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppHeader() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/90 px-4 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/75 dark:border-border/80 dark:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4 opacity-60" />
      <div className="mr-2 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
          <Heart className="size-3.5" strokeWidth={2} />
        </div>
        <span className="hidden text-sm font-semibold tracking-tight lg:block">Ruhiyat</span>
      </div>
      <Separator orientation="vertical" className="mr-2 !h-4 hidden lg:block" />
      <DateTime />
      <WeatherWidget />
      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative size-8 rounded-full">
              <Avatar className="size-8">
                <AvatarFallback>{getInitials(user)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{getDisplayName(user)}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.role === "ADMINISTRATOR" ? "Administrator" : user?.role || ""}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                {user?.administrator?.center?.name && (
                  <span className="text-xs font-normal text-muted-foreground mt-0.5">
                    {user.administrator.center.name}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 size-4" />
              Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
