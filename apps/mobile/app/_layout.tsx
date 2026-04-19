/** Release entry: `package.json` → `"main": "expo-router/entry"` (Expo Router `app/` tree). */
import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { usePushRegistration } from '~/hooks/usePushRegistration';
import { useAuthStore } from '~/store/authStore';

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  usePushRegistration();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f7f8f9' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
        <Stack.Screen name="(settings)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
