"use client"

import { Headphones, Plus, PlayCircle, FolderOpen } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function AudioPage() {
  return (
    <ModulePlaceholder
      title="Audio kutubxona"
      description="Audio materiallarni boshqarish va tarqatish"
      icon={Headphones}
      features={[
        { title: "Audio fayllar", description: "Barcha audio materiallar kutubxonasi", icon: PlayCircle },
        { title: "Yangi audio", description: "Yangi audio fayl yuklash", icon: Plus },
        { title: "Kategoriyalar", description: "Audio materiallar kategoriyalari", icon: FolderOpen },
      ]}
    />
  )
}