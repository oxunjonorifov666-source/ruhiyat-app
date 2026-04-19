import { useCallback, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ComplianceSummary } from '~/components/compliance/ComplianceSummary';
import { PrimaryButton } from '~/components/PrimaryButton';
import { fetchComplianceState } from '~/lib/compliance';
import { getApiErrorMessage } from '~/lib/errors';
import type { ComplianceState } from '~/types/compliance';

export default function ComplianceSettingsScreen() {
  const router = useRouter();
  const [state, setState] = useState<ComplianceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 36 }}>
        <Text className="text-calm-600 leading-6 mb-4">
          Ruhiyatda qabul qilingan hujjatlar va hisob bo‘yicha holat — shaffof ko‘rinish uchun.
        </Text>

        <ComplianceSummary loading={loading} error={error} state={state} onRetry={() => { setLoading(true); void load(); }} />

        <View className="rounded-2xl bg-calm-100 border border-calm-200 p-4 mb-4">
          <Text className="text-calm-800 text-sm leading-5 mb-3">Hujjatlarni qayta ko‘rish</Text>
          <Pressable onPress={() => router.push('/(onboarding)/terms')} className="py-2">
            <Text className="text-accent font-medium">Foydalanish shartlari</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(onboarding)/privacy')} className="py-2">
            <Text className="text-accent font-medium">Maxfiylik siyosati</Text>
          </Pressable>
        </View>

        <PrimaryButton
          title="Hisobni o‘chirish bo‘limi"
          variant="ghost"
          onPress={() => router.push('/(settings)/delete-account')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
