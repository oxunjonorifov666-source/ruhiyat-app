import { UserCheck } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function AccessControlPage() {
    return (
      <ModulePlaceholder
        title="Kirish nazorati"
        description="Kirish huquqlarini boshqarish"
        icon={UserCheck}
        features={["Kirish qoidalari","IP cheklovlar","Sessiya boshqaruvi"]}
      />
    )
  }
  