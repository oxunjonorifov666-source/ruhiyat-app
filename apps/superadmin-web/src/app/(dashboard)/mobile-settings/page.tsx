import { Smartphone } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function MobileSettingsPage() {
    return (
      <ModulePlaceholder
        title="Mobil ilova sozlamalari"
        description="Mobil ilovaning sozlamalari"
        icon={Smartphone}
        features={["Ilovaning umumiy sozlamalari","Push bildirishnomalar","Versiya boshqaruvi"]}
      />
    )
  }
  