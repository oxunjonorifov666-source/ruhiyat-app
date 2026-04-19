import { Stack } from 'expo-router';

export default function TestResultLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#f7f8f9' },
        headerTintColor: '#465058',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#f7f8f9' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Natija' }} />
      <Stack.Screen name="interpretation" options={{ title: 'Tushuntirish' }} />
      <Stack.Screen name="support" options={{ title: 'Hissiy yordam' }} />
    </Stack>
  );
}
