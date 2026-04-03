import { Plug } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function IntegrationsPage() {
    return (
      <ModulePlaceholder
        title="Integratsiyalar"
        description="Tashqi xizmatlar"
        icon={Plug}
        features={["Faol integratsiyalar","Yangi qo'shish","Sozlamalar"]}
      />
    )
  }
  