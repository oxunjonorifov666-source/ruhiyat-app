import { UserCog } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function StaffPage() {
    return (
      <ModulePlaceholder
        title="Xodimlar"
        description="Markaz xodimlarini boshqarish"
        icon={UserCog}
        features={["Xodimlar ro'yxati","Yangi qo'shish","Lavozimlar","Ish grafigi"]}
      />
    )
  }
  