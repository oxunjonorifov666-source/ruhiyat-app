import { Shield } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function RolesPage() {
    return (
      <ModulePlaceholder
        title="Rollar va ruxsatlar"
        description="Foydalanuvchi rollari va ruxsatlarni boshqarish"
        icon={Shield}
        features={["Rollar ro'yxati","Yangi rol yaratish","Ruxsatlar matritsa","Rol tayinlash"]}
      />
    )
  }
  