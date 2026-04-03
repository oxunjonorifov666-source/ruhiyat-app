import { Users, Brain, Building2, CreditCard, MessageSquare, Globe, FileText, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Boshqaruv paneli"
        description="Platformaning umumiy holati va asosiy ko'rsatkichlar"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Jami foydalanuvchilar"
          value="12,847"
          icon={Users}
          trend={{ value: 12.5, label: "o'tgan oyga nisbatan" }}
        />
        <StatsCard
          title="Faol psixologlar"
          value="48"
          icon={Brain}
          trend={{ value: 8.2, label: "o'tgan oyga nisbatan" }}
        />
        <StatsCard
          title="Ta'lim markazlari"
          value="156"
          icon={Building2}
          trend={{ value: 4.1, label: "o'tgan oyga nisbatan" }}
        />
        <StatsCard
          title="Oylik daromad"
          value="45,230,000 so'm"
          icon={CreditCard}
          trend={{ value: 18.7, label: "o'tgan oyga nisbatan" }}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Foydalanuvchilar dinamikasi</CardTitle>
            <CardDescription>Oxirgi 12 oy davomida ro'yxatdan o'tganlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="mx-auto size-8 mb-2" />
                <p>Grafik bu yerda ko'rsatiladi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>So'nggi faoliyatlar</CardTitle>
            <CardDescription>Platformadagi oxirgi harakatlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { text: "Yangi foydalanuvchi ro'yxatdan o'tdi", time: "2 daqiqa oldin" },
                { text: "Psixolog seans yakunladi", time: "15 daqiqa oldin" },
                { text: "Yangi kurs qo'shildi", time: "1 soat oldin" },
                { text: "To'lov amalga oshirildi", time: "2 soat oldin" },
                { text: "Yangi maqola nashr etildi", time: "3 soat oldin" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{item.text}</span>
                  <span className="text-muted-foreground text-xs">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Faol chatlar"
          value="234"
          icon={MessageSquare}
          description="Hozirgi faol suhbatlar"
        />
        <StatsCard
          title="Hamjamiyat postlari"
          value="1,456"
          icon={Globe}
          trend={{ value: 22.3, label: "o'tgan haftaga nisbatan" }}
        />
        <StatsCard
          title="Maqolalar"
          value="312"
          icon={FileText}
          description="Nashr etilgan maqolalar"
        />
        <StatsCard
          title="Bugungi seanslar"
          value="67"
          icon={Brain}
          trend={{ value: 5.4, label: "kechagiga nisbatan" }}
        />
      </div>
    </>
  )
}
