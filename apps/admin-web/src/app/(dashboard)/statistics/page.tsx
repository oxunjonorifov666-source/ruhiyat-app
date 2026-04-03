import { PieChart } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function StatisticsPage() {
    return (
      <ModulePlaceholder
        title="Statistika"
        description="Markaz statistikasi"
        icon={PieChart}
        features={["Umumiy statistika","Solishtirma tahlil","Grafiklar"]}
      />
    )
  }
  