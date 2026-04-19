import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { ComplianceState } from '~/types/compliance';

type Props = {
  loading: boolean;
  error: string | null;
  state: ComplianceState | null;
  onRetry?: () => void;
};

function versionLine(label: string, active: string | null, accepted: string | null, acceptedAt: string | null) {
  const inSync = active != null && accepted != null && active.trim() === accepted.trim();
  return (
    <View className="mb-4">
      <Text className="text-calm-500 text-xs uppercase tracking-wide mb-1">{label}</Text>
      <Text className="text-calm-900 font-medium">
        Faol versiya: {active ?? '—'}
      </Text>
      <Text className="text-calm-800 mt-1">
        Siz qabul qilgan: {accepted ?? '—'}
      </Text>
      {acceptedAt ? (
        <Text className="text-calm-500 text-sm mt-1">
          Qabul vaqti: {new Date(acceptedAt).toLocaleString()}
        </Text>
      ) : null}
      <View className="mt-2 rounded-xl px-3 py-2 self-start bg-calm-100 border border-calm-200">
        <Text className={`text-sm font-medium ${inSync ? 'text-emerald-800' : 'text-amber-900'}`}>
          {inSync ? 'Hozirgi faol versiyalar bilan mos' : 'Yangi versiya chiqqanda qayta tasdiqlash talab qilinishi mumkin'}
        </Text>
      </View>
    </View>
  );
}

export function ComplianceSummary({ loading, error, state, onRetry }: Props) {
  if (loading && !state) {
    return (
      <View className="py-8 items-center">
        <ActivityIndicator color="#5b7c6a" />
        <Text className="text-calm-500 mt-3 text-sm">Moslik holati yuklanmoqda…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-4">
        <Text className="text-red-900 text-sm leading-5 mb-2">{error}</Text>
        {onRetry ? (
          <Pressable onPress={onRetry} accessibilityRole="button">
            <Text className="text-accent font-semibold text-sm">Qayta urinish</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (!state) {
    return (
      <Text className="text-calm-600 mb-4">Ma’lumot yo‘q.</Text>
    );
  }

  const pendingDeletion = state.accountLifecycle === 'PENDING_DELETION';
  const deleted = state.accountLifecycle === 'DELETED';

  return (
    <View className="rounded-3xl bg-white border border-calm-200 p-5 mb-4">
      <Text className="text-lg font-semibold text-calm-900 mb-1">Huquqiy holat</Text>
      <Text className="text-calm-600 text-sm leading-5 mb-4">
        Quyidagi ma’lumotlar serverdan olinadi — mahalliy “saqlangan” holat emas.
      </Text>

      {versionLine('Foydalanish shartlari', state.activeTermsVersion, state.acceptedTermsVersion, state.termsAcceptedAt)}
      {versionLine('Maxfiylik siyosati', state.activePrivacyVersion, state.acceptedPrivacyVersion, state.privacyAcceptedAt)}

      <View className="border-t border-calm-200 pt-4 mt-2">
        <Text className="text-calm-500 text-xs uppercase tracking-wide mb-2">Hisob holati</Text>
        {deleted ? (
          <Text className="text-calm-800 leading-6">Hisob o‘chirilgan deb belgilangan.</Text>
        ) : pendingDeletion ? (
          <>
            <Text className="text-amber-900 font-medium mb-2">Hisobni o‘chirish kutilmoqda</Text>
            {state.deletionRequestedAt ? (
              <Text className="text-calm-800 text-sm mb-1">
                So‘rov vaqti: {new Date(state.deletionRequestedAt).toLocaleString()}
              </Text>
            ) : null}
            {state.scheduledDeletionAt ? (
              <Text className="text-calm-800 text-sm mb-2">
                Rejalashtirilgan o‘chirish: {new Date(state.scheduledDeletionAt).toLocaleString()}
              </Text>
            ) : null}
            <Text className="text-calm-600 text-sm leading-5">
              Bekor qilish muddati: so‘rovdan keyin taxminan {state.deletionGraceDays} kun ichida bekor qilish mumkin
              (server sozlamalariga bog‘liq).
            </Text>
          </>
        ) : (
          <Text className="text-calm-800">Hisob faol.</Text>
        )}
      </View>
    </View>
  );
}
