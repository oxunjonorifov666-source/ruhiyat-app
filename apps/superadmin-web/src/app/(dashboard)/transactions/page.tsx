import { ArrowLeftRight } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function TransactionsPage() {
    return (
      <ModulePlaceholder
        title="Tranzaksiyalar"
        description="Barcha moliyaviy tranzaksiyalar"
        icon={ArrowLeftRight}
        features={["Tranzaksiyalar ro'yxati","Filtrlash","Eksport","Batafsil"]}
      />
    )
  }
  