import { MessageSquare } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function ChatPage() {
    return (
      <ModulePlaceholder
        title="Chat"
        description="Platformadagi chatlarni kuzatish va boshqarish"
        icon={MessageSquare}
        features={["Faol chatlar","Chat tarixi","Filtrlash","Moderatsiya"]}
      />
    )
  }
  