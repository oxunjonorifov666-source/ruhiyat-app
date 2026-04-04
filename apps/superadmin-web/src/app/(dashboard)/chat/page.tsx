"use client"

import { MessageSquare, Users, Search, Shield } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function ChatPage() {
return (
  <ModulePlaceholder
    title="Chat"
    description="Platformadagi chatlarni kuzatish va boshqarish"
    icon={MessageSquare}
    features={[
      { title: "Faol chatlar", description: "Hozirda davom etayotgan suhbatlar", icon: MessageSquare },
      { title: "Chat tarixi", description: "Barcha suhbatlar arxivi va qidirish", icon: Search },
      { title: "Foydalanuvchi chatlari", description: "Foydalanuvchilar orasidagi aloqa", icon: Users },
      { title: "Moderatsiya", description: "Chat kontentini nazorat qilish", icon: Shield },
    ]}
  />
)
}
