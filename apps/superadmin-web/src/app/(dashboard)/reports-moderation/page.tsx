"use client"

import { Flag, Users, FileText, ShieldAlert } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function ReportsModerationPage() {
return (
  <ModulePlaceholder
    title="Reportlar"
    description="Foydalanuvchilar tomonidan yuborilgan reportlarni boshqarish"
    icon={Flag}
    features={[
      { title: "Foydalanuvchi reportlari", description: "Foydalanuvchilarga tegishli reportlar", icon: Users },
      { title: "Kontent reportlari", description: "Kontentga tegishli reportlar", icon: FileText },
      { title: "Xavfsizlik reportlari", description: "Xavfsizlik bilan bog'liq reportlar", icon: ShieldAlert },
    ]}
  />
)
}
