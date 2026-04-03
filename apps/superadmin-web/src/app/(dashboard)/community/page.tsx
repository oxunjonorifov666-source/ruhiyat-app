import { Globe } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function CommunityPage() {
    return (
      <ModulePlaceholder
        title="Hamjamiyat"
        description="Hamjamiyat faoliyatini boshqarish"
        icon={Globe}
        features={["Postlar","Foydalanuvchilar","Moderatsiya","Statistika"]}
      />
    )
  }
  