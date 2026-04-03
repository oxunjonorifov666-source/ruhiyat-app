import { Users } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function UsersPage() {
    return (
      <ModulePlaceholder
        title="Foydalanuvchilar"
        description="Barcha foydalanuvchilarni boshqarish"
        icon={Users}
        features={["Foydalanuvchilar ro'yxati","Yangi qo'shish","Filtrlash","Eksport","Faollik tarixi","Bloklash/Aktivlashtirish"]}
      />
    )
  }
  