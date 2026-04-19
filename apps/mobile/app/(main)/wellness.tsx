import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {
  fetchBreathingScenarios,
  fetchDiaryEntries,
  fetchHabits,
  fetchMoodWeeklySummary,
  fetchSavedItems,
  fetchSleepRecords,
  postMoodEntry,
} from '~/lib/dailyHubApi';
import { getApiErrorMessage } from '~/lib/errors';
import { htmlToPlainText } from '~/lib/htmlToPlainText';
import type {
  BreathingScenario,
  DiaryEntryRow,
  HabitRow,
  MoodWeeklyResponse,
  SavedItemRow,
  SleepRecordRow,
} from '~/types/dailyHub';

const MOOD_LABELS: Record<number, string> = {
  1: 'Juda yomon',
  2: 'Yomon',
  3: 'O‘rtacha',
  4: 'Yaxshi',
  5: 'Ajoyib',
};

function savedLabel(row: SavedItemRow): string {
  const t = row.itemType?.toLowerCase() ?? '';
  if (t === 'article') return `Maqola #${row.itemId}`;
  if (t === 'audio') return `Audio #${row.itemId}`;
  if (t === 'video') return `Video #${row.itemId}`;
  if (t === 'training') return `Trening #${row.itemId}`;
  return `${row.itemType} #${row.itemId}`;
}

function diaryLine(d: DiaryEntryRow): string {
  const head = d.title?.trim() || htmlToPlainText(d.content).slice(0, 120);
  return head.length < (d.title?.trim() ? 999 : 120) ? head : `${head}…`;
}

export default function WellnessScreen() {
  const router = useRouter();
  const [weekly, setWeekly] = useState<MoodWeeklyResponse | null>(null);
  const [breathing, setBreathing] = useState<BreathingScenario[]>([]);
  const [saved, setSaved] = useState<SavedItemRow[]>([]);
  const [diary, setDiary] = useState<DiaryEntryRow[]>([]);
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [sleep, setSleep] = useState<SleepRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [w, b, s, d, h, sl] = await Promise.all([
        fetchMoodWeeklySummary(),
        fetchBreathingScenarios(),
        fetchSavedItems(),
        fetchDiaryEntries(),
        fetchHabits(),
        fetchSleepRecords(),
      ]);
      setWeekly(w);
      setBreathing(b ?? []);
      setSaved(s ?? []);
      setDiary(d ?? []);
      setHabits(h ?? []);
      setSleep(sl ?? []);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const logMood = async (mood: number) => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await postMoodEntry({ mood, note: note.trim() || undefined });
      setNote('');
      setSaveMsg('Saqlandi. Bu yozuvlar o‘z-o‘zini kuzatish uchun — tashxis emas.');
      await load();
    } catch (e) {
      setSaveMsg(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !weekly) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 items-center justify-center" edges={['top', 'bottom']}>
        <ActivityIndicator color="#5b7c6a" />
      </SafeAreaView>
    );
  }

  const diaryPreview = diary.slice(0, 4);

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2 border-b border-calm-200">
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent font-semibold">← Orqaga</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-calm-900">Ruhiy farovonlik</Text>
        <View style={{ width: 64 }} />
      </View>
      <ScrollView className="flex-1 px-5 pt-3" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="rounded-2xl bg-amber-50 border border-amber-200 p-4 mb-4">
          <Text className="text-amber-950 text-sm leading-5">
            Bu yerda keltirilgan mazmun tibbiy tashxis emas. Og‘ir yoki favqulodda holatda 112 yoki mahalliy yordam
            xizmatlariga murojaat qiling.
          </Text>
        </View>

        <CrisisMini />

        {error ? <Text className="text-red-800 mb-4">{error}</Text> : null}

        <Text className="text-calm-900 font-semibold text-lg mb-2">Bugungi kayfiyat</Text>
        <Text className="text-calm-600 text-sm mb-3">1–5 shkala. Qisqa izoh ixtiyoriy.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
          {[1, 2, 3, 4, 5].map((m) => (
            <Pressable
              key={m}
              disabled={saving}
              onPress={() => void logMood(m)}
              className="rounded-2xl border border-calm-300 bg-white px-4 py-3 min-w-[112px]"
            >
              <Text className="text-calm-900 font-semibold text-center">{m}</Text>
              <Text className="text-calm-600 text-xs text-center mt-0.5">{MOOD_LABELS[m]}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Qisqa izoh (ixtiyoriy)"
          placeholderTextColor="#8a9ba8"
          className="rounded-2xl border border-calm-200 bg-white px-4 py-3 text-calm-900 mb-3"
          multiline
        />
        {saveMsg ? <Text className="text-calm-700 text-sm mb-4">{saveMsg}</Text> : null}

        {weekly ? (
          <View className="rounded-3xl bg-white border border-calm-200 p-4 mb-6">
            <Text className="text-calm-900 font-semibold mb-2">Haftalik qisqacha</Text>
            {weekly.weekAverage != null ? (
              <Text className="text-calm-800 mb-2">O‘rtacha: {weekly.weekAverage.toFixed(1)} / 5</Text>
            ) : null}
            <Text className="text-calm-600 text-sm mb-2">Trend: {weekly.trend}</Text>
            {weekly.aiSummary ? (
              <Text className="text-calm-800 leading-6">{weekly.aiSummary}</Text>
            ) : (
              <Text className="text-calm-600 text-sm">Haftalik yozuvlar kam — bir necha kun qayd qilib ko‘ring.</Text>
            )}
          </View>
        ) : null}

        <Text className="text-calm-900 font-semibold text-lg mb-2">Kundalikdan parchalar</Text>
        <Text className="text-calm-600 text-sm mb-3">
          Oxirgi yozuvlar (faqat o‘qing). To‘liq boshqaruv keyingi bosqichda kengayishi mumkin.
        </Text>
        {diaryPreview.length === 0 ? (
          <Text className="text-calm-600 text-sm mb-6">Hozircha kundalik yozuvi yo‘q.</Text>
        ) : (
          diaryPreview.map((d) => (
            <View key={d.id} className="rounded-2xl border border-calm-200 bg-white p-3 mb-2">
              <Text className="text-calm-500 text-xs mb-1">{new Date(d.createdAt).toLocaleDateString()}</Text>
              <Text className="text-calm-800 text-sm leading-5">{diaryLine(d)}</Text>
            </View>
          ))
        )}

        <Text className="text-calm-900 font-semibold text-lg mb-2 mt-2">Odatlar</Text>
        <Text className="text-calm-600 text-sm mb-3">Ro‘yxat — eslatma. To‘liq boshqaruv keyinroq qo‘shilishi mumkin.</Text>
        {habits.length === 0 ? (
          <Text className="text-calm-600 text-sm mb-4">Hozircha oddiy odatlar qo‘shilmagan.</Text>
        ) : (
          habits.slice(0, 6).map((h) => (
            <View key={h.id} className="rounded-xl border border-calm-200 bg-white px-3 py-2 mb-2">
              <Text className="text-calm-800 text-sm font-medium">{h.name}</Text>
              {h.description ? <Text className="text-calm-600 text-xs mt-0.5">{h.description}</Text> : null}
            </View>
          ))
        )}

        <Text className="text-calm-900 font-semibold text-lg mb-2">Uyqu yozuvlari</Text>
        {sleep.length === 0 ? (
          <Text className="text-calm-600 text-sm mb-6">Hozircha uyqu qaydi yo‘q.</Text>
        ) : (
          sleep.slice(0, 3).map((r) => (
            <View key={r.id} className="rounded-xl border border-calm-200 bg-white px-3 py-2 mb-2">
              <Text className="text-calm-800 text-sm">
                {new Date(r.sleepStart).toLocaleString()}
                {r.quality != null ? ` · sifat ${r.quality}/5` : ''}
              </Text>
              {r.notes ? <Text className="text-calm-600 text-xs mt-1">{r.notes}</Text> : null}
            </View>
          ))
        )}

        <Text className="text-calm-900 font-semibold text-lg mb-2">Saqlanganlar</Text>
        {saved.length === 0 ? (
          <Text className="text-calm-600 text-sm mb-6">Hozircha saqlangan element yo‘q.</Text>
        ) : (
          saved.slice(0, 8).map((s) => (
            <View key={s.id} className="rounded-xl border border-calm-200 bg-white px-3 py-2 mb-2">
              <Text className="text-calm-800 text-sm">{savedLabel(s)}</Text>
              <Text className="text-calm-400 text-xs">{new Date(s.createdAt).toLocaleDateString()}</Text>
            </View>
          ))
        )}

        <Text className="text-calm-900 font-semibold text-lg mb-2">Nafas mashqlari</Text>
        <Text className="text-calm-600 text-sm mb-3">
          Eskiz — o‘zingizga mos tezlikda sinab ko‘ring. Tibbiy muammo bo‘lsa, mutaxassis bilan gaplashing.
        </Text>
        {breathing.map((s) => (
          <View key={s.id} className="rounded-2xl border border-calm-200 bg-white p-4 mb-3">
            <Text className="text-calm-900 font-medium mb-1">{s.title}</Text>
            {s.description ? <Text className="text-calm-700 text-sm mb-2">{s.description}</Text> : null}
            <Text className="text-calm-500 text-xs">
              Nafas ichida {s.inhaleSec}s · ushlab {s.holdSec}s · chiqarish {s.exhaleSec}s · ~{s.cyclesDefault}{' '}
              aylanma
            </Text>
          </View>
        ))}

        <Pressable onPress={() => router.push('/(settings)/compliance')} className="py-3 mt-2">
          <Text className="text-calm-600 text-center text-sm">
            Maxfiylik: <Text className="text-accent font-medium">Moslik sozlamalari</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function CrisisMini() {
  return (
    <Pressable
      onPress={() => void Linking.openURL('tel:112')}
      className="rounded-2xl bg-red-50 border border-red-200 p-4 mb-6"
    >
      <Text className="text-red-900 font-semibold text-center">Favqulodda: 112</Text>
    </Pressable>
  );
}
