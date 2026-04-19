import { Stack } from 'expo-router';

export default function SettingsLayout() {
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
      <Stack.Screen name="premium" options={{ title: 'Ruhiyat Premium', headerBackTitle: 'Orqaga' }} />
      <Stack.Screen name="compliance" options={{ title: 'Maxfiylik va moslik', headerBackTitle: 'Orqaga' }} />
      <Stack.Screen name="delete-account" options={{ title: 'Hisobni o‘chirish', headerBackTitle: 'Orqaga' }} />
    </Stack>
  );
}
