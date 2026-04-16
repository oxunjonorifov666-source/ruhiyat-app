import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppPalette } from '../../theme/useAppPalette';

type Line = { title: string; subtitle?: string; phones: string[]; tag?: string };

/** Umumiy namuna — aniq raqamlarni operator / huquqiy maslahat bilan yangilang. */
const LINES: Line[] = [
  {
    title: 'Favqulodda yordam (Tez yordam)',
    subtitle: 'Jismoniy xavf, tibbiy favqulodda',
    phones: ['103'],
    tag: 'Tibbiyot',
  },
  {
    title: 'Ichki ish organlari',
    subtitle: 'Xavfsizlik, zo‘ravilik haqida xabar',
    phones: ['102'],
    tag: 'Xavfsizlik',
  },
  {
    title: 'Yong‘in xavfsizligi',
    phones: ['101'],
  },
  {
    title: 'Ishonch telefoni (namuna)',
    subtitle: 'Psixologik qo‘llab-quvvatlash liniyalari — mahalliy raqamlarni kiriting',
    phones: ['+998 71 200-00-00'],
    tag: 'Psixologiya',
  },
];

export function CrisisResourcesScreen() {
  const C = useAppPalette();

  const dial = (raw: string) => {
    const n = raw.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${n}`).catch(() => {});
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.background }]} contentContainerStyle={styles.inner}>
      <Text style={[styles.lead, { color: C.textSecondary }]}>
        Agar hayotingizga zid bo‘lsa yoki darhol xavf bo‘lsa — quyidagi raqamlardan foydalaning. SOS tugmasi ilova orqali ham
        signal yuboradi.
      </Text>

      {LINES.map((line, i) => (
        <View key={i} style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.cardHead}>
            <MaterialCommunityIcons name="phone-in-talk" size={22} color={C.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.cardTitle, { color: C.text }]}>{line.title}</Text>
              {line.subtitle ? <Text style={[styles.sub, { color: C.textMuted }]}>{line.subtitle}</Text> : null}
            </View>
            {line.tag ? (
              <View style={[styles.tag, { backgroundColor: C.primaryLight }]}>
                <Text style={[styles.tagText, { color: C.primary }]}>{line.tag}</Text>
              </View>
            ) : null}
          </View>
          {line.phones.map((p) => (
            <TouchableOpacity key={p} style={[styles.phoneBtn, { borderColor: C.border }]} onPress={() => dial(p)} activeOpacity={0.85}>
              <Text style={[styles.phoneText, { color: C.primary }]}>{p}</Text>
              <MaterialCommunityIcons name="phone-dial" size={20} color={C.primary} />
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <Text style={[styles.foot, { color: C.textMuted }]}>
        Shaxsiy tibbiy maslahat uchun — faqat malakali mutaxassisga murojaat qiling. Bu ro‘yxat umumiy ma’lumot uchun.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 16, paddingBottom: 40 },
  lead: { fontSize: 14, lineHeight: 21, marginBottom: 18 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '800' },
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  phoneText: { fontSize: 17, fontWeight: '800' },
  foot: { fontSize: 12, lineHeight: 18, marginTop: 8 },
});
