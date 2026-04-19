import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '~/store/authStore';
import { useOnboardingStore } from '~/store/onboardingStore';

export default function Index() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const onboardingDone = useOnboardingStore((s) => s.completed);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-calm-50">
        <ActivityIndicator size="large" color="#5b7c6a" />
      </View>
    );
  }

  if (!onboardingDone) {
    return <Redirect href="/(onboarding)/welcome" />;
  }
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }
  return <Redirect href="/(main)" />;
}
