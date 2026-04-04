"use client"

import { Eye, ImageOff, MessageSquareOff, FileWarning } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function ContentControlPage() {
return (
  <ModulePlaceholder
    title="Kontent nazorati"
    description="Platformadagi barcha kontentni nazorat qilish va moderatsiya"
    icon={Eye}
    features={[
      { title: "Tasdiqlanmagan kontent", description: "Nashr uchun kutilayotgan materiallar", icon: FileWarning },
      { title: "Rasm moderatsiyasi", description: "Rasm va media fayllarni tekshirish", icon: ImageOff },
      { title: "Izoh moderatsiyasi", description: "Foydalanuvchi izohlarini nazorat qilish", icon: MessageSquareOff },
    ]}
  />
)
}
