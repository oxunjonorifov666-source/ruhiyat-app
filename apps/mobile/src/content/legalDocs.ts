/** Superadmin URL bo‘lmasa — ilova ichidagi matn */

export type LegalDocId = 'privacy' | 'terms' | 'help';

export const LEGAL_DOCS: Record<LegalDocId, { title: string; body: string }> = {
  privacy: {
    title: 'Maxfiylik siyosati',
    body: `Ruhiyat mobil ilovasi shaxsiy ma'lumotlaringizni himoya qilishga intiladi.

• Profil, seans va tibbiy kontent ma'lumotlari xavfsiz serverda saqlanadi.
• Anonim statistika ixtiyoriy — sozlamalardan o‘chirib qo‘yishingiz mumkin.
• SOS signallar faqat siz tasdiqlagan holda mas’ullarga yetkaziladi.

To‘liq va yangilangan matn uchun administrator URL ni Superadmin → mobil sozlamalar orqali biriktirishi mumkin.`,
  },
  terms: {
    title: 'Foydalanish shartlari',
    body: `Ruhiyat platformasidan foydalanish psixologik qo‘llab-quvvatlash va ta’lim maqsadlariga mo‘ljallangan.

• Tizim tavsiyalari tibbiy diagnoz o‘rnini bosmaydi — zarurat bo‘lsa shifokor yoki yuzma-yuz mutaxassisga murojaat qiling.
• Hisobingiz xavfsizligi uchun parolni boshqalar bilan ulashmang.

Batafsil shartlar veb-sayt orqali ham joylashtirilishi mumkin.`,
  },
  help: {
    title: 'Yordam markazi',
    body: `Biz bilan bog‘lanish

Savollar va texnik yordam:
• Email: okhunjonorifov555@gmail.com
• Telefon / messendjer: +998 88 891 53 52

Ilova ichidagi Chat
Asosiy menyudan «Chat va xabarlar» bo‘limiga o‘ting — operator yoki mutaxassis mavjud bo‘lganda javob beradi. Suhbat tarixingiz xavfsiz ulanish orqali saqlanadi.

Texnik muammo
Ilovani to‘liq yoping va qayta oching; kerak bo‘lsa tizimdan chiqib, qayta kiring. Muammo davom etsa, yuqoridagi email yoki telefon orqali yozing — ilova versiyasi va qurilma modelini qisqacha yozib qoldiring.

Eslatma: psixologik testlar va AI tavsiyalari umumiy xarakterda; tibbiy diagnoz o‘rnini bosmaydi.`,
  },
};
