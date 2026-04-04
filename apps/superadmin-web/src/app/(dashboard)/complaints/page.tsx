"use client"

import { AlertTriangle, MessageSquare, Clock, CheckCircle2 } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function ComplaintsPage() {
return (
  <ModulePlaceholder
    title="Shikoyatlar"
    description="Foydalanuvchilar shikoyatlarini ko'rish va boshqarish"
    icon={AlertTriangle}
    features={[
      { title: "Yangi shikoyatlar", description: "Ko'rib chiqilmagan shikoyatlar ro'yxati", icon: MessageSquare },
      { title: "Kutilayotgan", description: "Jarayonda bo'lgan shikoyatlar", icon: Clock },
      { title: "Hal qilingan", description: "Yechilgan shikoyatlar arxivi", icon: CheckCircle2 },
    ]}
  />
)
}
