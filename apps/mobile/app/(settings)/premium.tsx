import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '~/components/PrimaryButton';
import {
  fetchConsumerPlans,
  fetchMyMobilePayments,
  fetchPremiumPaymentStatus,
  startPremiumSubscription,
} from '~/lib/monetizationApi';
import { getApiErrorMessage } from '~/lib/errors';
import { usePremiumEntitlementStore } from '~/store/premiumEntitlementStore';
import { useAuthStore } from '~/store/authStore';
import type { ConsumerPlanRow, MobilePaymentRow } from '~/types/monetization';

/** Marketing directions — must stay consistent with server `entitlements.features` (shown below when loaded). */
const PREMIUM_DIRECTIONS: { title: string; detail: string }[] = [
  {
    title: 'Chuqurroq tahlil va tarix',
    detail:
      'Test natijalari va tushuntirishlar chuqurligi — serverdagi obuna va rejangiz bilan bog‘liq; bepul rejada ham asosiy tushuntirishlar mavjud.',
  },
  {
    title: 'Qo‘shimcha kontent va materiallar',
    detail:
      'Audio, video yoki boshqa premium kontent — faqat serverda tegishli ruxsatlar yoqilganda (pastdagi «Premium kontent» holatiga qarang).',
  },
  {
    title: 'AI yoki maslahat kanallari',
    detail:
      'AI suhbat, video konsultatsiya yoki kurslar — hisobingizdagi ruxsatlar bilan; ilova ichida har doim ham barcha variantlar ko‘rinmasligi mumkin.',
  },
  {
    title: 'Bron va navbat',
    detail:
      'Ayrim markazlarda ustuvorlik yoki qulayroq vaqtlar — provayder qoidalariga qarab; kafolat har doim berilmaydi.',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const role = useAuthStore((s) => s.user?.role);

  const entitlements = usePremiumEntitlementStore((s) => s.entitlements);
  const entLoading = usePremiumEntitlementStore((s) => s.loading);
  const entError = usePremiumEntitlementStore((s) => s.error);
  const fetchEntitlements = usePremiumEntitlementStore((s) => s.fetchEntitlements);

  const [plans, setPlans] = useState<ConsumerPlanRow[]>([]);
  const [payments, setPayments] = useState<MobilePaymentRow[]>([]);
  const [auxLoading, setAuxLoading] = useState(true);
  const [auxError, setAuxError] = useState<string | null>(null);
  const [startLoading, setStartLoading] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState<number | null>(null);
  const [pollNote, setPollNote] = useState<string | null>(null);

  const isMobile = hydrated && role === 'MOBILE_USER';

  const refreshAll = useCallback(async () => {
    setAuxError(null);
    setAuxLoading(true);
    if (isMobile) {
      await fetchEntitlements(true);
      try {
        const [p, pay] = await Promise.all([fetchConsumerPlans(), fetchMyMobilePayments()]);
        setPlans(p ?? []);
        setPayments(pay ?? []);
      } catch (e) {
        setAuxError(getApiErrorMessage(e));
      }
    } else {
      setPlans([]);
      setPayments([]);
    }
    setAuxLoading(false);
  }, [fetchEntitlements, isMobile]);

  useFocusEffect(
    useCallback(() => {
      void refreshAll();
    }, [refreshAll]),
  );

  const premiumPlan = plans.find((x) => x.code === 'PREMIUM');

  const onSubscribe = async () => {
    setStartLoading(true);
    setPollNote(null);
    try {
      const res = await startPremiumSubscription();
      setLastPaymentId(res.payment.id);
      if (res.checkoutUrl) {
        await WebBrowser.openBrowserAsync(res.checkoutUrl);
        setPollNote(
          'To‘lov oynasidan qaytgach, holatni yangilash uchun «To‘lovni tekshirish» tugmasini bosing.',
        );
      } else {
        setPollNote(
          `To‘lov yozuvi yaratildi (#${res.payment.id}). Onlayn to‘lov havolasi hozircha sozlanmagan bo‘lishi mumkin — administrator yoki Click integratsiyasi sozlanganda to‘lov yakunlanadi.`,
        );
      }
      await fetchEntitlements(true);
      const pay = await fetchMyMobilePayments();
      setPayments(pay ?? []);
    } catch (e) {
      setPollNote(getApiErrorMessage(e));
    } finally {
      setStartLoading(false);
    }
  };

  const checkPayment = async () => {
    if (!lastPaymentId) return;
    setStartLoading(true);
    setPollNote(null);
    try {
      const st = await fetchPremiumPaymentStatus(lastPaymentId);
      setPollNote(
        `To‘lov: ${st.payment.status}. Premium: ${st.isPremium ? 'faol' : 'hali yo‘q'}.`,
      );
      await fetchEntitlements(true);
    } catch (e) {
      setPollNote(getApiErrorMessage(e));
    } finally {
      setStartLoading(false);
    }
  };

  const loading = isMobile ? entLoading || auxLoading : auxLoading;

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-3xl font-bold text-calm-900 mb-2">Ruhiyat Premium</Text>
        <Text className="text-calm-700 text-base leading-7 mb-4">
          Premium obuna serverda rejangiz va ruxsatlar bilan boshqariladi. Quyida — umumiy yo‘nalishlar; aniq
          funksiyalar yuqoridagi «Joriy reja» va platforma ayrimlari bilan mos kelishi kerak.
        </Text>
        <View className="rounded-2xl bg-calm-100/90 border border-calm-200 p-3 mb-6">
          <Text className="text-calm-700 text-sm leading-5">
            Hozirgi ilovada asosan testlar, mutaxassislar, kutubxona, farovonlik va bildirishnomalar mavjud. Premium
            imkoniyatlari bosqichma-bosqich kengayishi mumkin — vada qilingan har bir funksiya serverda yoqilganini
            tekshiring.
          </Text>
        </View>

        {loading ? (
          <View className="py-6 items-center mb-4">
            <ActivityIndicator color="#5b7c6a" />
            <Text className="text-calm-500 text-sm mt-2">Holat yuklanmoqda…</Text>
          </View>
        ) : null}

        {isMobile && entError ? (
          <View className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-4">
            <Text className="text-red-900 text-sm mb-2">{entError}</Text>
            <Pressable onPress={() => void refreshAll()}>
              <Text className="text-accent font-semibold text-sm">Qayta urinish</Text>
            </Pressable>
          </View>
        ) : null}

        {isMobile && entitlements ? (
          <View
            className={`rounded-3xl border p-5 mb-6 ${entitlements.isPremium ? 'border-emerald-300 bg-emerald-50' : 'border-calm-200 bg-white'}`}
          >
            <Text className="text-xs font-semibold text-calm-500 uppercase tracking-wide mb-1">Joriy reja</Text>
            <Text className="text-xl font-semibold text-calm-900 mb-1">
              {entitlements.isPremium ? 'Ruhiyat Premium' : 'Bepul reja'}
            </Text>
            {entitlements.isPremium && entitlements.premiumUntil ? (
              <Text className="text-calm-800 text-sm mb-2">
                Amal qilish muddati: {new Date(entitlements.premiumUntil).toLocaleString()}
              </Text>
            ) : !entitlements.isPremium ? (
              <Text className="text-calm-600 text-sm mb-2">
                Premium funksiyalari cheklangan — pastda obuna va narxlarni ko‘ring.
              </Text>
            ) : null}
            <Text className="text-calm-500 text-xs mb-2">Serverdagi kod: {entitlements.planCode}</Text>
            <View className="border-t border-calm-200 pt-3 mt-2">
              <Text className="text-calm-600 text-xs uppercase mb-2">Platforma ayrimlari (server)</Text>
              <Text className="text-calm-800 text-sm">
                AI suhbat: {entitlements.features.psychChat ? 'ha' : 'yo‘q'} · Video:{' '}
                {entitlements.features.videoConsultation ? 'ha' : 'yo‘q'} · Kurslar:{' '}
                {entitlements.features.courses ? 'ha' : 'yo‘q'} · Premium kontent:{' '}
                {entitlements.features.premiumContent ? 'ha' : 'yo‘q'}
              </Text>
            </View>
          </View>
        ) : null}

        {!isMobile && hydrated ? (
          <Text className="text-calm-600 leading-6 mb-6">
            Premium obuna vaqtinchalik faqat mobil ilova foydalanuvchilari (MOBILE_USER) uchun serverda ko‘rinadi.
          </Text>
        ) : null}

        {auxError ? (
          <Text className="text-amber-900 text-sm mb-4">{auxError}</Text>
        ) : null}

        {isMobile && premiumPlan ? (
          <View className="rounded-2xl bg-calm-100 border border-calm-200 p-4 mb-6">
            <Text className="text-calm-900 font-semibold mb-1">{premiumPlan.name}</Text>
            {premiumPlan.description ? (
              <Text className="text-calm-700 text-sm mb-2">{premiumPlan.description}</Text>
            ) : null}
            <Text className="text-calm-900">
              {premiumPlan.monthlyPriceUzs.toLocaleString()} {premiumPlan.code === 'PREMIUM' ? 'so‘m / oy' : ''}
            </Text>
          </View>
        ) : null}

        <Text className="text-calm-900 font-semibold text-base mb-2">Yo‘nalishlar (umumiy)</Text>
        <View className="gap-4 mb-10">
          {PREMIUM_DIRECTIONS.map((row) => (
            <View key={row.title} className="rounded-2xl border border-calm-200 bg-white p-4">
              <Text className="text-calm-900 font-medium mb-1">{row.title}</Text>
              <Text className="text-calm-600 text-sm leading-5">{row.detail}</Text>
            </View>
          ))}
        </View>

        {isMobile && entitlements && !entitlements.isPremium ? (
          <>
            <PrimaryButton
              title="Premiumga obuna bo‘lish"
              loading={startLoading}
              onPress={() => void onSubscribe()}
            />
            {lastPaymentId ? (
              <View className="mt-3">
                <PrimaryButton
                  title="To‘lovni tekshirish"
                  variant="ghost"
                  loading={startLoading}
                  onPress={() => void checkPayment()}
                />
              </View>
            ) : null}
          </>
        ) : isMobile && entitlements?.isPremium ? (
          <Text className="text-center text-emerald-900 font-medium mb-4">
            Premium obuna faol — rahmat!
          </Text>
        ) : null}

        {pollNote ? (
          <Text className="text-calm-700 text-sm leading-5 mt-4 mb-4">{pollNote}</Text>
        ) : null}

        {isMobile && payments.length > 0 ? (
          <View className="mb-6">
            <Text className="text-calm-900 font-semibold mb-2">So‘nggi to‘lovlar (server)</Text>
            {payments.slice(0, 5).map((p) => (
              <View key={p.id} className="border-b border-calm-200 py-2">
                <Text className="text-calm-800 text-sm">
                  #{p.id} · {p.amount.toLocaleString()} {p.currency} · {p.status}
                </Text>
                <Text className="text-calm-500 text-xs">{new Date(p.createdAt).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text className="text-center text-calm-500 text-sm mt-2">
          Obunani istalgan payt boshqarish mumkin — aniq shartlar bank / to‘lov provayderi orqali ham tasdiqlanadi.
        </Text>

        <Pressable onPress={() => router.push('/(settings)/compliance')} className="mt-6 py-2">
          <Text className="text-calm-600 text-center text-sm">
            Maxfiylik va shartlar: <Text className="text-accent font-medium">Moslik</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
