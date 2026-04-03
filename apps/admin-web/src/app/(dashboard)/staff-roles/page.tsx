import { Shield } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function StaffRolesPage() {
    return (
      <ModulePlaceholder
        title="Xodim rollari"
        description="Xodim rollarini boshqarish"
        icon={Shield}
        features={["Rollar ro'yxati","Ruxsatlar","Tayinlash"]}
      />
    )
  }
  