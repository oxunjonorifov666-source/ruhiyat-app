"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2 } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getAdminNavGroupsForRole } from "@/lib/navigation"
import { useAuth } from "@/components/auth-provider"

function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) return true
  if (href === "/dashboard") return pathname === "/" || pathname === "/dashboard"
  return pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const adminNavGroups = getAdminNavGroupsForRole(user?.role)
  const roleLabel =
    user?.role === "SUPERADMIN"
      ? "Superadmin"
      : user?.role === "ADMINISTRATOR"
        ? "Administrator"
        : "Panel"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/80 bg-sidebar/50 px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
                  <Building2 className="size-[1.125rem]" strokeWidth={2} />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">Ruhiyat</span>
                  <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <ScrollArea className="h-[calc(100vh-5rem)]">
          {adminNavGroups.map((group) => (
            <SidebarGroup key={group.label} className="py-2">
              <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/90">
                {group.label}
              </SidebarGroupLabel>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isNavItemActive(pathname, item.href)}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </ScrollArea>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
