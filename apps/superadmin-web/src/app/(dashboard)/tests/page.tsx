import { ClipboardList } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function TestsPage() {
    return (
      <ModulePlaceholder
        title="Psixologik testlar"
        description="Test va so'rovnomalarni boshqarish"
        icon={ClipboardList}
        features={["Testlar ro'yxati","Yangi test","Savollar","Natijalar","Statistika","Eksport"]}
      />
    )
  }
  