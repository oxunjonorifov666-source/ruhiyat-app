import { FileText } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function ReportsPage() {
    return (
      <ModulePlaceholder
        title="Hisobotlar"
        description="Markaz hisobotlari"
        icon={FileText}
        features={["Oylik hisobotlar","Moliyaviy hisobotlar","O'quvchilar hisoboti","Eksport"]}
      />
    )
  }
  