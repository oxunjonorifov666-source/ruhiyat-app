import { ScrollText } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function AuditLogsPage() {
    return (
      <ModulePlaceholder
        title="Audit loglari"
        description="Tizimdagi barcha o'zgarishlar jurnali"
        icon={ScrollText}
        features={["So'nggi loglar","Filtrlash","Eksport","Batafsil ko'rish"]}
      />
    )
  }
  