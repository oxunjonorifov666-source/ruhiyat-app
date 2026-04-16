"use client"

import { useState } from "react"
import { Plus, Trash2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { CreateTestDto, CreateQuestionDto } from "@/lib/test-types"

interface TestBuilderProps {
  initialData?: CreateTestDto
  onSave: (data: CreateTestDto) => void
  onCancel: () => void
  loading?: boolean
}

export function TestBuilder({ initialData, onSave, onCancel, loading }: TestBuilderProps) {
  const [test, setTest] = useState<CreateTestDto>(initialData || {
    title: "", description: "", category: "Psixologik", questions: [], isPublished: true,
  })

  const addQuestion = () => {
    const newQuestion: CreateQuestionDto = {
      text: "", answers: [
        { text: "Hech qachon", score: 0 },
        { text: "Bir necha kun", score: 1 },
        { text: "Yarim vaqtdan ko'p", score: 2 },
        { text: "Deyarli har kuni", score: 3 },
      ]
    }
    setTest({ ...test, questions: [...test.questions, newQuestion] })
  }

  const removeQuestion = (idx: number) => {
    setTest({ ...test, questions: test.questions.filter((_, i) => i !== idx) })
  }

  const updateQuestion = (idx: number, text: string) => {
    const questions = [...test.questions]
    questions[idx].text = text
    setTest({ ...test, questions })
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 bg-muted/30 p-6 rounded-xl border">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Test nomi</Label>
          <Input 
            placeholder="Masalan: PHQ-9 (Depressiya testi)" 
            value={test.title} 
            onChange={e => setTest({ ...test, title: e.target.value })}
            className="h-11 bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Tavsif</Label>
          <Textarea 
            placeholder="Test haqida qisqacha ma'lumot..." 
            value={test.description || ""} 
            onChange={e => setTest({ ...test, description: e.target.value })}
            className="bg-background min-h-[100px]"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            Savollar <span className="text-sm font-normal text-muted-foreground">({test.questions.length} ta)</span>
          </h3>
          <Button onClick={addQuestion} size="sm" className="gap-1.5 rounded-full px-4">
            <Plus className="size-4" /> Savol qo'shish
          </Button>
        </div>

        {test.questions.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
             <Plus className="size-8 opacity-20" />
             <p>Hali savollar qo'shilmagan. Boshlash uchun tepasidagi tugmani bosing.</p>
          </div>
        ) : test.questions.map((q, qIdx) => (
          <Card key={qIdx} className="overflow-hidden border-2 border-primary/5 hover:border-primary/20 transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary font-bold text-xs select-none">
                  {String(qIdx + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 space-y-2">
                  <Input 
                    placeholder="Savol matnini kiriting..." 
                    value={q.text} 
                    onChange={e => updateQuestion(qIdx, e.target.value)}
                    className="border-none text-lg font-semibold px-0 focus-visible:ring-0 placeholder:opacity-40 h-auto"
                  />
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {q.answers.map((a, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg border border-transparent">
                        <CheckCircle2 className="size-4 text-emerald-500 opacity-60" />
                        <span className="text-sm flex-1">{a.text}</span>
                        <span className="text-[10px] bg-background px-2 py-0.5 border rounded-full text-muted-foreground">{a.score} b</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => removeQuestion(qIdx)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t sticky bottom-0 bg-background/80 backdrop-blur pb-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-input"
            checked={test.isPublished !== false}
            onChange={(e) => setTest({ ...test, isPublished: e.target.checked })}
          />
          <span>Mobil ilovada ko‘rsatish (chop etilgan)</span>
        </label>
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Bekor qilish</Button>
          <Button 
            disabled={!test.title || test.questions.length === 0 || loading}
            onClick={() => onSave({ ...test, isPublished: test.isPublished !== false })}
          >
            {loading ? "Saqlanmoqda..." : "Testni saqlash"}
          </Button>
        </div>
      </div>
    </div>
  )
}
