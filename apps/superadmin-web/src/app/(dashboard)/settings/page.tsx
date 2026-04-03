import { Settings } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function SettingsPage() {
    return (
      <ModulePlaceholder
        title="Sozlamalar"
        description="Platformaning umumiy sozlamalari"
        icon={Settings}
        features={["Umumiy sozlamalar","Xavfsizlik","Bildirishnomalar","Til sozlamalari"]}
      />
    )
  }
  