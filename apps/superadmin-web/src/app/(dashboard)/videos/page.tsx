"use client"

import { PlayCircle, Plus, FolderOpen, Eye } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function VideosPage() {
  return (
    <ModulePlaceholder
      title="Video kutubxona"
      description="Video materiallarni boshqarish va tarqatish"
      icon={PlayCircle}
      features={[
        { title: "Video fayllar", description: "Barcha video materiallar kutubxonasi", icon: PlayCircle },
        { title: "Yangi video", description: "Yangi video fayl yuklash", icon: Plus },
        { title: "Kategoriyalar", description: "Video materiallar kategoriyalari", icon: FolderOpen },
        { title: "Ko'rishlar", description: "Video ko'rishlar statistikasi", icon: Eye },
      ]}
    />
  )
}