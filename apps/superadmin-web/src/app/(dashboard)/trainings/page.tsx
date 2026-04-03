import { GraduationCap } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function TrainingsPage() {
    return (
      <ModulePlaceholder
        title="Treninglar"
        description="Trening dasturlarini boshqarish"
        icon={GraduationCap}
        features={["Treninglar ro'yxati","Yangi trening","Qatnashchilar","Jadval"]}
      />
    )
  }
  