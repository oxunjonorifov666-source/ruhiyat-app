import { Users } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function StudentsPage() {
    return (
      <ModulePlaceholder
        title="O'quvchilar"
        description="O'quvchilarni boshqarish"
        icon={Users}
        features={["O'quvchilar ro'yxati","Yangi qo'shish","Filtrlash","Davomat","To'lovlar holati","Natijalar"]}
      />
    )
  }
  