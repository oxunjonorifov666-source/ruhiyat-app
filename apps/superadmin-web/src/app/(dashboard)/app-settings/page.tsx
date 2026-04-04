"use client"

import { Smartphone, Bell, Palette, Globe, Shield, Database } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function AppSettingsPage() {
return (
  <ModulePlaceholder
    title="Ilova sozlamalari"
    description="Mobil ilova va web panel sozlamalarini boshqarish"
    icon={Smartphone}
    features={[
      { title: "Umumiy sozlamalar", description: "Ilova nomi, logo, til sozlamalari", icon: Globe },
      { title: "Bildirishnoma sozlamalari", description: "Push va email bildirishnomalar", icon: Bell },
      { title: "Dizayn sozlamalari", description: "Ranglar, shriftlar, mavzu", icon: Palette },
      { title: "Xavfsizlik sozlamalari", description: "Parol siyosati, ikki bosqichli tekshirish", icon: Shield },
      { title: "Ma'lumotlar bazasi", description: "Cache, backup, sinxronizatsiya", icon: Database },
    ]}
  />
)
}
