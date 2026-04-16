import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useQuery } from '@tanstack/react-query';
import { ScreenStates } from '../../components/ScreenStates';
import { wellnessService } from '../../services/wellness';
import { useAppPalette } from '../../theme/useAppPalette';

function trendLabel(t: 'up' | 'down' | 'stable'): string {
  if (t === 'up') return 'Yaxshilanish';
  if (t === 'down') return 'Pasayish';
  return 'Barqaror';
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function MoodWeeklyScreen() {
  const C = useAppPalette();
  const [pdfBusy, setPdfBusy] = useState(false);
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['mood-weekly'],
    queryFn: () => wellnessService.getMoodWeeklySummary(),
    staleTime: 60 * 1000,
  });

  const week = data?.days;

  const dynamicStyles = useMemo(
    () => ({
      container: { backgroundColor: C.background },
      title: { color: C.text },
      sub: { color: C.textMuted },
      barTrack: { backgroundColor: C.border },
      bar: { backgroundColor: C.primary },
      day: { color: C.textMuted },
      card: { backgroundColor: C.surface, borderColor: C.border },
      cardTitle: { color: C.text },
      body: { color: C.textSecondary },
      badge: { backgroundColor: C.primaryLight, borderColor: C.border },
      badgeText: { color: C.primary },
      stat: { color: C.textSecondary },
      statVal: { color: C.text },
    }),
    [C],
  );

  if (isLoading) {
    return <ScreenStates loading />;
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : 'Kayfiyat ma’lumotlari yuklanmadi';
    return <ScreenStates error={msg} onRetry={() => refetch()} />;
  }

  const max = 5;

  const exportPdf = useCallback(async () => {
    if (!data) return;
    setPdfBusy(true);
    try {
      const rows = (data.days || [])
        .map(
          (d) =>
            `<tr><td>${escHtml(d.label)}</td><td>${escHtml(String(d.value))}</td><td>${d.count}</td></tr>`,
        )
        .join('');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
        body{font-family:system-ui,sans-serif;padding:16px;color:#111}
        table{border-collapse:collapse;width:100%;margin-top:12px}
        td,th{border:1px solid #ccc;padding:8px;font-size:14px}
        h1{font-size:20px}
      </style></head><body>
        <h1>Haftalik kayfiyat</h1>
        <p>O‘rtacha: ${data.weekAverage != null ? data.weekAverage.toFixed(1) : '—'}/5 · Trend: ${escHtml(trendLabel(data.trend ?? 'stable'))}</p>
        <table><thead><tr><th>Kun</th><th>Qiymat</th><th>Yozuvlar</th></tr></thead><tbody>${rows}</tbody></table>
        <p style="margin-top:16px;white-space:pre-wrap">${escHtml(data.aiSummary || '')}</p>
      </body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('PDF tayyor', 'Ulashish bu qurilmada cheklangan.');
      }
    } catch (e) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'PDF yaratilmadi');
    } finally {
      setPdfBusy(false);
    }
  }, [data]);

  return (
    <ScreenStates>
      <ScrollView
        style={[styles.container, dynamicStyles.container]}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={C.primary} />
        }
      >
        <Text style={[styles.title, dynamicStyles.title]}>Haftalik kayfiyat</Text>
        <Text style={[styles.sub, dynamicStyles.sub]}>
          Oxirgi 7 kun — bazadagi yozuvlar (UTC kunlari mobil bilan mos)
        </Text>

        <TouchableOpacity
          style={[styles.pdfBtn, { backgroundColor: C.primary, opacity: pdfBusy ? 0.7 : 1 }]}
          onPress={exportPdf}
          disabled={pdfBusy || !data}
          activeOpacity={0.88}
        >
          {pdfBusy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.pdfBtnText}>PDF eksport (ulashish)</Text>
          )}
        </TouchableOpacity>

        {week && week.length > 0 ? (
          <View style={styles.chartRow}>
            {week.map((d) => (
              <View key={d.date} style={styles.col}>
                <View style={[styles.barTrack, dynamicStyles.barTrack]}>
                  <View
                    style={[
                      styles.bar,
                      dynamicStyles.bar,
                      { height: d.value ? Math.max(4, (d.value / max) * 160) : 2 },
                    ]}
                  />
                </View>
                <Text style={[styles.day, dynamicStyles.day]}>{d.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.statsRow, { borderColor: C.border }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, dynamicStyles.stat]}>Hafta o‘rtachasi</Text>
            <Text style={[styles.statBig, dynamicStyles.statVal]}>
              {data?.weekAverage != null ? data.weekAverage.toFixed(1) : '—'}
              <Text style={styles.outOf}>/5</Text>
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, dynamicStyles.stat]}>Trend</Text>
            <Text style={[styles.statBig, dynamicStyles.statVal]}>{trendLabel(data?.trend ?? 'stable')}</Text>
          </View>
        </View>

        <View style={[styles.aiCard, dynamicStyles.card]}>
          <View style={styles.aiHeader}>
            <Text style={[styles.aiTitle, dynamicStyles.cardTitle]}>AI xulosa</Text>
            <View style={[styles.badge, dynamicStyles.badge]}>
              <Text style={[styles.badgeText, dynamicStyles.badgeText]}>
                {data?.aiSource === 'openai' ? 'OpenAI' : 'Avtomatik'}
              </Text>
            </View>
          </View>
          <Text style={[styles.aiBody, dynamicStyles.body]}>{data?.aiSummary}</Text>
          {data?.aiSource === 'heuristic' ? (
            <Text style={[styles.aiHint, dynamicStyles.sub]}>
              OpenAI kaliti (`OPENAI_API_KEY` yoki superadmin AI kaliti) bo‘lsa, xulosa boyroqroq bo‘ladi.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </ScreenStates>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 6, marginBottom: 12 },
  pdfBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  pdfBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: 4,
  },
  col: { flex: 1, alignItems: 'center' },
  barTrack: {
    width: 28,
    height: 160,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: 8 },
  day: { marginTop: 8, fontSize: 11, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 16,
  },
  statCol: { flex: 1 },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statBig: { fontSize: 20, fontWeight: '800' },
  outOf: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
  aiCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  aiTitle: { fontSize: 17, fontWeight: '800' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  aiBody: { fontSize: 15, lineHeight: 22 },
  aiHint: { fontSize: 12, marginTop: 10, lineHeight: 18 },
});
