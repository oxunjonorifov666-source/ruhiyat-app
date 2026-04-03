import { Image } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function BannersPage() {
    return (
      <ModulePlaceholder
        title="Bannerlar"
        description="Reklama bannerlarini boshqarish"
        icon={Image}
        features={["Faol bannerlar","Yangi banner","Jadval","Statistika"]}
      />
    )
  }
  