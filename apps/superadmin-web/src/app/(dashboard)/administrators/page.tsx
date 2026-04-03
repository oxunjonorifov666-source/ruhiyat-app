import { UserCog } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function AdministratorsPage() {
    return (
      <ModulePlaceholder
        title="Administratorlar"
        description="Ta'lim markaz administratorlarini boshqarish"
        icon={UserCog}
        features={["Administratorlar ro'yxati","Yangi taklif qilish","Markaz bog'lash","Ruxsatlar"]}
      />
    )
  }
  