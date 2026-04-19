import { Stack } from 'expo-router';

export default function PsychologistsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Mutaxassislar' }} />
      <Stack.Screen name="bookings" options={{ title: 'Mening bronlarim' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
