"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { verifyStepUpApi } from "@/lib/auth"
import { VerifyPasswordError } from "@/lib/verify-password-error"
import { describeEmbeddedApiError, isStepUpRequiredError } from "@/lib/api-error"
import { ApiHttpError } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type StepUpMeta = {
  title?: string
  description?: string
}

type Resolver<T> = {
  resolve: (v: T) => void
  reject: (e: unknown) => void
  retry: () => Promise<T>
}

const StepUpContext = createContext<{
  runWithStepUp: <T>(action: () => Promise<T>, meta?: StepUpMeta) => Promise<T>
} | null>(null)

export function useStepUp() {
  const ctx = useContext(StepUpContext)
  if (!ctx) {
    throw new Error("useStepUp must be used within StepUpProvider")
  }
  return ctx
}

/**
 * Optional: use on routes rendered outside the dashboard shell (e.g. tests).
 */
export function useStepUpOptional() {
  return useContext(StepUpContext)
}

export function StepUpProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [meta, setMeta] = useState<StepUpMeta>({})
  const resolverRef = useRef<Resolver<unknown> | null>(null)

  const runWithStepUp = useCallback(
    async <T,>(action: () => Promise<T>, stepMeta?: StepUpMeta): Promise<T> => {
      try {
        return await action()
      } catch (e) {
        if (!isStepUpRequiredError(e)) throw e
        setMeta(stepMeta || {})
        setPassword("")
        return await new Promise<T>((resolve, reject) => {
          resolverRef.current = {
            resolve: resolve as (v: unknown) => void,
            reject,
            retry: action as () => Promise<unknown>,
          }
          setOpen(true)
        })
      }
    },
    [],
  )

  const closeAndReject = (reason: unknown) => {
    const r = resolverRef.current
    resolverRef.current = null
    setOpen(false)
    setPassword("")
    if (r) r.reject(reason)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      closeAndReject(new DOMException("Aborted", "AbortError"))
    }
  }

  const submit = async () => {
    const r = resolverRef.current
    if (!r) return
    const pwd = password.trim()
    if (!pwd) {
      toast.error("Parolni kiriting")
      return
    }
    setBusy(true)
    try {
      await verifyStepUpApi(pwd)
      try {
        const result = await r.retry()
        resolverRef.current = null
        setOpen(false)
        setPassword("")
        r.resolve(result)
      } catch (retryErr) {
        resolverRef.current = null
        setOpen(false)
        setPassword("")
        if (isStepUpRequiredError(retryErr)) {
          toast.error("Tasdiqlash muddati tugadi", {
            description: "Amalni qayta bosing va parolni qayta kiriting.",
          })
        } else if (retryErr instanceof ApiHttpError && retryErr.statusCode === 403) {
          const d = describeEmbeddedApiError(retryErr)
          toast.error(d.title, { description: d.description })
        } else {
          const d = describeEmbeddedApiError(retryErr)
          toast.error(d.title, { description: d.description })
        }
        r.reject(retryErr)
      }
    } catch (err) {
      if (err instanceof VerifyPasswordError) {
        if (err.isInvalidPassword) {
          toast.error("Parol noto‘g‘ri", {
            description: "Joriy akkaunt parolini tekshirib qayta urinib ko‘ring.",
          })
          return
        }
        toast.error("Tasdiqlash bajarilmadi", { description: err.message })
        return
      }
      toast.error("Tasdiqlash bajarilmadi", {
        description: err instanceof Error ? err.message : "Noma'lum xato",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <StepUpContext.Provider value={{ runWithStepUp }}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{meta.title ?? "Parolni tasdiqlang"}</DialogTitle>
            <DialogDescription>
              {meta.description ??
                "Bu amal xavfsizlik uchun qo‘shimcha tasdiqlashni talab qiladi. Joriy akkaunt parolini kiriting."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label htmlFor="step-up-password" className="sr-only">
              Parol
            </Label>
            <Input
              id="step-up-password"
              type="password"
              autoComplete="current-password"
              placeholder="Parol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  void submit()
                }
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={busy}>
              Bekor
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={busy || !password.trim()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Tasdiqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StepUpContext.Provider>
  )
}

