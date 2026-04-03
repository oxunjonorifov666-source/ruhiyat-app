import { CreditCard } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function PaymentsPage() {
    return (
      <ModulePlaceholder
        title="To'lovlar"
        description="To'lovlarni boshqarish va kuzatish"
        icon={CreditCard}
        features={["To'lovlar ro'yxati","Kutilayotgan","Muvaffaqiyatli","Muddati o'tgan","Qaytarilgan","Eksport"]}
      />
    )
  }
  