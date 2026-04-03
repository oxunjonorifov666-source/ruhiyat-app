import { Brain } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function PsychologistsPage() {
    return (
      <ModulePlaceholder
        title="Psixologlar"
        description="Markaz psixologlarini boshqarish"
        icon={Brain}
        features={["Psixologlar ro'yxati","Seanslar","Grafik","Hisobotlar"]}
      />
    )
  }
  