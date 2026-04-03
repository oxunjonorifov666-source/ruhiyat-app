import { Bell } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function NotificationsPage() {
    return (
      <ModulePlaceholder
        title="Bildirishnomalar"
        description="Bildirishnomalarni boshqarish"
        icon={Bell}
        features={["Bildirishnoma yuborish","Tarix","Shablonlar"]}
      />
    )
  }
  