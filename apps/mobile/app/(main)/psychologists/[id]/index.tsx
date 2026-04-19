import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { PrimaryButton } from '~/components/PrimaryButton';
import { fetchPsychologistDetail } from '~/lib/careApi';
import { getApiErrorMessage } from '~/lib/errors';
import { resolvePublicAssetUrl } from '~/lib/publicAsset';
import type { MobilePsychologistDetail } from '~/types/care';

export default function PsychologistDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);
  const router = useRouter();
  const navigation = useNavigation();
  const [p, setP] = useState<MobilePsychologistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError('Noto‘g‘ri identifikator');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await fetchPsychologistDetail(id);
      setP(data);
      navigation.setOptions({
        title: [data.firstName, data.lastName].filter(Boolean).join(' ') || 'Mutaxassis',
      });
    } catch (e) {
      setError(getApiErrorMessage(e));
      setP(null);
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 items-center justify-center" edges={['bottom']}>
        <ActivityIndicator size="large" color="#5b7c6a" />
      </SafeAreaView>
    );
  }

  if (error || !p) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 px-5 justify-center" edges={['bottom']}>
        <Text className="text-calm-900 font-semibold mb-2">Yuklanmadi</Text>
        <Text className="text-calm-600 mb-4">{error}</Text>
        <PrimaryButton title="Qayta urinish" onPress={() => { setLoading(true); void load(); }} />
      </SafeAreaView>
    );
  }

  const uri = resolvePublicAssetUrl(p.avatarUrl);
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ');

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 36 }}>
        <View className="items-center mb-6">
          <View className="w-28 h-28 rounded-3xl bg-calm-200 overflow-hidden mb-3 items-center justify-center">
            {uri ? (
              <Image source={{ uri }} className="w-full h-full" accessibilityIgnoresInvertColors />
            ) : (
              <Text className="text-calm-600 font-bold text-3xl">{p.firstName?.[0] ?? '?'}</Text>
            )}
          </View>
          <Text className="text-2xl font-semibold text-calm-900 text-center">{name}</Text>
          {p.specialization ? (
            <Text className="text-accent font-medium text-center mt-1 px-2">{p.specialization}</Text>
          ) : null}
          {p.center?.name ? (
            <Text className="text-calm-500 text-sm mt-2 text-center">{p.center.name}</Text>
          ) : null}
        </View>

        <View className="rounded-3xl bg-white border border-calm-200 p-5 mb-4">
          {p.experienceYears != null ? (
            <Text className="text-calm-700 mb-2">Tajriba: {p.experienceYears} yil</Text>
          ) : null}
          {p.rating != null ? <Text className="text-calm-700 mb-2">Reyting: ★ {p.rating.toFixed(1)}</Text> : null}
          {p.sessionPrice != null ? (
            <Text className="text-calm-700 mb-2">Taxminiy narx: {p.sessionPrice.toLocaleString()} so‘m / soat</Text>
          ) : null}
          {p.education ? (
            <Text className="text-calm-800 leading-6 mb-2">
              <Text className="font-semibold">Ta’lim: </Text>
              {p.education}
            </Text>
          ) : null}
          {p.bio ? (
            <Text className="text-calm-800 leading-6 mb-2">
              <Text className="font-semibold">Haqida: </Text>
              {p.bio}
            </Text>
          ) : null}
          {p.certifications && p.certifications.length > 0 ? (
            <Text className="text-calm-800 leading-6">
              <Text className="font-semibold">Sertifikatlar: </Text>
              {p.certifications.join(', ')}
            </Text>
          ) : null}
        </View>

        {p.isAvailable === false ? (
          <Text className="text-amber-900 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            Bu mutaxassis hozirda yangi bronlarni qabul qilmayapti. Keyinroq urinib ko‘ring yoki boshqa mutaxassisni
            tanlang.
          </Text>
        ) : null}

        <PrimaryButton
          title="Bron qilish"
          disabled={p.isAvailable === false}
          onPress={() => router.push(`/(main)/psychologists/${id}/book`)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
