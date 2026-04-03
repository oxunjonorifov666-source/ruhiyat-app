import { BookOpen } from "lucide-react"
  import { ModulePlaceholder } from "@/components/module-placeholder"

  export default function CoursesPage() {
    return (
      <ModulePlaceholder
        title="Kurslar"
        description="O'quv kurslarini boshqarish"
        icon={BookOpen}
        features={["Kurslar ro'yxati","Yangi kurs","Kategoriyalar","O'quvchilar soni","Grafik"]}
      />
    )
  }
  