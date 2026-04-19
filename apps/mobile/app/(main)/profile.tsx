import { useCallback } from 'react';
import { Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '~/store/authStore';
import { usePremiumEntitlementStore } from '~/store/premiumEntitlementStore';
import { CrisisResourcesStrip } from '~/components/CrisisResourcesStrip';
import { PrimaryButton } from '~/components/PrimaryButton';

export default function ProfileTab() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fetchEntitlements = usePremiumEntitlementStore((s) => s.fetchEntitlements);
  const entitlements = usePremiumEntitlementStore((s) => s.entitlements);
  const entLoading = usePremiumEntitlementStore((s) => s.loading);

  useFocusEffect(
    useCallback(() => {
      void fetchEntitlements(true);
    }, [fetchEntitlements]),
  );

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—';
  const contact = user?.phone || user?.email || '—';

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-calm-50 px-5 pt-4" edges={['top']}>
      <Text className="text-2xl font-semibold text-calm-900 mb-1">Profil</Text>
      <CrisisResourcesStrip />
      <View className="rounded-3xl bg-white border border-calm-200 p-5 mb-6">
        <Text className="text-calm-500 text-sm">Ism</Text>
        <Text className="text-calm-900 text-lg mb-3">{name}</Text>
        <Text className="text-calm-500 text-sm">Aloqa</Text>
        <Text className="text-calm-900 text-lg">{contact}</Text>
      </View>

      <Pressable
        onPress={() => router.push('/(main)/psychologists/bookings')}
        className="rounded-2xl bg-white border border-calm-200 px-5 py-4 mb-3"
      >
        <Text className="text-calm-900 font-semibold text-lg">Mening bronlarim</Text>
        <Text className="text-calm-600 text-sm mt-1">Seanslar holati va tarix</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(settings)/compliance')}
        className="rounded-2xl bg-white border border-calm-200 px-5 py-4 mb-3"
      >
        <Text className="text-calm-900 font-semibold text-lg">Maxfiylik va moslik</Text>
        <Text className="text-calm-600 text-sm mt-1">Shartlar, versiyalar va hisob holati</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(settings)/premium')}
        className="rounded-2xl bg-accent/15 border border-accent/40 px-5 py-4 mb-3"
      >
        <View className="flex-row justify-between items-start gap-2">
          <Text className="text-accent font-semibold text-lg flex-1">Ruhiyat Premium</Text>
          {entLoading ? (
            <Text className="text-calm-400 text-xs">…</Text>
          ) : entitlements?.isPremium ? (
            <View className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5">
              <Text className="text-emerald-900 text-xs font-semibold">Faol</Text>
            </View>
          ) : (
            <View className="rounded-full bg-calm-100 border border-calm-300 px-2 py-0.5">
              <Text className="text-calm-700 text-xs font-medium">Bepul</Text>
            </View>
          )}
        </View>
        <Text className="text-calm-700 text-sm mt-1">
          {entitlements?.isPremium && entitlements.premiumUntil
            ? `Muddati: ${new Date(entitlements.premiumUntil).toLocaleDateString()}`
            : 'Obuna va server bo‘yicha imkoniyatlar — batafsil Premium sahifasida'}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(settings)/delete-account')} className="py-3 mb-2">
        <Text className="text-red-700 text-center font-medium">Hisobni o‘chirish</Text>
      </Pressable>

      <PrimaryButton title="Chiqish" variant="ghost" onPress={onLogout} />
    </SafeAreaView>
  );
}
