import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { PrimaryButton } from '~/components/PrimaryButton';
import { createBooking, fetchPsychologistDetail } from '~/lib/careApi';
import { getApiErrorMessage } from '~/lib/errors';
import type { MobilePsychologistDetail } from '~/types/care';
import { usePremiumEntitlementStore } from '~/store/premiumEntitlementStore';

const DURATIONS = [30, 45, 60, 90];

function defaultSlot(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

export default function BookSessionScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const psychId = Number(idParam);
  const router = useRouter();
  const navigation = useNavigation();

  const [psych, setPsych] = useState<MobilePsychologistDetail | null>(null);
  const [loadingPsych, setLoadingPsych] = useState(true);
  const [scheduledAt, setScheduledAt] = useState(defaultSlot);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const fetchEntitlements = usePremiumEntitlementStore((s) => s.fetchEntitlements);
  const isPremium = usePremiumEntitlementStore((s) => s.entitlements?.isPremium);

  useFocusEffect(
    useCallback(() => {
      void fetchEntitlements(true);
    }, [fetchEntitlements]),
  );

  const loadPsych = useCallback(async () => {
    if (!Number.isFinite(psychId)) return;
    try {
      const p = await fetchPsychologistDetail(psychId);
      setPsych(p);
      navigation.setOptions({ title: 'Bron qilish' });
    } catch {
      setPsych(null);
    } finally {
      setLoadingPsych(false);
    }
  }, [navigation, psychId]);

  useEffect(() => {
    void loadPsych();
  }, [loadPsych]);

  const onChangeDate = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowDate(false);
    if (!selected) return;
    setScheduledAt((prev) => {
      const n = new Date(prev);
      n.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      return n;
    });
  };

  const onChangeTime = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowTime(false);
    if (!selected) return;
    setScheduledAt((prev) => {
      const n = new Date(prev);
      n.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      return n;
    });
  };

  const summary = useMemo(() => {
    try {
      return scheduledAt.toLocaleString('uz-UZ', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return scheduledAt.toISOString();
    }
  }, [scheduledAt]);

  const submit = async () => {
    if (!Number.isFinite(psychId)) return;
    if (psych?.isAvailable === false) {
      setErr('Bu mutaxassis hozirda bron qabul qilmayapti.');
      return;
    }
    setErr(null);
    setSubmitting(true);
    try {
      await createBooking({
        psychologistId: psychId,
        scheduledAt: scheduledAt.toISOString(),
        duration,
        notes: notes.trim() || undefined,
      });
      router.replace('/(main)/psychologists/bookings');
    } catch (e) {
      setErr(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPsych) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
        <Text className="text-calm-600 px-5 pt-4">Yuklanmoqda…</Text>
      </SafeAreaView>
    );
  }

  if (!psych) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 px-5 justify-center" edges={['bottom']}>
        <Text className="text-calm-800 mb-4">Mutaxassis topilmadi.</Text>
        <PrimaryButton title="Orqaga" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-calm-600 leading-6 mb-4">
          Vaqt va davomiylikni tanlang. So‘rov markaz yoki mutaxassis tasdig‘idan keyin yakunlanadi — bu yerda tibbiy
          tashxis berilmaydi.
        </Text>

        <Text className="text-calm-900 font-semibold mb-2">Sana va vaqt</Text>
        <Text className="text-calm-800 mb-3">{summary}</Text>
        <View className="flex-row gap-2 mb-4">
          <Pressable onPress={() => setShowDate(true)} className="flex-1 rounded-2xl bg-white border border-calm-200 py-3 items-center">
            <Text className="text-calm-800 font-medium">Sanani tanlash</Text>
          </Pressable>
          <Pressable onPress={() => setShowTime(true)} className="flex-1 rounded-2xl bg-white border border-calm-200 py-3 items-center">
            <Text className="text-calm-800 font-medium">Vaqtni tanlash</Text>
          </Pressable>
        </View>
        {showDate ? (
          <DateTimePicker value={scheduledAt} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onChangeDate} />
        ) : null}
        {showTime ? (
          <DateTimePicker value={scheduledAt} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onChangeTime} />
        ) : null}

        <Text className="text-calm-900 font-semibold mb-2 mt-2">Davomiylik (daq.)</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {DURATIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDuration(d)}
              className={`rounded-2xl px-4 py-2 border ${duration === d ? 'border-accent bg-accent/10' : 'border-calm-200 bg-white'}`}
            >
              <Text className={duration === d ? 'text-calm-900 font-semibold' : 'text-calm-700'}>{d}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-calm-900 font-semibold mb-2">Izoh (ixtiyoriy)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Qisqa maqsad yoki savollar"
          placeholderTextColor="#8a9ba8"
          multiline
          className="rounded-2xl border border-calm-200 bg-white px-4 py-3 text-calm-900 min-h-[100px] mb-4"
          textAlignVertical="top"
        />

        {err ? <Text className="text-red-700 mb-3">{err}</Text> : null}

        <PrimaryButton
          title="So‘rov yuborish"
          loading={submitting}
          disabled={psych.isAvailable === false}
          onPress={() => void submit()}
        />

        <View className="mt-6 rounded-2xl border border-dashed border-calm-300 bg-calm-50/80 p-4">
          <Text className="text-calm-600 text-sm leading-5">
            {isPremium
              ? 'Premium obuna faol. Ustuvor bron va boshqa imkoniyatlar platforma sozlamalari va mutaxassislar bilan kelishilgan holda qo‘llaniladi — hozir bron so‘rovi standart navbat tartibida.'
              : 'Ruhiyat Premium orqali kelajakda kengaytirilgan imkoniyatlar (jumladan ustuvor bron) rejalashtirilmoqda. Hozir barcha foydalanuvchilar uchun bir xil bron jarayoni.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
