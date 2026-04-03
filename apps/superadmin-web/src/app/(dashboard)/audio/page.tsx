import { Headphones } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function AudioPage() {
    return (
      <ModulePlaceholder
        title="Audio kutubxona"
        description="Audio kontentni boshqarish"
        icon={Headphones}
        features={["Audio fayllar","Yangi yuklash","Kategoriyalar","Pleylistlar"]}
      />
    )
  }
  