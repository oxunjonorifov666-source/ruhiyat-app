/** Mirrors `GET /public/legal-bundle` (Nest `LegalService.getPublicLegalBundle`). */
export type PublicLegalDocument = {
  version: string;
  title: string | null;
  content: string;
  publishedAt: string | null;
};

export type PublicLegalBundle = {
  regionCode: string;
  terms: PublicLegalDocument | null;
  privacy: PublicLegalDocument | null;
  aiDisclaimer: { primary: string; secondary: string };
  crisis: {
    items: Array<{
      id: number;
      label: string;
      phoneNumber: string | null;
      helpText: string | null;
      regionCode: string;
    }>;
  };
  accountDeletionGraceDays: number;
};
