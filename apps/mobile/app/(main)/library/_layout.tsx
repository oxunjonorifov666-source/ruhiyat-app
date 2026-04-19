import { Stack } from 'expo-router';

export default function LibraryStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f7f8f9' },
      }}
    />
  );
}
