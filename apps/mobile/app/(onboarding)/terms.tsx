import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '~/components/Screen';
import { PrimaryButton } from '~/components/PrimaryButton';
import { useLegalStore } from '~/store/legalStore';

export default function TermsScreen() {
  const load = useLegalStore((s) => s.load);
  const bundle = useLegalStore((s) => s.bundle);
  const loading = useLegalStore((s) => s.loading);
  const error = useLegalStore((s) => s.error);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !bundle?.terms) {
    return (
      <View className="flex-1 items-center justify-center bg-calm-50">
        <ActivityIndicator size="large" color="#5b7c6a" />
      </View>
    );
  }

  return (
    <Screen
      title="Foydalanish shartlari"
      subtitle={bundle?.terms?.version ? `Versiya: ${bundle.terms.version}` : undefined}
    >
      {error ? (
        <Text className="text-red-700 mb-4">{error}</Text>
      ) : null}
      <Text className="text-calm-800 leading-7 text-base">
        {bundle?.terms?.content ?? 'Hujjat yuklanmadi. Internet ulanishini tekshiring.'}
      </Text>
      <View className="mt-8">
        <Link href="/(onboarding)/privacy" asChild>
          <PrimaryButton title="Keyingi" />
        </Link>
      </View>
    </Screen>
  );
}
