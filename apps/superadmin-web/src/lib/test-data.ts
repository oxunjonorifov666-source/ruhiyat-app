import { CreateTestDto } from "./test-types"

export const TEST_TEMPLATES: CreateTestDto[] = [
  {
    title: "PHQ-9 (Depressiya testi)",
    description: "Oxirgi 2 hafta davomida sizni quyidagi muammolar qanchalik bezovta qildi?",
    category: "Ruhiy salomatlik",
    questions: [
      {
        text: "Biror ishni qilishga qiziqish yoki zavqning kamligi",
        answers: [
          { text: "Hech qachon", score: 0 },
          { text: "Bir necha kun", score: 1 },
          { text: "Yarim vaqtdan ko'p", score: 2 },
          { text: "Deyarli har kuni", score: 3 },
        ]
      },
      {
        text: "Tushkunlik, depressiya yoki umidsizlik",
        answers: [
          { text: "Hech qachon", score: 0 },
          { text: "Bir necha kun", score: 1 },
          { text: "Yarim vaqtdan ko'p", score: 2 },
          { text: "Deyarli har kuni", score: 3 },
        ]
      },
    ]
  },
  {
    title: "GAD-7 (Xavotir testi)",
    description: "Oxirgi 2 hafta davomida sizni quyidagi holatlar qanchalik tez-tez bezovta qildi?",
    category: "Xavotir",
    questions: [
      {
        text: "Xavotir, asabiylashish yoki haddan tashqari taranglik",
        answers: [
          { text: "Hech qachon", score: 0 },
          { text: "Bir necha kun", score: 1 },
          { text: "Yarim vaqtdan ko'p", score: 2 },
          { text: "Deyarli har kuni", score: 3 },
        ]
      },
      {
        text: "Xavotirni to'xtata olmaslik yoki nazorat qila olmaslik",
        answers: [
          { text: "Hech qachon", score: 0 },
          { text: "Bir necha kun", score: 1 },
          { text: "Yarim vaqtdan ko'p", score: 2 },
          { text: "Deyarli har kuni", score: 3 },
        ]
      }
    ]
  }
]
