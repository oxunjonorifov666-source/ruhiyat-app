"use client"

import { Puzzle, Plus, Brain, BarChart3 } from "lucide-react"
import { ModulePlaceholder } from "@/components/module-placeholder"

export default function ProjectiveMethodsPage() {
  return (
    <ModulePlaceholder
      title="Proyektiv metodikalar"
      description="Psixologik proyektiv metodikalarni boshqarish"
      icon={Puzzle}
      features={[
        { title: "Metodikalar", description: "Barcha proyektiv metodikalar ro'yxati", icon: Brain },
        { title: "Yangi metodika", description: "Yangi metodika qo'shish", icon: Plus },
        { title: "Natijalar", description: "Metodikalar natijalari tahlili", icon: BarChart3 },
      ]}
    />
  )
}