import { PlayCircle } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function VideosPage() {
    return (
      <ModulePlaceholder
        title="Video kutubxona"
        description="Video kontentni boshqarish"
        icon={PlayCircle}
        features={["Video fayllar","Yangi yuklash","Kategoriyalar","Ko'rishlar"]}
      />
    )
  }
  