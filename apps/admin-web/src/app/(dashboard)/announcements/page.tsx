import { Megaphone } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function AnnouncementsPage() {
    return (
      <ModulePlaceholder
        title="E'lonlar"
        description="E'lonlarni boshqarish"
        icon={Megaphone}
        features={["E'lonlar ro'yxati","Yangi e'lon","Arxiv"]}
      />
    )
  }
  