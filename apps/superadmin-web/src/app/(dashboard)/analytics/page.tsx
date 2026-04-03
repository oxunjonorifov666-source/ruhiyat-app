import { BarChart3 } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function AnalyticsPage() {
    return (
      <ModulePlaceholder
        title="Analitika"
        description="Platformaning batafsil tahlili va ko'rsatkichlari"
        icon={BarChart3}
        features={["Foydalanuvchilar statistikasi","Daromad tahlili","Faollik ko'rsatkichlari","O'sish tendentsiyalari","Mintaqaviy tahlil","Konversiya ko'rsatkichlari"]}
      />
    )
  }
  