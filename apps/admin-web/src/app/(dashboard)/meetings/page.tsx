import { Calendar } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function MeetingsPage() {
    return (
      <ModulePlaceholder
        title="Uchrashuvlar"
        description="Uchrashuvlarni rejalashtirish"
        icon={Calendar}
        features={["Uchrashuvlar jadvali","Yangi uchrashuv","Tarix"]}
      />
    )
  }
  