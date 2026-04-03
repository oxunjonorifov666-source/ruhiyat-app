import { ClipboardList } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function TestsPage() {
    return (
      <ModulePlaceholder
        title="Testlar"
        description="Psixologik testlarni boshqarish"
        icon={ClipboardList}
        features={["Testlar ro'yxati","Natijalar","Statistika","Eksport"]}
      />
    )
  }
  