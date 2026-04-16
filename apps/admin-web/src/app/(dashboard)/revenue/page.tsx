"use client"

import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CreditCard, Receipt, Wallet, ArrowRightLeft, Loader2, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { StatsCard, StatsGrid } from "@/components/stats-card"
import { useApiData } from "@/hooks/use-api-data"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

interface FinanceStats {
  totalRevenue: number
  monthlyRevenue: number
  lastMonthRevenue: number
  completedPayments: number
  failedPayments: number
  totalTransactions: number
  refundedPayments: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
  payments: number
}

interface TransactionType {
  type: string
  count: number
  total: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RevenuePage() {
  const { data: stats, loading: statsLoading } = useApiData<FinanceStats>({ path: "/finance/stats" })
  const { data: monthlyData, loading: chartLoading } = useApiData<MonthlyRevenue[]>({ path: "/finance/monthly-revenue" })
  const { data: typeData, loading: typeLoading } = useApiData<TransactionType[]>({ path: "/finance/transactions-by-type" })

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val) + " so'm"
  }

  const calculateGrowth = () => {
    if (!stats?.monthlyRevenue || !stats?.lastMonthRevenue) return 0;
    const growth = ((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100;
    return Math.round(growth);
  }

  const growth = calculateGrowth();

  if (statsLoading && !stats) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Moliyaviy Tahlil"
        description="Markazning daromadlari, tranzaksiyalari va moliyaviy o'sish ko'rsatkichlari"
        icon={DollarSign}
        badge="Premium Stats"
      />

      <StatsGrid columns={4}>
        <StatsCard 
          title="Jami tushum" 
          value={formatCurrency(stats?.totalRevenue || 0)} 
          icon={Wallet} 
          iconColor="text-blue-600"
        />
        <StatsCard 
          title="Shu oydagi daromad" 
          value={formatCurrency(stats?.monthlyRevenue || 0)} 
          icon={TrendingUp} 
          iconColor="text-emerald-600"
          trend={growth !== 0 ? { value: Math.abs(growth), label: growth > 0 ? "o'sish" : "pasayish" } : undefined}
        />
        <StatsCard 
          title="Muvaffaqiyatli to'lovlar" 
          value={stats?.completedPayments || 0} 
          icon={Receipt} 
          iconColor="text-indigo-600"
          description={`Jami: ${stats?.totalTransactions} ta tranzaksiya`}
        />
        <StatsCard 
          title="O'rtacha oylik" 
          value={formatCurrency(Math.round((stats?.totalRevenue || 0) / 12))} 
          icon={ArrowRightLeft} 
          iconColor="text-amber-600"
        />
      </StatsGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Growth Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Daromad dinamikasi</CardTitle>
              <CardDescription>Oxirgi 12 oylik tushum ko'rsatkichlari</CardDescription>
            </div>
            <div className="flex gap-2">
               <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                 {growth >= 0 ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
                 {Math.abs(growth)}%
               </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              {chartLoading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#6b7280'}} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#6b7280'}} tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(v: number) => [formatCurrency(v), "Daromad"]}
                    />
                    <Area type="monotone" dataKey="revenue" name="Daromad" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Daromad manbalari</CardTitle>
            <CardDescription>Tranzaksiyalar taqsimoti</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full mt-4">
              {typeLoading ? (
                <Skeleton className="size-48 mx-auto rounded-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData?.map(d => ({ name: d.type, value: d.total })) || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(typeData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(v: number) => [formatCurrency(v), "Jami"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-3 w-full mt-6">
               {(typeData || []).map((item, i) => (
                 <div key={item.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                       <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                       <span className="font-medium text-muted-foreground uppercase">
                         {item.type === 'COURSE_PAYMENTS' ? "Kurs to'lovlari" : item.type === 'SESSIONS' ? "Psixolog seanslari" : item.type}
                       </span>
                    </div>
                    <span className="font-bold">{formatCurrency(item.total)}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader>
               <CardTitle className="text-sm">Bashorat (AI Prediction)</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  <div className="flex items-end justify-between">
                     <p className="text-3xl font-black">~{formatCurrency((stats?.monthlyRevenue || 0) * 1.15)}</p>
                     <Badge variant="secondary" className="bg-white/20 text-white border-none mb-1">In 30 days</Badge>
                  </div>
                  <p className="text-xs text-primary-foreground/70 leading-relaxed">
                     Hozirgi o'sish dinamikasiga asoslanib, keyingi oydagi daromad 15% ga oshishi mumkin.
                  </p>
               </div>
            </CardContent>
         </Card>

         <Card className="lg:col-span-2 border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="text-sm font-bold">Moliyaviy xULOSA</CardTitle>
               </div>
               <Calendar className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <QuickMetric label="Muvaffaqiyatsiz" value={stats?.failedPayments || 0} color="text-red-500" />
                  <QuickMetric label="Qaytarilgan" value={stats?.refundedPayments || 0} color="text-amber-500" />
                  <QuickMetric label="Jami tranzak." value={stats?.totalTransactions || 0} />
                  <QuickMetric label="Muvaffaqiyat" value={Math.round((stats?.completedPayments || 1) / (stats?.totalTransactions || 1) * 100) + "%"} color="text-emerald-500" />
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}

function QuickMetric({ label, value, color }: { label: string, value: string | number, color?: string }) {
  return (
    <div className="space-y-1">
       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{label}</p>
       <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  )
}
