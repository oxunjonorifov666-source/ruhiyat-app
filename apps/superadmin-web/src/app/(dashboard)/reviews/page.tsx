"use client"

import { Star, MessageSquare, ThumbsUp, TrendingUp } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function ReviewsPage() {
  return (
    <ModulePlaceholder
      title="Sharhlar"
      description="Foydalanuvchilar sharhlarini ko'rish va boshqarish"
      icon={Star}
      features={[
        { title: "Barcha sharhlar", description: "Platformadagi barcha sharhlar ro'yxati", icon: MessageSquare },
        { title: "Reytinglar", description: "Psixologlar va xizmatlar reytingi", icon: ThumbsUp },
        { title: "Tendentsiyalar", description: "Sharh tendentsiyalari va tahlil", icon: TrendingUp },
      ]}
    />
  )
}