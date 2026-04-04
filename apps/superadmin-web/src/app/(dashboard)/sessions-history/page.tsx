"use client"

import { History, Calendar, Users, BarChart3 } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function SessionsHistoryPage() {
  return (
    <ModulePlaceholder
      title="Seanslar tarixi"
      description="O'tgan seanslar arxivi va tahlili"
      icon={History}
      features={[
        { title: "Seanslar arxivi", description: "Barcha o'tgan seanslar ro'yxati", icon: Calendar },
        { title: "Ishtirokchilar", description: "Seanslar ishtirokchilari ma'lumotlari", icon: Users },
        { title: "Statistika", description: "Seanslar bo'yicha statistik tahlil", icon: BarChart3 },
      ]}
    />
  )
}