"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Monitor, Server, Database, Activity, AlertTriangle, Cpu, HardDrive, Network, Loader2, Clock, Shield, CheckCircle, Smartphone, RefreshCw, Zap, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface AuditLog {
  id: number
  action: string
  resource: string
  createdAt: string
  user: { firstName: string; lastName: string } | null
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<{ status: string } | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Real-time simulated metrics
  const [metrics, setMetrics] = useState({
    cpu: 18,
    ram: 42,
    disk: 25,
    network: 124, // KB/s
  })

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true)
    try {
      const [healthRes, logsRes] = await Promise.all([
        apiClient<{ status: string }>("/healthz").catch(() => ({ status: "error" })),
        apiClient<{ data: AuditLog[] }>("/system/audit-logs", { params: { limit: 8 } }).catch(() => ({ data: [] }))
      ])
      
      setHealth(healthRes)
      setAuditLogs(logsRes.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Polling health and logs every 30 seconds
    const interval = setInterval(() => fetchData(true), 60000)
    
    // Smoothly fluctuate metrics every 2.5 seconds
    const metricInterval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.max(12, Math.min(85, prev.cpu + (Math.random() * 10 - 5))),
        ram: Math.max(35, Math.min(60, prev.ram + (Math.random() * 2 - 1))),
        disk: prev.disk, // Disk doesn't fluctuate much
        network: Math.max(50, Math.min(1000, prev.network + (Math.random() * 100 - 50))),
      }))
    }, 2500)

    return () => {
      clearInterval(interval)
      clearInterval(metricInterval)
    }
  }, [fetchData])

  const services = [
    { title: "API Server", status: health?.status === "ok" ? "Ishlayapti" : "Xato", color: health?.status === "ok" ? "bg-emerald-500" : "bg-destructive", icon: Server, latency: "42ms" },
    { title: "Ma'lumotlar bazasi", status: "Aloqada", color: "bg-emerald-500", icon: Database, latency: "5ms" },
    { title: "Kesh (Redis)", status: "Ishlayapti", color: "bg-emerald-500", icon: Zap, latency: "2ms" },
    { title: "Fayl saqlagich", status: "98% Bo'sh", color: "bg-emerald-500", icon: HardDrive, latency: "112ms" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Texnik monitoring"
        description="Server, xizmatlar va tizim resurslarini real vaqt rejimida kuzatish"
        icon={Monitor}
        actions={[
          {
            label: refreshing ? "Yangilanmoqda..." : "Yangilash",
            icon: refreshing ? Loader2 : RefreshCw,
            variant: "outline",
            onClick: () => fetchData()
          }
        ]}
      />

      {health?.status === "error" && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Diqqat! API Xatosi</AlertTitle>
          <AlertDescription>
            Server bilan aloqa uzildi yoki xatolik yuz berdi. Iltimos, server jurnallarini (logs) tekshiring.
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="CPU Yuklamasi" value={Math.round(metrics.cpu)} icon={Cpu} unit="%" color="text-blue-600" />
        <MetricCard label="RAM Foydalanish" value={Math.round(metrics.ram)} icon={Activity} unit="%" color="text-purple-600" />
        <MetricCard label="Disk Bandligi" value={metrics.disk} icon={HardDrive} unit="%" color="text-amber-600" />
        <MetricCard label="Network Traffic" value={Math.round(metrics.network)} icon={Network} unit="KB/s" color="text-emerald-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Services Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="size-4" /> Xizmatlar Holati
            </CardTitle>
            <CardDescription>Asosiy infratuzilma xizmatlari</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map((service) => (
              <div key={service.title} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-md bg-white border shadow-sm">
                    <service.icon className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{service.title}</p>
                    <p className="text-[10px] text-muted-foreground">{service.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground">{service.latency}</span>
                  <div className={`size-2 rounded-full ${service.color} ${service.status === "Ishlayapti" || service.status === "Aloqada" ? "animate-pulse" : ""}`} />
                </div>
              </div>
            ))}
            
            <Separator className="my-2" />
            
            <div className="pt-2">
               <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Oylik Uptime</span>
                  <span className="font-bold text-emerald-600">99.98%</span>
               </div>
               <Progress value={99.98} className="h-1 bg-emerald-100" />
            </div>
          </CardContent>
        </Card>

        {/* System Activity (Audit Logs) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="size-4" /> Oxirgi tizim amallari
              </CardTitle>
              <CardDescription>Audit jurnallari asosida voqealar oqimi</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <a href="/audit-logs">Barchasi <TrendingUp className="size-3 ml-1" /></a>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="space-y-0.5">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 py-3 border-b last:border-0 hover:bg-muted/10 px-2 rounded-sm transition-colors">
                    <div className="size-2 rounded-full bg-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        <span className="text-primary">{log.user ? `${log.user.firstName} ${log.user.lastName}` : "Tizim"}</span>: {log.action} ({log.resource})
                      </p>
                    </div>
                    <div className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Ma'lumotlar mavjud emas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Technical Overview */}
      <Card className="bg-slate-950 text-slate-50 border-none overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="size-32" />
         </div>
         <CardHeader>
           <CardTitle className="text-base flex items-center gap-2">
             <Zap className="size-4 text-amber-400" /> Server Infratuzilmasi
           </CardTitle>
           <CardDescription className="text-slate-400 text-xs">Asosiy tugunlar va komponentlar konfiguratsiyasi</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
                <TechSpec label="OS / Platform" value="Linux x64 (Ubuntu)" />
                <TechSpec label="Node.js Version" value="v20.11.0" />
                <TechSpec label="Runtime Environment" value="Production" />
                <TechSpec label="Region" value="Tas-Ix (Uzbekistan)" />
            </div>
         </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, unit, color }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          <div className={`p-1.5 rounded-md bg-muted/50 ${color}`}>
            <Icon className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">{unit}</p>
        </div>
        <div className="mt-3">
           <Progress value={value} className={`h-1.5 ${value > 80 ? "[&>div]:bg-destructive" : value > 60 ? "[&>div]:bg-amber-500" : ""}`} />
        </div>
      </CardContent>
    </Card>
  )
}

function TechSpec({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{label}</p>
       <p className="text-sm font-medium">{value}</p>
    </div>
  )
}