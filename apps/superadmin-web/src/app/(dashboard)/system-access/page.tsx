"use client"

import { Shield, Key, Users, Lock, FileCheck } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function SystemAccessPage() {
return (
  <ModulePlaceholder
    title="Access nazorati"
    description="Tizim darajasidagi kirish huquqlarini boshqarish"
    icon={Shield}
    features={[
      { title: "API ruxsatlar", description: "API endpointlariga kirish huquqlari", icon: Key },
      { title: "Foydalanuvchi guruhlari", description: "Kirish guruhlari va siyosatlar", icon: Users },
      { title: "IP cheklovlari", description: "IP manzillar bo'yicha kirish nazorati", icon: Lock },
      { title: "Audit trail", description: "Kirish urinishlari logi", icon: FileCheck },
    ]}
  />
)
}
