import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import type { DailyInsightPayload } from '../../services/profileMobile';
import type { AppPalette } from '../../constants/colors';

type Props = {
  data: DailyInsightPayload | null;
  loading: boolean;
  C: AppPalette;
};

export function DailyAiInsightCard({ data, loading, C }: Props) {
  if (loading && !data) {
    return (
      <View style={[styles.card, styles.skeleton, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.skLine, { backgroundColor: C.border }]} />
        <View style={[styles.skLine, { backgroundColor: C.border, width: '92%' }]} />
        <View style={[styles.skLine, { backgroundColor: C.border, width: '70%' }]} />
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#6d28d9', '#5b21b6', '#4c1d95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            borderColor: 'rgba(255,255,255,0.2)',
            shadowColor: '#5b21b6',
          },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Sparkles size={22} color="#fff" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Kunlik AI tavsiyasi</Text>
            <Text style={styles.title}>{data.title}</Text>
          </View>
        </View>
        <Text style={styles.body}>{data.body}</Text>
        <View style={styles.quote}>
          <Text style={styles.motiv}>{data.motivational}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, marginBottom: 14 },
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginBottom: 4 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 24 },
  body: { color: 'rgba(255,255,255,0.95)', fontSize: 15, lineHeight: 22, fontWeight: '500' },
  quote: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  motiv: { color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  skeleton: { gap: 10, minHeight: 120 },
  skLine: { height: 14, borderRadius: 8, width: '60%' },
});
