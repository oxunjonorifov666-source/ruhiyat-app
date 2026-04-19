import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ComplianceSummary } from '~/components/compliance/ComplianceSummary';
import { PrimaryButton } from '~/components/PrimaryButton';
import {
  cancelAccountDeletion,
  fetchComplianceState,
  requestAccountDeletion,
} from '~/lib/compliance';
import { getApiErrorMessage } from '~/lib/errors';
import { useAuthStore } from '~/store/authStore';
import type { ComplianceState } from '~/types/compliance';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const role = useAuthStore((s) => s.user?.role);

  const [state, setState] = useState<ComplianceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const s = await fetchComplianceState();
      setState(s);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setState(null);
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

  const confirmDelete = () => {
    const grace = state?.deletionGraceDays ?? 0;
    Alert.alert(
      'Hisobni o‘chirishni tasdiqlaysizmi?',
      `So‘rovdan keyin taxminan ${grace} kun ichida hisobingiz to‘liq o‘chiriladi. Bu muddat ichida bekor qilish mumkin. Ma’lumotlaringiz yo‘qolishi mumkin — bu qaytarib bo‘lmaydigan jarayon bo‘lishi mumkin.`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'So‘rov yuborish',
          style: 'destructive',
          onPress: () => void submitDeletion(),
        },
      ],
    );
  };

  const submitDeletion = async () => {
    setWorking(true);
    try {
      const res = await requestAccountDeletion();
      await load();
      Alert.alert(
        'So‘rov qabul qilindi',
        `Hisobingiz ${new Date(res.scheduledDeletionAt).toLocaleString()} sanasiga rejalashtirilgan holda o‘chiriladi. Bekor qilish uchun ushbu sahifadan foydalaning (muddat tugaguncha).`,
        [{ text: 'Tushundim', style: 'default' }],
      );
    } catch (e) {
      Alert.alert('Xatolik', getApiErrorMessage(e));
    } finally {
      setWorking(false);
    }
  };

  const confirmCancel = () => {
    Alert.alert(
      'O‘chirishni bekor qilasizmi?',
      'Hisobingiz yana faol holatga qaytariladi.',
      [
        { text: 'Orqaga', style: 'cancel' },
        { text: 'Bekor qilishni tasdiqlash', style: 'default', onPress: () => void submitCancel() },
      ],
    );
  };

  const submitCancel = async () => {
    setWorking(true);
    try {
      await cancelAccountDeletion();
      await load();
      Alert.alert('Bekor qilindi', 'Hisobingiz faol holatda saqlanadi.', [{ text: 'Yaxshi', style: 'default' }]);
    } catch (e) {
      Alert.alert('Xatolik', getApiErrorMessage(e));
    } finally {
      setWorking(false);
    }
  };

  const pending = state?.accountLifecycle === 'PENDING_DELETION';
  const canUseMobileDeletion = hydrated && role === 'MOBILE_USER';
  const showNonMobileNotice = hydrated && role != null && role !== 'MOBILE_USER';

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 40 }}>
        <ComplianceSummary
          loading={loading}
          error={error}
          state={state}
          onRetry={() => {
            setLoading(true);
            void load();
          }}
        />

        <View className="rounded-2xl bg-amber-50 border border-amber-200 p-4 mb-4">
          <Text className="text-amber-950 text-sm leading-5">
            Favqulodda yoki o‘z joniga xavf tug‘diradigan holatda — SOS yoki mahalliy favqulodda xizmatlariga murojaat
            qiling. Hisobni o‘chirish shu muammolarni hal qilmaydi.
          </Text>
        </View>

        {showNonMobileNotice ? (
          <Text className="text-calm-600 leading-6 mb-4">
            Hisobni o‘chirish so‘rovi faqat mobil ilova foydalanuvchisi (MOBILE_USER) uchun serverda qo‘llaniladi.
            Boshqa rollar uchun administrator bilan bog‘laning.
          </Text>
        ) : null}

        {canUseMobileDeletion && state?.accountLifecycle === 'ACTIVE' ? (
          <>
            <Text className="text-calm-800 leading-6 mb-4">
              Hisobingizni o‘chirish serverga so‘rov yuboradi. So‘rovdan keyin belgilangan muddat (odatda{' '}
              {state.deletionGraceDays} kun) ichida bekor qilish mumkin; muddat tugagach ma’lumotlar yo‘qolishi mumkin.
            </Text>
            <PrimaryButton title="Hisobni o‘chirishni so‘rash" loading={working} onPress={confirmDelete} />
          </>
        ) : null}

        {canUseMobileDeletion && pending ? (
          <>
            <View className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 mb-4">
              <Text className="text-amber-950 font-semibold mb-2">O‘chirish kutilmoqda</Text>
              {state?.scheduledDeletionAt ? (
                <Text className="text-calm-900 text-sm leading-5 mb-3">
                  Taxminiy o‘chirish vaqti: {new Date(state.scheduledDeletionAt).toLocaleString()}
                </Text>
              ) : null}
              <Text className="text-calm-800 text-sm leading-5">
                Agar o‘zgarishni istasangiz, muddat tugashidan oldin bekor qiling.
              </Text>
            </View>
            <PrimaryButton
              title="O‘chirishni bekor qilish"
              loading={working}
              variant="ghost"
              onPress={confirmCancel}
            />
          </>
        ) : null}

        {state?.accountLifecycle === 'DELETED' ? (
          <Text className="text-calm-700 leading-6">
            Hisob o‘chirilgan. Yangi hisob yoki yordam uchun qo‘llab-quvvatlash bilan bog‘laning.
          </Text>
        ) : null}

        <View className="h-4" />
        <PrimaryButton title="Maxfiylik va moslik" variant="ghost" onPress={() => router.push('/(settings)/compliance')} />
      </ScrollView>
    </SafeAreaView>
  );
}
