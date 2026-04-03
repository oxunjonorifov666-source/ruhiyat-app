import { Puzzle } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function ProjectiveMethodsPage() {
    return (
      <ModulePlaceholder
        title="Proyektiv metodikalar"
        description="Psixologik proyektiv metodikalarni boshqarish"
        icon={Puzzle}
        features={["Metodikalar ro'yxati","Yangi qo'shish","Natijalar"]}
      />
    )
  }
  