import { BarChart3 } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function ResultsAnalyticsPage() {
    return (
      <ModulePlaceholder
        title="Natijalar analitikasi"
        description="Test natijalari tahlili"
        icon={BarChart3}
        features={["Umumiy natijalar","Guruh bo'yicha","Individual tahlil"]}
      />
    )
  }
  