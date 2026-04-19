"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import { StepUpProvider } from "@/components/step-up/step-up-provider"
import { Toaster } from "sonner"

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <StepUpProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col">
              <AppHeader />
              <main className="app-main-canvas flex-1 overflow-auto">
                <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8 min-h-[min(100%,calc(100vh-7rem))]">
                  {children}
                </div>
              </main>
              <AppFooter />
            </SidebarInset>
          </SidebarProvider>
          <Toaster position="top-right" richColors />
          </StepUpProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  )
}
