import { Star } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function ReviewsPage() {
    return (
      <ModulePlaceholder
        title="Sharhlar"
        description="Foydalanuvchi sharhlarini ko'rish va boshqarish"
        icon={Star}
        features={["Barcha sharhlar","Reyting tahlili","Javob berish"]}
      />
    )
  }
  