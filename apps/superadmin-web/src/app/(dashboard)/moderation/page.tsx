import { AlertTriangle } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function ModerationPage() {
    return (
      <ModulePlaceholder
        title="Moderatsiya markazi"
        description="Kontent moderatsiyasi va shikoyatlar"
        icon={AlertTriangle}
        features={["Kutilayotgan shikoyatlar","Ko'rib chiqilganlar","Moderatsiya qoidalari","Bloklangan kontentlar"]}
      />
    )
  }
  