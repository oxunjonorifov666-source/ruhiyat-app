import { Lock } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function SecurityPage() {
    return (
      <ModulePlaceholder
        title="Xavfsizlik"
        description="Platformaning xavfsizlik sozlamalari"
        icon={Lock}
        features={["Parol siyosati","Ikki bosqichli tasdiqlash","IP cheklovlar","Sessiya boshqaruvi"]}
      />
    )
  }
  