/** Dizayn tokenlari — barcha yangi ekranlar shu yerdan foydalanadi */
export const spacing = (n: number) => n * 8;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  hero: { fontSize: 28, fontWeight: '800' as const },
  title: { fontSize: 22, fontWeight: '800' as const },
  subtitle: { fontSize: 15, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
};
