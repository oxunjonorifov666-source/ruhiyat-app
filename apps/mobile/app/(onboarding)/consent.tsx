import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '~/components/Screen';
import { PrimaryButton } from '~/components/PrimaryButton';
import { useOnboardingStore } from '~/store/onboardingStore';

export default function ConsentScreen() {
  const router = useRouter();
  const setCompleted = useOnboardingStore((s) => s.setCompleted);
  const [agree, setAgree] = useState(false);

  const onContinue = () => {
    if (!agree) return;
    setCompleted(true);
    router.replace('/(auth)/register');
  };

  return (
    <Screen
      title="Rozilik"
      subtitle="Davom etishdan oldin quyidagi band bilan tanishing."
      scroll={false}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agree }}
        onPress={() => setAgree(!agree)}
        className="flex-row items-start gap-3 p-4 rounded-2xl bg-white border border-calm-200"
      >
        <View
          className={`mt-0.5 h-6 w-6 rounded-md border-2 items-center justify-center ${
            agree ? 'bg-accent border-accent' : 'border-calm-400 bg-white'
          }`}
        >
          {agree ? <Text className="text-white text-xs font-bold">✓</Text> : null}
        </View>
        <Text className="flex-1 text-base text-calm-800 leading-6">
          Ro‘yxatdan o‘tish orqali men Foydalanish shartlari va Maxfiylik siyosatiga rozilik bildiraman.
        </Text>
      </Pressable>

      <View className="mt-auto pt-10">
        <PrimaryButton title="Ro‘yxatdan o‘tish" onPress={onContinue} disabled={!agree} />
      </View>
    </Screen>
  );
}
