import { Heart } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function AffirmationsPage() {
    return (
      <ModulePlaceholder
        title="Afirmatsiyalar"
        description="Ijobiy fikrlash afirmatsiyalarini boshqarish"
        icon={Heart}
        features={["Afirmatsiyalar ro'yxati","Yangi qo'shish","Kategoriyalar"]}
      />
    )
  }
  