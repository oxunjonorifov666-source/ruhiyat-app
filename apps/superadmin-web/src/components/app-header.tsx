"use client"

import * as React from "react"
import { Moon, Sun, RefreshCw, LogOut, User, Settings, CloudSun, CalendarDays, Clock } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="hidden lg:flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
      <Clock className="size-3.5" />
      <span>
        {new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now)}
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
