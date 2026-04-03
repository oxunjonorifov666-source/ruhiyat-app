import { Settings } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function CenterSettingsPage() {
    return (
      <ModulePlaceholder
        title="Markaz sozlamalari"
        description="Ta'lim markazi sozlamalari"
        icon={Settings}
        features={["Umumiy ma'lumotlar","Ish vaqti","Manzil","Logo"]}
      />
    )
  }
  