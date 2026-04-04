"use client"

import { GraduationCap, Plus, BookOpen, Users } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function TrainingsPage() {
  return (
    <ModulePlaceholder
      title="Treninglar"
      description="Ta'lim treninglarini yaratish va boshqarish"
      icon={GraduationCap}
      features={[
        { title: "Treninglar ro'yxati", description: "Barcha mavjud treninglar", icon: BookOpen },
        { title: "Yangi trening", description: "Yangi trening dasturi yaratish", icon: Plus },
        { title: "Ishtirokchilar", description: "Trening ishtirokchilari boshqaruvi", icon: Users },
      ]}
    />
  )
}