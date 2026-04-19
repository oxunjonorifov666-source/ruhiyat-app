"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Scale,
  Loader2,
  Plus,
  Save,
  Phone,
  Globe,
  Sparkles,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { classifyApiError, formatEmbeddedApiError, isUserCancelledStepUp } from "@/lib/api-error"
import { useStepUp } from "@/components/step-up-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"

type LegalDocRow = {
  id: number
  kind: string
  version: string
  title: string | null
  content: string
  isActive: boolean
  publishedAt: string | null
  createdAt: string
  createdById: number | null
}

type CrisisRow = {
  id: number
  regionCode: string
  sortOrder: number
  label: string
  phoneNumber: string | null
  helpText: string | null
  isActive: boolean
}

type ComplianceSummary = {
  activeTerms: {
    id: number
    version: string
    title: string | null
    publishedAt: string | null
    updatedAt: string
  } | null
  activePrivacy: {
    id: number
    version: string
    title: string | null
    publishedAt: string | null
    updatedAt: string
  } | null
  termsVersionCounts: { version: string | null; count: number }[]
  privacyVersionCounts: { version: string | null; count: number }[]
  mobileUsersTotal: number
  mobileWithAnyConsent: number
  deletionGraceDays: number
}

type DeletionUser = {
  id: number
  email: string | null
  phone: string | null
  role: string
  accountLifecycle: string
  deletionRequestedAt: string | null
  scheduledDeletionAt: string | null
  createdAt: string
}

export default function LegalCompliancePage() {
  const { runWithStepUp } = useStepUp()
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [terms, setTerms] = useState<LegalDocRow[]>([])
  const [privacy, setPrivacy] = useState<LegalDocRow[]>([])
  const [docsLoading, setDocsLoading] = useState(true)

  const [summary, setSummary] = useState<ComplianceSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  const [deletionList, setDeletionList] = useState<DeletionUser[]>([])
  const [deletionLoading, setDeletionLoading] = useState(true)

  const [aiPrimary, setAiPrimary] = useState("")
  const [aiSecondary, setAiSecondary] = useState("")
  const [aiLoading, setAiLoading] = useState(true)

  const [crisis, setCrisis] = useState<CrisisRow[]>([])
  const [crisisLoading, setCrisisLoading] = useState(true)

  const [graceDays, setGraceDays] = useState("14")
  const [graceSaving, setGraceSaving] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogKind, setDialogKind] = useState<"TERMS_OF_SERVICE" | "PRIVACY_POLICY">("TERMS_OF_SERVICE")
  const [formVersion, setFormVersion] = useState("1.0.0")
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formPublish, setFormPublish] = useState(false)
  const [savingDoc, setSavingDoc] = useState(false)

  const [editDoc, setEditDoc] = useState<LegalDocRow | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

  const [crisisDialog, setCrisisDialog] = useState<Partial<CrisisRow> & { id?: number } | null>(null)

  const loadDocs = useCallback(async () => {
    setDocsLoading(true)
    setError(null)
    setDenied(false)
    try {
      const [t, p] = await Promise.all([
        apiClient<LegalDocRow[]>("/legal/documents?kind=TERMS_OF_SERVICE"),
        apiClient<LegalDocRow[]>("/legal/documents?kind=PRIVACY_POLICY"),
      ])
      setTerms(Array.isArray(t) ? t : [])
      setPrivacy(Array.isArray(p) ? p : [])
    } catch (e: unknown) {
      const { permissionDenied } = classifyApiError(e)
      if (permissionDenied) setDenied(true)
      else setError(formatEmbeddedApiError(e))
    } finally {
      setDocsLoading(false)
    }
  }, [])

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const res = await apiClient<ComplianceSummary>("/legal/compliance-summary")
      setSummary(res)
      setGraceDays(String(res.deletionGraceDays))
    } catch (e: unknown) {
      const { permissionDenied } = classifyApiError(e)
      if (permissionDenied) setDenied(true)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const loadDeletion = useCallback(async () => {
    setDeletionLoading(true)
    try {
      const res = await apiClient<DeletionUser[]>("/legal/account-deletion-queue")
      setDeletionList(Array.isArray(res) ? res : [])
    } catch (e: unknown) {
      const { permissionDenied } = classifyApiError(e)
      if (permissionDenied) setDenied(true)
    } finally {
      setDeletionLoading(false)
    }
  }, [])

  const loadAi = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await apiClient<{ primary: string; secondary: string }>("/legal/ai-safety")
      setAiPrimary(res.primary ?? "")
      setAiSecondary(res.secondary ?? "")
    } catch (e: unknown) {
      const { permissionDenied } = classifyApiError(e)
      if (permissionDenied) setDenied(true)
    } finally {
      setAiLoading(false)
    }
  }, [])

  const loadCrisis = useCallback(async () => {
    setCrisisLoading(true)
    try {
      const res = await apiClient<CrisisRow[]>("/legal/crisis-resources")
      setCrisis(Array.isArray(res) ? res : [])
    } catch (e: unknown) {
      const { permissionDenied } = classifyApiError(e)
      if (permissionDenied) setDenied(true)
    } finally {
      setCrisisLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocs()
    loadSummary()
    loadDeletion()
    loadAi()
    loadCrisis()
  }, [loadDocs, loadSummary, loadDeletion, loadAi, loadCrisis])

  const withStepUp = <T,>(fn: () => Promise<T>, title: string, description: string) =>
    runWithStepUp(fn, { title, description })

  const submitCreate = async () => {
    if (!formVersion.trim() || !formContent.trim()) {
      toast.error("Versiya va matn majburiy")
      return
    }
    setSavingDoc(true)
    try {
      await withStepUp(
        () =>
          apiClient("/legal/documents", {
            method: "POST",
            body: {
              kind: dialogKind,
              version: formVersion.trim(),
              title: formTitle.trim() || undefined,
              content: formContent,
              publish: formPublish,
            },
          }),
        "Hujjatni nashr qilish",
        "Yangi huquqiy hujjat versiyasi tizim va mobil uchun qayta o‘qiladi. Parolni tasdiqlang.",
      )
      toast.success("Hujjat yaratildi")
      setDialogOpen(false)
      await loadDocs()
      await loadSummary()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    } finally {
      setSavingDoc(false)
    }
  }

  const activate = async (id: number) => {
    try {
      await withStepUp(
        () => apiClient(`/legal/documents/${id}/activate`, { method: "POST" }),
        "Faol versiyani o‘rnatish",
        "Mobil foydalanuvchilar va yangi roziiliklar shu matnga bog‘lanadi. Parolni tasdiqlang.",
      )
      toast.success("Faol versiya yangilandi")
      await loadDocs()
      await loadSummary()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    }
  }

  const saveEditDoc = async () => {
    if (!editDoc) return
    try {
      await withStepUp(
        () =>
          apiClient(`/legal/documents/${editDoc.id}`, {
            method: "PATCH",
            body: { title: editTitle || undefined, content: editContent },
          }),
        "Hujjatni yangilash",
        "Hujjat matnini o‘zgartiryapsiz. Parolni tasdiqlang.",
      )
      toast.success("Saqlandi")
      setEditDoc(null)
      await loadDocs()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    }
  }

  const saveAi = async () => {
    try {
      await withStepUp(
        () => apiClient("/legal/ai-safety", { method: "PATCH", body: { primary: aiPrimary, secondary: aiSecondary } }),
        "AI ogohlantirish",
        "Mobil AI funksiyalarida ko‘rinadigan xavfsizlik matnlarini o‘zgartiryapsiz.",
      )
      toast.success("AI matnlari saqlandi")
      await loadAi()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    }
  }

  const saveCrisis = async () => {
    if (!crisisDialog) return
    const { id, label, phoneNumber, helpText, regionCode, sortOrder, isActive } = crisisDialog
    if (!label?.trim()) {
      toast.error("Yorliq majburiy")
      return
    }
    try {
      if (id) {
        await withStepUp(
          () =>
            apiClient(`/legal/crisis-resources/${id}`, {
              method: "PATCH",
              body: {
                label: label.trim(),
                phoneNumber: phoneNumber?.trim() || null,
                helpText: helpText?.trim() || null,
                regionCode: (regionCode || "GLOBAL").trim().toUpperCase() || "GLOBAL",
                sortOrder: sortOrder ?? 0,
                isActive: isActive !== false,
              },
            }),
          "Favqulodda resurs",
          "Mintaqa, telefon yoki yordam matnini o‘zgartiryapsiz.",
        )
        toast.success("Saqlandi")
      } else {
        await withStepUp(
          () =>
            apiClient("/legal/crisis-resources", {
              method: "POST",
              body: {
                label: label.trim(),
                phoneNumber: phoneNumber?.trim() || null,
                helpText: helpText?.trim() || null,
                regionCode: (regionCode || "GLOBAL").trim().toUpperCase() || "GLOBAL",
                sortOrder: sortOrder ?? 0,
                isActive: isActive !== false,
              },
            }),
          "Favqulodda resurs",
          "Yangi liniya / yordam qatorini qo‘shyapsiz.",
        )
        toast.success("Qo‘shildi")
      }
      setCrisisDialog(null)
      await loadCrisis()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    }
  }

  const removeCrisis = async (id: number) => {
    if (!window.confirm("O‘chirilsinmi?")) return
    try {
      await withStepUp(
        () => apiClient(`/legal/crisis-resources/${id}`, { method: "DELETE" }),
        "Favqulodda resurs",
        "Resurs butunlay olib tashlanadi. Parolni tasdiqlang.",
      )
      toast.success("O‘chirildi")
      await loadCrisis()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    }
  }

  const openEdit = (row: LegalDocRow) => {
    if (row.isActive) {
      toast.info("Faol nashrni o‘zgartirmang — yangi versiyani qo‘shing va nashr qiling")
      return
    }
    setEditDoc(row)
    setEditTitle(row.title || "")
    setEditContent(row.content || "")
  }

  const saveGrace = async () => {
    const n = Math.min(90, Math.max(1, parseInt(graceDays, 10) || 14))
    setGraceSaving(true)
    try {
      await withStepUp(
        () =>
          apiClient(`/settings/${encodeURIComponent("account.deletion_grace_days")}`, {
            method: "PATCH",
            body: { value: String(n), category: "legal" },
          }),
        "Hisobni o‘chirish muddati",
        "Kutilish davri — mobil va audit uchun muhim sozlama. Parolni tasdiqlang.",
      )
      setGraceDays(String(n))
      toast.success("Kutilish muddati yangilandi")
      await loadSummary()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    } finally {
      setGraceSaving(false)
    }
  }

  if (denied) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Huquqiy, rozilik va AI"
          description="system.settings ruxsati talab qilinadi"
          icon={Scale}
        />
        <EmptyState
          title="Ruxsat yo‘q"
          description="Faqat superadmin va tizim sozlamalariga (system.settings) ega foydalanuvchilar kira oladi."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Huquqiy, rozilik va AI"
        description="Shartlar, maxfiylik, rozilik analitikasi, AI ogohlantirish, favqulodda, hisob o‘chirish (mobil app uchun)"
        icon={Scale}
      />

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="flex w-full max-w-4xl flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="summary">Rozilik va nashr</TabsTrigger>
          <TabsTrigger value="terms">Foydalanish shartlari</TabsTrigger>
          <TabsTrigger value="privacy">Maxfiylik</TabsTrigger>
          <TabsTrigger value="ai">AI xavfsizlik</TabsTrigger>
          <TabsTrigger value="crisis">Favqulodda</TabsTrigger>
          <TabsTrigger value="account">Hisob o‘chirish</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Faol shartlar (public)</CardTitle>
                {summaryLoading ? (
                  <Skeleton className="h-16" />
                ) : summary?.activeTerms ? (
                  <CardDescription className="space-y-1 text-foreground">
                    <div className="font-mono text-sm">v{summary.activeTerms.version}</div>
                    {summary.activeTerms.publishedAt && (
                      <div className="text-xs text-muted-foreground">
                        Nashr: {new Date(summary.activeTerms.publishedAt).toLocaleString("uz-UZ")}
                      </div>
                    )}
                  </CardDescription>
                ) : (
                  <CardDescription>Faol versiya yo‘q — iltimos yarating.</CardDescription>
                )}
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Faol maxfiylik (public)</CardTitle>
                {summaryLoading ? (
                  <Skeleton className="h-16" />
                ) : summary?.activePrivacy ? (
                  <CardDescription className="space-y-1 text-foreground">
                    <div className="font-mono text-sm">v{summary.activePrivacy.version}</div>
                    {summary.activePrivacy.publishedAt && (
                      <div className="text-xs text-muted-foreground">
                        Nashr: {new Date(summary.activePrivacy.publishedAt).toLocaleString("uz-UZ")}
                      </div>
                    )}
                  </CardDescription>
                ) : (
                  <CardDescription>Faol versiya yo‘q.</CardDescription>
                )}
              </CardHeader>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Mobil foydalanuvchilar bo‘yicha roziilik</CardTitle>
              <CardDescription>
                Qabul qilingan hujjat versiyalari (mobile_users). Bo‘sh satr = hali jadvaldagi katakcha bo‘yicha
                moslashtirilmagan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-32" />
              ) : summary ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium">Foydalanish shartlari (versiya → soni)</p>
                    <ul className="space-y-1 text-sm">
                      {summary.termsVersionCounts.length === 0 && <li className="text-muted-foreground">—</li>}
                      {summary.termsVersionCounts.map((r, i) => (
                        <li key={`t${i}`} className="flex justify-between font-mono">
                          <span>{r.version ?? "∅"}</span>
                          <span>{r.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Maxfiylik siyosati (versiya → soni)</p>
                    <ul className="space-y-1 text-sm">
                      {summary.privacyVersionCounts.length === 0 && <li className="text-muted-foreground">—</li>}
                      {summary.privacyVersionCounts.map((r, i) => (
                        <li key={`p${i}`} className="flex justify-between font-mono">
                          <span>{r.version ?? "∅"}</span>
                          <span>{r.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-sm text-muted-foreground md:col-span-2">
                    Jami mobil profillar: {summary.mobileUsersTotal}. Hech bo‘lmasa bitta roziilik vaqti:{" "}
                    {summary.mobileWithAnyConsent}.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>TOS — versiyalar</CardTitle>
                <CardDescription>Faol versiya bittasi. Arxivlar tarixi va audit (security/audit) da.</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setDialogKind("TERMS_OF_SERVICE")
                  setFormVersion("1.0.0")
                  setFormTitle("")
                  setFormContent("")
                  setFormPublish(false)
                  setDialogOpen(true)
                }}
              >
                <Plus className="mr-1 size-4" />
                Yangi versiya
              </Button>
            </CardHeader>
            <CardContent>
              {docsLoading ? <Skeleton className="h-40" /> : <DocTableComponent rows={terms} onActivate={activate} onEdit={openEdit} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Maxfiylik siyosati</CardTitle>
                <CardDescription>Bir vaqtda bitta faol versiya.</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setDialogKind("PRIVACY_POLICY")
                  setFormVersion("1.0.0")
                  setFormTitle("")
                  setFormContent("")
                  setFormPublish(false)
                  setDialogOpen(true)
                }}
              >
                <Plus className="mr-1 size-4" />
                Yangi versiya
              </Button>
            </CardHeader>
            <CardContent>
              {docsLoading ? <Skeleton className="h-40" /> : <DocTableComponent rows={privacy} onActivate={activate} onEdit={openEdit} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="size-5" />
                AI ogohlantirish
              </CardTitle>
              <CardDescription>
                Ikkilamchi (primary) — test / AI tushunchasi oldidan; qo‘shimcha (secondary) — yordamchining cheklovlari. Bo‘sh
                qoldirish mumkin, agar app qatlami yashirsin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiLoading ? (
                <Skeleton className="h-48" />
              ) : (
                <>
                  <div>
                    <Label>Asosiy (global)</Label>
                    <Textarea className="mt-1" rows={5} value={aiPrimary} onChange={(e) => setAiPrimary(e.target.value)} />
                  </div>
                  <div>
                    <Label>Qo‘shimcha / muhim cheklovlar (masalan, tibbiy maslahat emas)</Label>
                    <Textarea className="mt-1" rows={4} value={aiSecondary} onChange={(e) => setAiSecondary(e.target.value)} />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">mobile_app_settings</Badge>
                    <span>Uchinchi variant (masalan, favqulodda rejimi) hozircha alohida mobil sozlama sifatida keyingi
                      bosqichga qoldirilishi mumkin; hozir 2 maydon yagona nashr kanali.
                    </span>
                  </div>
                  <Button onClick={saveAi}>
                    <Save className="mr-2 size-4" />
                    Saqlash (qayta tasdiqlash)
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crisis" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="size-5" />
                  Favqulodda va ishonchli yordam
                </CardTitle>
                <CardDescription>
                  Mintaqa: masalan <Badge variant="secondary" className="align-middle">GLOBAL</Badge> yoki
                  <Badge variant="secondary" className="mx-1">UZ</Badge> — mobil region kodiga qarab
                  <code className="mx-1">legal-bundle?region=</code> orqali tanlanadi. Yordam matni: liniya, xavf-soliq, ishonchli
                  inson haqida umumiy yo‘l-yo‘riq.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setCrisisDialog({ label: "", regionCode: "GLOBAL", sortOrder: 0, isActive: true })}>
                <Plus className="mr-1 size-4" />
                Qator
              </Button>
            </CardHeader>
            <CardContent>
              {crisisLoading ? (
                <Skeleton className="h-40" />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mintaqa</TableHead>
                        <TableHead>Holat</TableHead>
                        <TableHead>Sarlavha / raqam</TableHead>
                        <TableHead>Yordam matni</TableHead>
                        <TableHead className="w-[100px] text-right">Amal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crisis.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-muted-foreground">
                            Hech narsa yo‘q. GLOBAL uchun kamida bitta tavsiya etiladi.
                          </TableCell>
                        </TableRow>
                      )}
                      {crisis.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <Globe className="size-3" />
                              {c.regionCode}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {c.isActive ? <Badge>Faol</Badge> : <Badge variant="secondary">Nofaol (yashirilgan)</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{c.label}</div>
                            <div className="font-mono text-sm text-muted-foreground">{c.phoneNumber || "—"}</div>
                          </TableCell>
                          <TableCell className="max-w-md truncate text-sm" title={c.helpText || ""}>
                            {c.helpText || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setCrisisDialog({
                                  id: c.id,
                                  label: c.label,
                                  phoneNumber: c.phoneNumber || "",
                                  helpText: c.helpText || "",
                                  regionCode: c.regionCode,
                                  sortOrder: c.sortOrder,
                                  isActive: c.isActive,
                                })
                              }
                            >
                              Tahrirlash
                            </Button>
                            <Button size="sm" variant="ghost" className="ml-1" onClick={() => void removeCrisis(c.id)}>
                              O‘chir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kutilish muddati (grace period)</CardTitle>
              <CardDescription>
                So‘rov berilgach, rejalashtirilgan sana:{" "}
                {summary && !summaryLoading
                  ? `${summary.deletionGraceDays} kun (tizim sozlamasi)`
                  : "…"}
                . Tugagach, hisob anonimlashtiriladi (backend qoidasi).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="grace">Kun (1–90)</Label>
                <Input
                  id="grace"
                  className="w-32"
                  value={graceDays}
                  onChange={(e) => setGraceDays(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <Button onClick={saveGrace} disabled={graceSaving}>
                {graceSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                Saqlash
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>O‘chirish navbati (mobil foydalanuvchilar)</CardTitle>
              <CardDescription>
                Status, admin izohi va foydalanuvchi orqali bekor qilish — keyingi bosqich: mobil API va
                murojaat tizimiga bog‘lash mumkin. Hozir: faqat navbat ro‘yxati.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deletionLoading ? (
                <Skeleton className="h-32" />
              ) : deletionList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Hozircha PENDING_DELETION foydalanuvchi yo‘q.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Aloqa</TableHead>
                        <TableHead>So‘ralgan</TableHead>
                        <TableHead>Reja (o‘chirish)</TableHead>
                        <TableHead>Holat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletionList.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono text-sm">{u.id}</TableCell>
                          <TableCell className="text-sm">
                            {u.email || "—"}
                            {u.phone && <div className="text-muted-foreground">{u.phone}</div>}
                          </TableCell>
                          <TableCell className="text-sm">
                            {u.deletionRequestedAt
                              ? new Date(u.deletionRequestedAt).toLocaleString("uz-UZ")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {u.scheduledDeletionAt
                              ? new Date(u.scheduledDeletionAt).toLocaleString("uz-UZ")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{u.accountLifecycle}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Huquqiy fonda matn (ko‘rsatma)</CardTitle>
              <CardDescription>
                To‘liq siyosat shartlar/maxfiylik fayllarida. Grace va anonimlashtirish backendda qat’iy: audit loglar va
                murojaat loglari alohida saqlanadi.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogKind === "TERMS_OF_SERVICE" ? "Foydalanish shartlari" : "Maxfiylik"} — yangi versiya
            </DialogTitle>
            <DialogDescription>Versiya turi noyob bo‘lishi kerak (unikal indeks). Nashr: faol versiyani almashtiradi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Versiya</Label>
              <Input className="mt-1" value={formVersion} onChange={(e) => setFormVersion(e.target.value)} />
            </div>
            <div>
              <Label>Sarlavha (ixtiyoriy)</Label>
              <Input className="mt-1" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div>
              <Label>Matn</Label>
              <Textarea
                className="mt-1 max-h-80 font-mono text-sm"
                rows={12}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="pub" checked={formPublish} onCheckedChange={setFormPublish} />
              <Label htmlFor="pub">Nashr qilingach darhol faollashtir</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Bekor
            </Button>
            <Button onClick={submitCreate} disabled={savingDoc}>
              {savingDoc ? <Loader2 className="size-4 animate-spin" /> : "Saqlash (qayta tasdiqlash)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editDoc} onOpenChange={() => setEditDoc(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Qoralama/arxiv hujjatni yangilash</DialogTitle>
            <DialogDescription>Faol hujjatni o‘zgartirmang — avval nashrni o‘rnatgandan keyin yangi nashr yarating.</DialogDescription>
          </DialogHeader>
          {editDoc && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-mono">v{editDoc.version}</p>
              <div>
                <Label>Sarlavha</Label>
                <Input className="mt-1" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div>
                <Label>Matn</Label>
                <Textarea
                  className="mt-1 max-h-80 font-mono text-sm"
                  rows={12}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)}>
              Bekor
            </Button>
            <Button onClick={saveEditDoc}>Saqlash (qayta tasdiqlash)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!crisisDialog} onOpenChange={() => setCrisisDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{crisisDialog?.id ? "Favqulodda resurs" : "Yangi resurs"}</DialogTitle>
            <DialogDescription>Telefon va yordam / eskalatsiya matni foydalanuvchiga ko‘rinadi.</DialogDescription>
          </DialogHeader>
          {crisisDialog && (
            <div className="space-y-2">
              <div>
                <Label>Mintaqa (GLOBAL, UZ, ...)</Label>
                <Input
                  className="mt-1"
                  value={crisisDialog.regionCode || "GLOBAL"}
                  onChange={(e) => setCrisisDialog({ ...crisisDialog, regionCode: e.target.value })}
                />
              </div>
              <div>
                <Label>Label / sarlavha (masalan 102)</Label>
                <Input
                  className="mt-1"
                  value={crisisDialog.label || ""}
                  onChange={(e) => setCrisisDialog({ ...crisisDialog, label: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefon (ixtiyoriy)</Label>
                <Input
                  className="mt-1"
                  value={crisisDialog.phoneNumber || ""}
                  onChange={(e) => setCrisisDialog({ ...crisisDialog, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Yo‘l-yo‘riq, eskalatsiya, ishonchli inson (matn)</Label>
                <Textarea
                  className="mt-1"
                  rows={4}
                  value={crisisDialog.helpText || ""}
                  onChange={(e) => setCrisisDialog({ ...crisisDialog, helpText: e.target.value })}
                />
              </div>
              <div>
                <Label>Sort (tartib raqami)</Label>
                <Input
                  type="number"
                  className="mt-1 w-32"
                  value={crisisDialog.sortOrder ?? 0}
                  onChange={(e) => setCrisisDialog({ ...crisisDialog, sortOrder: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="cactive"
                  checked={crisisDialog.isActive !== false}
                  onCheckedChange={(c) => setCrisisDialog({ ...crisisDialog, isActive: c })}
                />
                <Label htmlFor="cactive">Aktiv (mobilga chiqadi)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCrisisDialog(null)}>
              Bekor
            </Button>
            <Button onClick={saveCrisis}>Saqlash (qayta tasdiqlash)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DocTableComponent({
  rows,
  onActivate,
  onEdit,
}: {
  rows: LegalDocRow[]
  onActivate: (id: number) => void
  onEdit: (row: LegalDocRow) => void
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Versiya</TableHead>
            <TableHead>Holat</TableHead>
            <TableHead>Versiya turi</TableHead>
            <TableHead className="text-right min-w-[180px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Hozircha nashr yo‘q.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm">{r.version}</TableCell>
                <TableCell>
                  {r.isActive ? <Badge>Faol nashr</Badge> : <Badge variant="secondary">Arxiv / qoralama</Badge>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.title || "—"}
                  {r.createdById != null && (
                    <span className="ml-1 text-xs"> (muallif id: {r.createdById})</span>
                  )}
                </TableCell>
                <TableCell className="text-right space-y-1">
                  {r.isActive ? (
                    <span className="text-xs text-muted-foreground">Hozirgi nashr — o‘zgaritish: yangi versiya yarating</span>
                  ) : (
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                      <Button type="button" size="sm" onClick={() => onActivate(r.id)} className="w-full sm:w-auto">
                        Nashr (faol) qilish
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(r)}
                        className="w-full sm:w-auto"
                      >
                        Qoralamani yangilash
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
