import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '~/components/Screen';
import { PrimaryButton } from '~/components/PrimaryButton';
import { useLegalStore } from '~/store/legalStore';

export default function PrivacyScreen() {
  const load = useLegalStore((s) => s.load);
  const bundle = useLegalStore((s) => s.bundle);
  const loading = useLegalStore((s) => s.loading);
  const error = useLegalStore((s) => s.error);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !bundle?.privacy) {
    return (
      <View className="flex-1 items-center justify-center bg-calm-50">
        <ActivityIndicator size="large" color="#5b7c6a" />
      </View>
    );
  }

  return (
    <Screen
      title="Maxfiylik siyosati"
      subtitle={bundle?.privacy?.version ? `Versiya: ${bundle.privacy.version}` : undefined}
    >
      {error ? (
        <Text className="text-red-700 mb-4">{error}</Text>
      ) : null}
      <Text className="text-calm-800 leading-7 text-base">
        {bundle?.privacy?.content ?? 'Hujjat yuklanmadi.'}
      </Text>
      <View className="mt-8">
        <Link href="/(onboarding)/consent" asChild>
          <PrimaryButton title="Keyingi" />
        </Link>
      </View>
    </Screen>
  );
}
