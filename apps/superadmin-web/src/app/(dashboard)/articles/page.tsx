import { Newspaper } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function ArticlesPage() {
    return (
      <ModulePlaceholder
        title="Maqolalar CMS"
        description="Maqolalarni yaratish va boshqarish"
        icon={Newspaper}
        features={["Maqolalar ro'yxati","Yangi maqola","Kategoriyalar","Qoralama","Nashr etilgan","Arxivlangan"]}
      />
    )
  }
  