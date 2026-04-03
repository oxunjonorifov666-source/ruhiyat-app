import { UsersRound } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function GroupsPage() {
    return (
      <ModulePlaceholder
        title="Guruhlar"
        description="O'quv guruhlarini boshqarish"
        icon={UsersRound}
        features={["Guruhlar ro'yxati","Yangi guruh","A'zolar","Dars jadvali"]}
      />
    )
  }
  