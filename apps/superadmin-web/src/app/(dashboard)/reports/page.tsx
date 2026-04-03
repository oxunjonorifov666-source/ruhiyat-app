import { FileText } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function ReportsPage() {
    return (
      <ModulePlaceholder
        title="Hisobotlar"
        description="Platformaning batafsil hisobotlari"
        icon={FileText}
        features={["Oylik hisobotlar","Yillik hisobotlar","Maxsus hisobotlar","Eksport qilish","Moliyaviy hisobotlar","Foydalanuvchi hisobotlari"]}
      />
    )
  }
  