import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CrisisResourcesStrip } from '~/components/CrisisResourcesStrip';
import { PrimaryButton } from '~/components/PrimaryButton';

export default function SupportTab() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['top']}>
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-2xl font-semibold text-calm-900 mb-2">Yordam</Text>
        <Text className="text-calm-600 leading-6 mb-4">
          Bu yerda alohida AI suhbat oynasi yo‘q. Siz mavjud va xavfsiz yo‘llardan foydalanishingiz mumkin: testlar
          orqali yo‘l-yo‘riq, kutubxonadagi materiallar, mutaxassislar bilan bron — favqulodda holatda esa quyidagi
          raqamlar.
        </Text>

        <CrisisResourcesStrip />

        <View className="rounded-2xl bg-amber-50 border border-amber-200 p-4 mb-4">
          <Text className="text-amber-950 text-sm leading-5">
            Sun’iy intellekt yoki avtomatik matnlar professional psixolog yoki shifokor bilan suhbat yoki tibbiy
            tashxis o‘rnini bosmaydi.
          </Text>
        </View>

        <Text className="text-calm-900 font-semibold text-base mb-2">Hissiy qo‘llab-quvvatlash (chegarlangan)</Text>
        <Text className="text-calm-600 text-sm leading-6 mb-3">
          Test yakunlangach, natijalar bo‘limida qisqa mashqlar va yo‘l-yo‘riqlar bor — erkin chat emas, balki belgilangan
          qadamlar.
        </Text>
        <PrimaryButton title="Psixologik testlar" onPress={() => router.push('/(main)/tests')} />

        <View className="h-4" />

        <Text className="text-calm-900 font-semibold text-base mb-2">O‘qish va yangiliklar</Text>
        <Pressable
          onPress={() => router.push('/(main)/library')}
          className="rounded-2xl bg-white border border-calm-200 px-5 py-4 mb-3"
        >
          <Text className="text-accent font-semibold">Maqolalar va e‘lonlar</Text>
          <Text className="text-calm-600 text-sm mt-1">Nashr etilgan materiallar — umumiy ma’lumot.</Text>
        </Pressable>

        <Text className="text-calm-900 font-semibold text-base mb-2">Inson bilan</Text>
        <Pressable
          onPress={() => router.push('/(main)/psychologists')}
          className="rounded-2xl bg-white border border-calm-200 px-5 py-4 mb-3"
        >
          <Text className="text-accent font-semibold">Mutaxassislar katalogi</Text>
          <Text className="text-calm-600 text-sm mt-1">Bron qilish ixtiyoriy; tashxis emas, professional qo‘llab-quvvatlash uchun.</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(main)/psychologists/bookings')}
          className="py-3 mb-2"
        >
          <Text className="text-calm-700 text-center text-sm">
            <Text className="text-accent font-medium">Mening bronlarim</Text>
          </Text>
        </Pressable>

        <Text className="text-calm-900 font-semibold text-base mb-2">Bildirishnomalar</Text>
        <Pressable onPress={() => router.push('/(main)/notifications')} className="py-2 mb-4">
          <Text className="text-accent font-medium">Bildirishnomalar ro‘yxati →</Text>
        </Pressable>

        <View className="rounded-2xl border border-calm-200 bg-calm-50/80 p-4 mb-2">
          <Text className="text-calm-800 text-sm font-medium mb-2">Huquq va maxfiylik</Text>
          <Pressable onPress={() => router.push('/(settings)/compliance')}>
            <Text className="text-accent font-medium text-sm">Maxfiylik va moslik →</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
