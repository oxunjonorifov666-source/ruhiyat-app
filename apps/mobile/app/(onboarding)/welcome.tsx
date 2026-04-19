import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '~/components/Screen';
import { PrimaryButton } from '~/components/PrimaryButton';

export default function WelcomeScreen() {
  return (
    <Screen scroll={false} title="Ruhiyat" subtitle="Ruhiy salomatlik va o‘z-o‘zini rivojlantirish yo‘lida yordamchingiz.">
      <View className="flex-1 justify-end pb-8">
        <Link href="/(onboarding)/terms" asChild>
          <PrimaryButton title="Boshlash" />
        </Link>
      </View>
    </Screen>
  );
}
