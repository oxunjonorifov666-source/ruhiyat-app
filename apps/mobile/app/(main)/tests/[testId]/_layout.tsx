import { Stack } from 'expo-router';

export default function SingleTestLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Test' }} />
      <Stack.Screen name="take" options={{ title: 'Savollar' }} />
    </Stack>
  );
}
