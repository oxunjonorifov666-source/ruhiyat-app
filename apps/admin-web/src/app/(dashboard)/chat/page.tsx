import { MessageSquare } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function ChatPage() {
    return (
      <ModulePlaceholder
        title="Chat"
        description="Xabarlar va chatlarni boshqarish"
        icon={MessageSquare}
        features={["Faol chatlar","Chat tarixi","Filtrlash"]}
      />
    )
  }
  