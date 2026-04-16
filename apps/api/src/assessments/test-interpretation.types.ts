/** `test_results.interpretation` maydonida JSON sifatida saqlanadi (`v: 2`). */
export type TestInterpretationV2 = {
  v: 2;
  /** Qisqa sarlavha (masalan: test nomi + foiz) */
  headline: string;
  /** 2–4 jumla: umumiy mazmun */
  summary: string;
  /** Kuchli tomonlar / ijobiy nuqtalar */
  strengths: string[];
  /** Diqqat qilish kerak bo‘lgan jihatlar */
  attention: string[];
  /** Amaliy qadam-qadam yoki o‘z-o‘ziga yordam */
  selfCare: string[];
  /** Yopuvchi eslatma (diagnoz emasligi haqida) */
  closing: string;
  scorePercent: number;
};
