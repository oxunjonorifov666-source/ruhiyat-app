import { Users, GraduationCap, Brain, CreditCard, BookOpen, TrendingUp, Calendar, UsersRound } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Boshqaruv paneli"
        description="Ta'lim markazingizning umumiy holati"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Jami o'quvchilar"
          value="1,284"
          icon={Users}
          trend={{ value: 8.5, label: "o'tgan oyga nisbatan" }}
        />
        <StatsCard
          title="O'qituvchilar"
          value="32"
          icon={GraduationCap}
          description="Faol o'qituvchilar soni"
        />
        <StatsCard
          title="Psixologlar"
          value="8"
          icon={Brain}
          description="Markaz psixologlari"
        />
        <StatsCard
          title="Oylik daromad"
          value="8,450,000 so'm"
          icon={CreditCard}
          trend={{ value: 12.3, label: "o'tgan oyga nisbatan" }}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>O'quvchilar dinamikasi</CardTitle>
            <CardDescription>Oxirgi 6 oy davomida ro'yxatdan o'tganlar</CardDescription>
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
            <CardTitle>Bugungi jadval</CardTitle>
            <CardDescription>Rejalashtirilgan darslar va uchrashuvlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { text: "Matematika — 3-guruh", time: "09:00" },
                { text: "Ingliz tili — 1-guruh", time: "10:30" },
                { text: "Psixolog seansi", time: "13:00" },
                { text: "Ota-onalar yig'ilishi", time: "16:00" },
                { text: "Pedagoglar kengashi", time: "17:30" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{item.text}</span>
                  <span className="text-muted-foreground font-mono text-xs">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Faol kurslar"
          value="24"
          icon={BookOpen}
          description="Hozirgi o'quv davri"
        />
        <StatsCard
          title="Guruhlar"
          value="18"
          icon={UsersRound}
          description="Faol guruhlar soni"
        />
        <StatsCard
          title="Bugungi uchrashuvlar"
          value="5"
          icon={Calendar}
          description="Rejalashtirilgan"
        />
        <StatsCard
          title="Yangi to'lovlar"
          value="12"
          icon={CreditCard}
          trend={{ value: 3.2, label: "kechagiga nisbatan" }}
        />
      </div>
    </>
  )
}
