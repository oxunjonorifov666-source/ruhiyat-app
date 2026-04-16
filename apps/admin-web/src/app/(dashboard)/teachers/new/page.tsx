"use client"

import { PageHeader } from "@/components/page-header"
import { UserPlus } from "lucide-react"
import { TeacherForm } from "@/components/teachers/teacher-form"

export default function NewTeacherPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Yangi o'qituvchi qo'shish" 
        subtitle="Markazga yangi xodim ro'yxatdan o'tkazish"
        icon={UserPlus} 
      />
      <div className="px-1">
        <TeacherForm />
      </div>
    </div>
  )
}
