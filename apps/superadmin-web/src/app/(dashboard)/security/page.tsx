"use client"

import { Lock, Shield, Key, AlertTriangle, Eye } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function SecurityPage() {
  return (
    <ModulePlaceholder
      title="Xavfsizlik"
      description="Tizim xavfsizlik sozlamalari va nazorat"
      icon={Lock}
      features={[
        { title: "Parol siyosati", description: "Parol murakkabligi va amal qilish muddati", icon: Key },
        { title: "Ikki bosqichli tekshirish", description: "2FA sozlamalari va boshqaruv", icon: Shield },
        { title: "Xavfsizlik hodisalari", description: "Shubhali faoliyat va ogohlantirishlar", icon: AlertTriangle },
        { title: "Sessiya nazorati", description: "Faol sessiyalar va qurilmalar", icon: Eye },
      ]}
    />
  )
}