"use client"

import { ClipboardList, Plus, Brain, BarChart3 } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function TestsPage() {
  return (
    <ModulePlaceholder
      title="Psixologik testlar"
      description="Psixologik testlarni yaratish va boshqarish"
      icon={ClipboardList}
      features={[
        { title: "Testlar ro'yxati", description: "Barcha psixologik testlar", icon: ClipboardList },
        { title: "Yangi test", description: "Yangi test yaratish va sozlash", icon: Plus },
        { title: "Natijalar", description: "Test natijalari tahlili va statistika", icon: BarChart3 },
        { title: "Kategoriyalar", description: "Testlar kategoriyalari boshqaruvi", icon: Brain },
      ]}
    />
  )
}