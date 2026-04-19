"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Scale,
  Loader2,
  Plus,
  Sparkles,
  Phone,
  Globe,
  Save,
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
import {
  classifyApiError,
  formatEmbeddedApiError,
  isUserCancelledStepUp,
} from "@/lib/api-error"
import { useStepUp } from "@/components/step-up/step-up-provider"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"
import { SuperadminRouteGate } from "@/components/superadmin-route-gate"
import { Skeleton } from "@/components/ui/skeleton"

type LegalDocRow = {
  id: number
  kind: string
  version: string
  title: string | null
  isActive: boolean
  publishedAt: string | null
  createdAt: string
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

function LegalComplianceContent() {
  const { runWithStepUp } = useStepUp()
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [terms, setTerms] = useState<LegalDocRow[]>([])
  const [privacy, setPrivacy] = useState<LegalDocRow[]>([])
  const [docsLoading, setDocsLoading] = useState(true)

  const [aiPrimary, setAiPrimary] = useState("")
  const [aiSecondary, setAiSecondary] = useState("")
  const [aiLoading, setAiLoading] = useState(true)

  const [crisis, setCrisis] = useState<CrisisRow[]>([])
  const [crisisLoading, setCrisisLoading] = useState(true)

  const [graceDays, setGraceDays] = useState("14")
  const [graceSaving, setGraceSaving] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogKind, setDialogKind] = useState<"TERMS_OF_SERVICE" | "PRIVACY_POLICY">(
    "TERMS_OF_SERVICE",
  )
  const [formVersion, setFormVersion] = useState("1.0.0")
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formPublish, setFormPublish] = useState(false)
  const [savingDoc, setSavingDoc] = useState(false)

  const loadDocs = useCallback(async () => {
    setDocsLoading(true)
    setDenied(false)
    setError(null)
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

  const loadAi = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await apiClient<{ primary: string; secondary: string }>("/legal/ai-safety")
      setAiPrimary(res.primary ?? "")
      setAiSecondary(res.secondary ?? "")
    } catch (e: unknown) {
      const { permissionDenied } = classifyApiError(e)
      if (permissionDenied) setDenied(true)
      else setError(formatEmbeddedApiError(e))
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
      else setError(formatEmbeddedApiError(e))
    } finally {
      setCrisisLoading(false)
    }
  }, [])

  const loadGrace = useCallback(async () => {
    try {
      const res = await apiClient<{ data: { key: string; value: string | null }[] }>("/settings")
      const row = res.data?.find((r) => r.key === "account.deletion_grace_days")
      if (row?.value) setGraceDays(String(parseInt(row.value, 10) || 14))
    } catch {
      /* optional */
    }
  }, [])

  useEffect(() => {
    loadDocs()
    loadAi()
    loadCrisis()
    loadGrace()
  }, [loadDocs, loadAi, loadCrisis, loadGrace])

  const openCreate = (kind: "TERMS_OF_SERVICE" | "PRIVACY_POLICY") => {
    setDialogKind(kind)
    setFormVersion("1.0.0")
    setFormTitle("")
    setFormContent("")
    setFormPublish(false)
    setDialogOpen(true)
  }

  const submitCreate = async () => {
    if (!formVersion.trim() || !formContent.trim()) {
      toast.error("Versiya va matn majburiy")
      return
    }
    setSavingDoc(true)
    try {
      await runWithStepUp(
        async () => {
          await apiClient("/legal/documents", {
            method: "POST",
            body: {
              kind: dialogKind,
              version: formVersion.trim(),
              title: formTitle.trim() || undefined,
              content: formContent,
              publish: formPublish,
            },
          })
        },
        { title: "Hujjatni saqlash", description: "Huquqiy hujjatni yaratish uchun parolingizni tasdiqlang." },
      )
      toast.success("Hujjat saqlandi")
      setDialogOpen(false)
      await loadDocs()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    } finally {
      setSavingDoc(false)
    }
  }

  const activate = async (id: number) => {
    try {
      await runWithStepUp(
        () => apiClient(`/legal/documents/${id}/activate`, { method: "POST" }),
        { title: "Faollashtirish", description: "Faol shartlar/maxfiylik versiyasini almashtirish — parolni tasdiqlang." },
      )
      toast.success("Faol versiya yangilandi")
      await loadDocs()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    }
  }

  const saveAi = async () => {
    try {
      await runWithStepUp(
        () =>
          apiClient("/legal/ai-safety", {
            method: "PATCH",
            body: { primary: aiPrimary, secondary: aiSecondary },
          }),
        { title: "AI matnlar", description: "AI ogohlantirish matnlarini o‘zgartirish uchun parolni tasdiqlang." },
      )
      toast.success("AI matnlari saqlandi")
      await loadAi()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    }
  }

  const saveGrace = async () => {
    const n = Math.min(90, Math.max(1, parseInt(graceDays, 10) || 14))
    setGraceSaving(true)
    try {
      await runWithStepUp(
        async () => {
          await apiClient(`/settings/${encodeURIComponent("account.deletion_grace_days")}`, {
            method: "PATCH",
            body: { value: String(n), category: "legal" },
          })
        },
        {
          title: "Sozlamani saqlash",
          description:
            "Hisobni o‘chirish kutilish muddatini o‘zgartirish tizim sozlamasidir. Parolingizni tasdiqlang.",
        },
      )
      setGraceDays(String(n))
      toast.success("Kutilish muddati yangilandi")
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    } finally {
      setGraceSaving(false)
    }
  }

  const addCrisis = async () => {
    const label = window.prompt("Yorliq (masalan: 102)")
    if (!label?.trim()) return
    const phone = window.prompt("Telefon raqam (ixtiyoriy)") || undefined
    const region = window.prompt("Mintaqa kodi (GLOBAL yoki UZ)", "GLOBAL") || "GLOBAL"
    try {
      await runWithStepUp(
        () =>
          apiClient("/legal/crisis-resources", {
            method: "POST",
            body: { label: label.trim(), phoneNumber: phone, regionCode: region.trim().toUpperCase() },
          }),
        { title: "Favqulodda resurs", description: "Yangi resurs qo‘shish uchun parolni tasdiqlang." },
      )
      toast.success("Qo'shildi")
      await loadCrisis()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    }
  }

  const removeCrisis = async (id: number) => {
    if (!window.confirm("O‘chirilsinmi?")) return
    try {
      await runWithStepUp(
        () => apiClient(`/legal/crisis-resources/${id}`, { method: "DELETE" }),
        { title: "O‘chirish", description: "Favqulodda resursni olib tashlash uchun parolni tasdiqlang." },
      )
      toast.success("O‘chirildi")
      await loadCrisis()
    } catch (e: unknown) {
      if (isUserCancelledStepUp(e)) return
      toast.error(formatEmbeddedApiError(e))
    }
  }

  const DocTable = ({ rows, kindLabel }: { rows: LegalDocRow[]; kindLabel: string }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Versiya</TableHead>
            <TableHead>Sarlavha</TableHead>
            <TableHead>Holat</TableHead>
            <TableHead className="text-right">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Hozircha yozuv yo‘q — yangi versiya yarating.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm">{r.version}</TableCell>
                <TableCell>{r.title || "—"}</TableCell>
                <TableCell>
                  {r.isActive ? (
                    <Badge>Faol</Badge>
                  ) : (
                    <Badge variant="secondary">Arxiv</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!r.isActive && (
                    <Button size="sm" variant="outline" onClick={() => activate(r.id)}>
                      Faollashtirish
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <p className="border-t px-3 py-2 text-xs text-muted-foreground">{kindLabel}</p>
    </div>
  )

  if (denied) {
    return (
      <div className="space-y-6">
        <PageHeader title="Huquqiy va maxfiylik" subtitle="CMS" icon={Scale} />
        <AccessDeniedPlaceholder
          title="Ruxsat yo‘q"
          description="Bu bo‘lim faqat superadmin uchun (system.settings)."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Huquqiy va maxfiylik"
        subtitle="Shartlar, maxfiylik, AI ogohlantirish, favqulodda resurslar"
        icon={Scale}
      />

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="terms" className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="terms">Foydalanish shartlari</TabsTrigger>
          <TabsTrigger value="privacy">Maxfiylik</TabsTrigger>
          <TabsTrigger value="ai">AI xavfsizlik</TabsTrigger>
          <TabsTrigger value="crisis">Favqulodda</TabsTrigger>
          <TabsTrigger value="account">Hisob o‘chirish</TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Foydalanish shartlari</CardTitle>
                <CardDescription>Versiyalangan matn — faol versiya mobil va audit uchun.</CardDescription>
              </div>
              <Button size="sm" onClick={() => openCreate("TERMS_OF_SERVICE")}>
                <Plus className="mr-1 size-4" />
                Yangi versiya
              </Button>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <DocTable rows={terms} kindLabel="Mobil: GET /api/public/legal-bundle va /mobile/app-metadata orqali faol versiya uzatiladi." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Maxfiylik siyosati</CardTitle>
                <CardDescription>CMS — bir vaqtning o‘zida bitta faol versiya.</CardDescription>
              </div>
              <Button size="sm" onClick={() => openCreate("PRIVACY_POLICY")}>
                <Plus className="mr-1 size-4" />
                Yangi versiya
              </Button>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <DocTable rows={privacy} kindLabel="Foydalanuvchi roziligi mobile_users jadvalida saqlanadi." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5" />
                AI ogohlantirish matnlari
              </CardTitle>
              <CardDescription>
                Mobil ilova AI funksiyalaridan oldin ko‘rsatiladi (tibbiy maslahat emasligi va h.k.).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Asosiy matn</Label>
                    <Textarea
                      rows={5}
                      value={aiPrimary}
                      onChange={(e) => setAiPrimary(e.target.value)}
                      placeholder="Qisqa ogohlantirish..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Qo‘shimcha / cheklovlar</Label>
                    <Textarea
                      rows={4}
                      value={aiSecondary}
                      onChange={(e) => setAiSecondary(e.target.value)}
                    />
                  </div>
                  <Button onClick={saveAi} disabled={aiLoading}>
                    <Save className="mr-2 size-4" />
                    Saqlash
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crisis" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="size-5" />
                  Favqulodda resurslar
                </CardTitle>
                <CardDescription>
                  Mintaqa bo‘yicha (masalan UZ) yoki GLOBAL — mobil GET /api/public/legal-bundle?region=UZ
                </CardDescription>
              </div>
              <Button size="sm" variant="secondary" onClick={addCrisis}>
                <Plus className="mr-1 size-4" />
                Qator qo‘shish
              </Button>
            </CardHeader>
            <CardContent>
              {crisisLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mintaqa</TableHead>
                        <TableHead>Yorliq</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead className="text-right">Amal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crisis.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <Globe className="size-3" />
                              {c.regionCode}
                            </Badge>
                          </TableCell>
                          <TableCell>{c.label}</TableCell>
                          <TableCell className="font-mono text-sm">{c.phoneNumber || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => removeCrisis(c.id)}>
                              O‘chirish
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

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hisobni o‘chirish — kutilish muddati</CardTitle>
              <CardDescription>
                Mobil foydalanuvchi o‘chirish so‘ragach, shu kunlar tugaguncha kirish mumkin; tugagach hisob
                anonimlashtiriladi.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label>Kunlar (1–90)</Label>
                <Input
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
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Yangi {dialogKind === "TERMS_OF_SERVICE" ? "foydalanish shartlari" : "maxfiylik"} versiyasi
            </DialogTitle>
            <DialogDescription>Versiya raqami noyob bo‘lishi kerak (masalan 1.0.1).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Versiya</Label>
              <Input value={formVersion} onChange={(e) => setFormVersion(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sarlavha (ixtiyoriy)</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To‘liq matn</Label>
              <Textarea
                rows={12}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formPublish} onCheckedChange={setFormPublish} id="pub" />
              <Label htmlFor="pub">Darhol faollashtirish</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={submitCreate} disabled={savingDoc}>
              {savingDoc ? <Loader2 className="size-4 animate-spin" /> : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LegalCompliancePage() {
  return (
    <SuperadminRouteGate title="Huquqiy va maxfiylik">
      <LegalComplianceContent />
    </SuperadminRouteGate>
  )
}
