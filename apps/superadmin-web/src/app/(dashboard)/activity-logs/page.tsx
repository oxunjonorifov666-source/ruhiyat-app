"use client"

import { Activity, Users, Clock, Filter } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function ActivityLogsPage() {
  return (
    <ModulePlaceholder
      title="Faollik jurnali"
      description="Foydalanuvchilar faolligi va tizim hodisalari"
      icon={Activity}
      features={[
        { title: "Foydalanuvchi faolligi", description: "Kirish, chiqish va harakatlar logi", icon: Users },
        { title: "Tizim hodisalari", description: "Tizim darajasidagi hodisalar va xatolar", icon: Activity },
        { title: "Vaqt bo'yicha filtr", description: "Ma'lum vaqt oralig'ida qidirish", icon: Clock },
        { title: "Filtrlash", description: "Tur va foydalanuvchi bo'yicha filtr", icon: Filter },
      ]}
    />
  )
}