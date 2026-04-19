import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '~/store/authStore';

/**
 * Shown when the server reports scheduled account deletion (honest UX — account is not “fully active”).
 */
export function AccountDeletionBanner() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  if (user?.role !== 'MOBILE_USER') return null;
  if (user.accountLifecycle !== 'PENDING_DELETION') return null;

  return (
    <View className="border-b border-amber-300 bg-amber-50 px-4 py-3">
      <Text className="text-amber-950 text-sm font-semibold mb-1">Hisob o‘chirish rejalashtirilgan</Text>
      <Text className="text-amber-900 text-xs leading-5 mb-2">
        Ayrim amallar cheklanishi mumkin. Bekor qilish yoki batafsil ma’lumot uchun oching.
      </Text>
      <Pressable
        onPress={() => router.push('/(settings)/delete-account')}
        accessibilityRole="button"
        className="self-start"
      >
        <Text className="text-accent font-semibold text-sm">Hisob holati →</Text>
      </Pressable>
    </View>
  );
}
