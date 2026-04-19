import Link from 'next/link'
import { SUPERADMIN_BASE } from '@/lib/superadmin-base'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Ruxsat yo‘q</h1>
      <p className="max-w-md text-muted-foreground">
        Ushbu bo‘limga kirish uchun hisobingizda kerakli ruxsatlar yo‘q. Agar bu xato bo‘lsa, tizim administratoriga
        murojaat qiling.
      </p>
      <Link href={`${SUPERADMIN_BASE}/dashboard`} className="text-primary underline">
        Bosh sahifaga qaytish
      </Link>
    </div>
  )
}
