import { Calendar } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function MeetingsPage() {
    return (
      <ModulePlaceholder
        title="Uchrashuvlar"
        description="Uchrashuvlar va seanslarni boshqarish"
        icon={Calendar}
        features={["Rejalashtirilgan","Jarayonda","Yakunlangan","Bekor qilingan"]}
      />
    )
  }
  