import React from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { useRouter } from "next/navigation"

interface FormFooterProps {
  loading: boolean
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  disabled?: boolean
}

export function FormFooter({
  loading,
  submitLabel = "Saqlash",
  cancelLabel = "Bekor qilish",
  onCancel,
  disabled = false
}: FormFooterProps) {
  const router = useRouter()

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  return (
    <div className="flex items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleCancel}
        disabled={loading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {cancelLabel}
      </Button>
      <Button 
        type="submit" 
        disabled={loading || disabled}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        {submitLabel}
      </Button>
    </div>
  )
}
