"use client"

import { Image, Plus, Eye, Calendar } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function BannersPage() {
  return (
    <ModulePlaceholder
      title="Bannerlar"
      description="Platformadagi bannerlarni yaratish va boshqarish"
      icon={Image}
      features={[
        { title: "Faol bannerlar", description: "Hozirda ko'rsatilayotgan bannerlar", icon: Eye },
        { title: "Yangi banner", description: "Yangi banner yaratish va yuklash", icon: Plus },
        { title: "Rejalashtirish", description: "Bannerlarni vaqt bo'yicha rejalashtirish", icon: Calendar },
      ]}
    />
  )
}