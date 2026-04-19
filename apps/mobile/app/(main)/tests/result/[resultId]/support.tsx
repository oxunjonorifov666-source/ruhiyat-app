import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AiSafetyDisclaimer } from '~/components/AiSafetyDisclaimer';
import { CrisisResourcesStrip } from '~/components/CrisisResourcesStrip';
import { PrimaryButton } from '~/components/PrimaryButton';

const PROMPTS = [
  'Hozirgi kayfiyatingizni bir ikki jumla bilan nomlang — qanday his sezyapsiz?',
  'Nafasingizni sekinlashtiring: 4 soniya ichinga, 6 soniya ushlab, 8 soniya chiqarib — 3 marta takrorlang.',
  'Bugun sizga yengil keladigan kichik qadam bitta nima bo‘lishi mumkin? (juda kichik bo‘lishi mumkin)',
  'Agar xavf yoki o‘ziga zarar haqida o‘ylar kuchaygan bo‘lsa — yon-atrofdagi ishonchli odam yoki favqulodda liniyalar bilan bog‘laning.',
];

export default function BoundedSupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 36 }}>
        <Text className="text-calm-900 text-lg font-semibold mb-2">Hissiy yordam</Text>
        <Text className="text-calm-600 leading-6 mb-4">
          Bu yerda erkin suhbat emas — qisqa yo‘l-yo‘riq va refleksiya uchun belgilangan qadamlar. Chuqur yordam uchun
          mutaxassis bilan bog‘laning.
        </Text>

        <AiSafetyDisclaimer />
        <CrisisResourcesStrip />

        <View className="rounded-3xl bg-white border border-calm-200 p-5 mb-4">
          <Text className="text-calm-900 font-semibold mb-3">Bugungi kichik mashqlar</Text>
          {PROMPTS.map((p) => (
            <Text key={p} className="text-calm-800 leading-6 mb-4">
              • {p}
            </Text>
          ))}
        </View>

        <PrimaryButton title="Yordam bo‘limiga o‘tish" onPress={() => router.push('/(main)/support')} />
        <View className="h-3" />
        <Pressable onPress={() => router.push('/(main)/psychologists')} className="py-3 mb-1">
          <Text className="text-calm-600 text-center text-sm">
            Yoki <Text className="text-accent font-semibold">mutaxassislar katalogiga</Text> o‘ting — tashxis emas, insoniy qo‘llab-quvvatlash uchun
          </Text>
        </Pressable>
        <PrimaryButton title="Testlarga qaytish" variant="ghost" onPress={() => router.push('/(main)/tests')} />
      </ScrollView>
    </SafeAreaView>
  );
}
