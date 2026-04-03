import { Monitor } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function MonitoringPage() {
    return (
      <ModulePlaceholder
        title="Texnik monitoring"
        description="Tizimning texnik holati"
        icon={Monitor}
        features={["Server holati","Ma'lumotlar bazasi","API ishlashi","Xatolar jurnali"]}
      />
    )
  }
  