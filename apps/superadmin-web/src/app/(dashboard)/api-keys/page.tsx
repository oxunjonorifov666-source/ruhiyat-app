import { Key } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function ApiKeysPage() {
    return (
      <ModulePlaceholder
        title="API kalitlar"
        description="API kalitlarini boshqarish"
        icon={Key}
        features={["Faol kalitlar","Yangi yaratish","O'chirish","Foydalanish statistikasi"]}
      />
    )
  }
  