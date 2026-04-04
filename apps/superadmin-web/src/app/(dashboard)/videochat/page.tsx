"use client"

import { Video, Users, Clock, Settings } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function VideochatPage() {
  return (
    <ModulePlaceholder
      title="Videochat"
      description="Video qo'ng'iroqlar va konsultatsiyalarni boshqarish"
      icon={Video}
      features={[
        { title: "Faol seanslar", description: "Hozirda davom etayotgan video seanslar", icon: Video },
        { title: "Ishtirokchilar", description: "Video seanslar ishtirokchilari", icon: Users },
        { title: "Rejalashtirish", description: "Kelgusi video uchrashuvlar", icon: Clock },
        { title: "Sozlamalar", description: "Video sifati va ulanish sozlamalari", icon: Settings },
      ]}
    />
  )
}