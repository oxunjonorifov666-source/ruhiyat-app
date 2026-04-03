import { Lock } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function SecurityPage() {
    return (
      <ModulePlaceholder
        title="Xavfsizlik"
        description="Xavfsizlik sozlamalari"
        icon={Lock}
        features={["Parol siyosati","Sessiya boshqaruvi","Kirish tarixi"]}
      />
    )
  }
  