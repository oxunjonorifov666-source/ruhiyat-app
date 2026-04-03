import { Brain } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function PsychologistsPage() {
    return (
      <ModulePlaceholder
        title="Psixologlar"
        description="Psixolog profillarini boshqarish"
        icon={Brain}
        features={["Psixologlar ro'yxati","Yangi qo'shish","Sertifikatlar","Seanslar","Reyting","Grafik"]}
      />
    )
  }
  