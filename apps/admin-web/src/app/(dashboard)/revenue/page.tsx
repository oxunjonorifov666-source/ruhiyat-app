import { DollarSign } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function RevenuePage() {
    return (
      <ModulePlaceholder
        title="Daromadlar"
        description="Daromad tahlili"
        icon={DollarSign}
        features={["Umumiy daromad","Oylik tahlil","Kurslar bo'yicha"]}
      />
    )
  }
  