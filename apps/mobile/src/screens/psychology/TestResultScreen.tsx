import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppPalette } from '../../constants/colors';
import { useAppPalette } from '../../theme/useAppPalette';
import { parseStoredInterpretation } from '../../lib/parseTestInterpretation';

export type TestResultRouteParams = {
  result: {
    id: number;
    score: number | null;
    maxScore: number | null;
    interpretation: string | null;
    test?: { title: string; description?: string | null };
  };
};

function SectionCard({
  icon,
  title,
  children,
  accent,
  C,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  children: React.ReactNode;
  accent: string;
  C: AppPalette;
}) {
  return (
    <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.sectionHead}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={accent} />
        </View>
        <Text style={[styles.sectionTitle, { color: C.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function TestResultScreen({ route, navigation }: any) {
  const C = useAppPalette();
  const { result } = (route.params || {}) as TestResultRouteParams;
  const title = result?.test?.title || 'Test natijasi';
  const score = result?.score ?? 0;
  const max = result?.maxScore ?? 0;
  const pctFallback = max > 0 ? Math.round((score / max) * 100) : 0;

  const parsed = useMemo(() => parseStoredInterpretation(result?.interpretation), [result?.interpretation]);

  const pct = parsed.kind === 'v2' ? parsed.data.scorePercent : pctFallback;
  const pctWidth = Math.min(100, Math.max(0, pct));

  const bodyText =
    parsed.kind === 'plain'
      ? parsed.text
      : parsed.kind === 'empty'
        ? 'Xulosa tayyorlanmadi. Keyinroq qayta urinib ko‘ring yoki qo‘llab-quvvatlashga yozing.'
        : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.background }]} contentContainerStyle={styles.inner}>
      <View style={[styles.hero, { backgroundColor: C.primaryLight, borderColor: C.border }]}>
        <View style={[styles.heroBadge, { backgroundColor: C.primary + '18' }]}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={26} color={C.primary} />
          <Text style={[styles.heroBadgeText, { color: C.primary }]}>Natija tayyor</Text>
        </View>
        <Text style={[styles.heroTitle, { color: C.text }]}>
          {parsed.kind === 'v2' ? parsed.data.headline : title}
        </Text>
        {parsed.kind !== 'v2' ? <Text style={[styles.heroSub, { color: C.textSecondary }]}>{title}</Text> : null}

        <View style={[styles.ringOuter, { borderColor: C.border }]}>
          <View style={[styles.progressTrack, { backgroundColor: C.border }]}>
            <View style={[styles.progressFill, { width: `${pctWidth}%`, backgroundColor: C.primary }]} />
          </View>
          <Text style={[styles.pctHuge, { color: C.primary }]}>{pct}%</Text>
          <Text style={[styles.ballLine, { color: C.textSecondary }]}>
            {score} / {max} ball
          </Text>
        </View>
      </View>

      {parsed.kind === 'v2' ? (
        <>
          <SectionCard icon="text-box-outline" title="Umumiy tahlil" accent={C.primary} C={C}>
            <Text style={[styles.paragraph, { color: C.textSecondary }]}>{parsed.data.summary}</Text>
          </SectionCard>

          {parsed.data.strengths.length > 0 ? (
            <SectionCard icon="thumb-up-outline" title="Kuchli tomonlar" accent="#16a34a" C={C}>
              {parsed.data.strengths.map((line, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: '#16a34a' }]}>•</Text>
                  <Text style={[styles.bulletText, { color: C.text }]}>{line}</Text>
                </View>
              ))}
            </SectionCard>
          ) : null}

          {parsed.data.attention.length > 0 ? (
            <SectionCard icon="alert-circle-outline" title="Diqqat" accent="#d97706" C={C}>
              {parsed.data.attention.map((line, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: '#d97706' }]}>•</Text>
                  <Text style={[styles.bulletText, { color: C.text }]}>{line}</Text>
                </View>
              ))}
            </SectionCard>
          ) : null}

          {parsed.data.selfCare.length > 0 ? (
            <SectionCard icon="heart-pulse" title="Amaliy tavsiyalar" accent="#2563eb" C={C}>
              {parsed.data.selfCare.map((line, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: '#2563eb' }]}>•</Text>
                  <Text style={[styles.bulletText, { color: C.text }]}>{line}</Text>
                </View>
              ))}
            </SectionCard>
          ) : null}

          {parsed.data.closing ? (
            <View style={[styles.noteBox, { backgroundColor: C.surface, borderColor: C.border }]}>
              <MaterialCommunityIcons name="information-outline" size={20} color={C.textMuted} />
              <Text style={[styles.noteText, { color: C.textMuted }]}>{parsed.data.closing}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.sectionHead}>
            <View style={[styles.iconWrap, { backgroundColor: C.primary + '22' }]}>
              <MaterialCommunityIcons name="robot-outline" size={22} color={C.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Tahlil</Text>
          </View>
          <Text style={[styles.paragraph, { color: C.textSecondary }]}>{bodyText}</Text>
        </View>
      )}

      <Text style={[styles.disclaimer, { color: C.textMuted }]}>
        Natija umumiy yo‘nalishni ko‘rsatadi; tibbiy diagnoz emas. Zarurat bo‘lsa — malakali mutaxassisga murojaat qiling.
      </Text>

      <TouchableOpacity style={[styles.btn, { backgroundColor: C.primary }]} onPress={() => navigation.navigate('Main' as never)}>
        <Text style={styles.btnText}>Asosiy sahifaga</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 16, paddingBottom: 48 },
  hero: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  heroBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
  },
  heroBadgeText: { fontWeight: '800', fontSize: 13 },
  heroTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', lineHeight: 28 },
  heroSub: { fontSize: 14, textAlign: 'center', marginTop: 6 },
  ringOuter: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: { height: '100%', borderRadius: 8 },
  pctHuge: { fontSize: 36, fontWeight: '900' },
  ballLine: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', flex: 1 },
  paragraph: { fontSize: 15, lineHeight: 24 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  bullet: { fontSize: 16, lineHeight: 24, fontWeight: '900' },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 22 },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 20 },
  disclaimer: { fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 12 },
  btn: { padding: 16, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
