"use client"

import { UserCheck, Shield, Clock, Globe, Key } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function AccessControlPage() {
return (
  <ModulePlaceholder
    title="Kirish nazorati"
    description="Foydalanuvchilar kirish huquqlarini boshqarish va nazorat qilish"
    icon={UserCheck}
    features={[
      { title: "Kirish qoidalari", description: "Foydalanuvchilar uchun kirish siyosatlarini belgilash", icon: Shield },
      { title: "IP cheklovlar", description: "Ruxsat berilgan va bloklangan IP manzillar", icon: Globe },
      { title: "Sessiya boshqaruvi", description: "Faol sessiyalarni kuzatish va boshqarish", icon: Clock },
      { title: "API tokenlar", description: "Tashqi integratsiyalar uchun tokenlar", icon: Key },
    ]}
  />
)
}
