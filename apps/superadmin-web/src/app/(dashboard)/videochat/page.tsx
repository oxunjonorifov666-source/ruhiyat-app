import { Video } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function VideochatPage() {
    return (
      <ModulePlaceholder
        title="Videochat"
        description="Video qo'ng'iroqlarni boshqarish"
        icon={Video}
        features={["Faol qo'ng'iroqlar","Qo'ng'iroqlar tarixi","Sifat nazorati"]}
      />
    )
  }
  