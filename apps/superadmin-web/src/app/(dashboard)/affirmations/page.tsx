"use client"

import { Heart, Plus, Sparkles, FolderOpen } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function AffirmationsPage() {
  return (
    <ModulePlaceholder
      title="Affirmatsiyalar"
      description="Ijobiy affirmatsiyalarni yaratish va boshqarish"
      icon={Heart}
      features={[
        { title: "Affirmatsiyalar ro'yxati", description: "Barcha affirmatsiyalar", icon: Sparkles },
        { title: "Yangi affirmatsiya", description: "Yangi affirmatsiya qo'shish", icon: Plus },
        { title: "Kategoriyalar", description: "Mavzular bo'yicha guruhlash", icon: FolderOpen },
      ]}
    />
  )
}