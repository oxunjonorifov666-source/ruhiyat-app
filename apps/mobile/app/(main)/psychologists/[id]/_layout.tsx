import { Stack } from 'expo-router';

export default function PsychologistDetailLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Profil' }} />
      <Stack.Screen name="book" options={{ title: 'Bron qilish' }} />
    </Stack>
  );
}
