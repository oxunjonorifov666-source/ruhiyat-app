import { GraduationCap } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function TeachersPage() {
    return (
      <ModulePlaceholder
        title="O'qituvchilar"
        description="O'qituvchilarni boshqarish"
        icon={GraduationCap}
        features={["O'qituvchilar ro'yxati","Yangi qo'shish","Fanlar","Guruhlar","Grafik","Reyting"]}
      />
    )
  }
  