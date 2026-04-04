"use client"

import { Ban, UserX, Clock, ListChecks } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function BlockingPage() {
return (
  <ModulePlaceholder
    title="Bloklash"
    description="Bloklangan foydalanuvchilar va kontentni boshqarish"
    icon={Ban}
    features={[
      { title: "Bloklangan foydalanuvchilar", description: "Doimiy va vaqtincha bloklangan hisoblar", icon: UserX },
      { title: "Vaqtincha cheklashlar", description: "Muddatli cheklash va ogohlantirishlar", icon: Clock },
      { title: "Bloklash tarixi", description: "Barcha bloklash amallari logi", icon: ListChecks },
    ]}
  />
)
}
