"use client"

import { PageHeader } from "@/components/page-header"
import { UserPlus } from "lucide-react"
import { StudentForm } from "@/components/students/student-form"

export default function NewStudentPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Yangi o'quvchi qo'shish" 
        subtitle="Markazga yangi obunachi yoki o'quvchi ro'yxatdan o'tkazish"
        icon={UserPlus} 
      />
      <div className="px-1">
        <StudentForm />
      </div>
    </div>
  )
}
