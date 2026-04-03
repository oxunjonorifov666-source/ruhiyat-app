import { History } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function SessionsHistoryPage() {
    return (
      <ModulePlaceholder
        title="Seanslar tarixi"
        description="O'tgan seanslarni ko'rish"
        icon={History}
        features={["Seanslar ro'yxati","Filtrlash","Batafsil ko'rish","Eksport"]}
      />
    )
  }
  