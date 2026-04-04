"use client"

import { Plug, MessageSquare, CreditCard, Mail, Database } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function IntegrationsPage() {
  return (
    <ModulePlaceholder
      title="Integratsiyalar"
      description="Tashqi xizmatlar va API integratsiyalarini boshqarish"
      icon={Plug}
      features={[
        { title: "SMS xizmatlari", description: "SMS yuborish uchun provayderlar", icon: MessageSquare },
        { title: "To'lov tizimlari", description: "Click, Payme va boshqa to'lov tizimlari", icon: CreditCard },
        { title: "Email xizmatlari", description: "Email yuborish va shablon boshqaruvi", icon: Mail },
        { title: "Tashqi API", description: "Uchinchi tomon API ulanishlari", icon: Database },
      ]}
    />
  )
}