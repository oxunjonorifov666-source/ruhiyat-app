import { DollarSign } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function RevenuePage() {
    return (
      <ModulePlaceholder
        title="Daromadlar"
        description="Daromad tahlili va hisobotlari"
        icon={DollarSign}
        features={["Umumiy daromad","Oylik tahlil","Manbalar","Prognoz"]}
      />
    )
  }
  