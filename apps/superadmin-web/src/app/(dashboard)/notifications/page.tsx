import { Bell } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function NotificationsPage() {
    return (
      <ModulePlaceholder
        title="Bildirishnomalar"
        description="Push va ichki bildirishnomalarni boshqarish"
        icon={Bell}
        features={["Bildirishnoma yuborish","Shablonlar","Jadval","Tarix"]}
      />
    )
  }
  