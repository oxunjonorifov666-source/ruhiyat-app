import { PieChart } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function StatisticsPage() {
    return (
      <ModulePlaceholder
        title="Statistika"
        description="Umumiy statistik ma'lumotlar"
        icon={PieChart}
        features={["Umumiy statistika","Solishtirma tahlil","Prognozlar"]}
      />
    )
  }
  