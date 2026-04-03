import { Activity } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function ActivityLogsPage() {
    return (
      <ModulePlaceholder
        title="Faollik loglari"
        description="Foydalanuvchi faollik tarixi"
        icon={Activity}
        features={["Faollik jurnali","Filtrlash","Foydalanuvchi bo'yicha"]}
      />
    )
  }
  