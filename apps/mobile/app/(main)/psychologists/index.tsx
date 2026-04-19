import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PsychologistCard } from '~/components/care/PsychologistCard';
import { fetchPsychologistsDirectory } from '~/lib/careApi';
import { getApiErrorMessage } from '~/lib/errors';
import type { MobilePsychologistListItem } from '~/types/care';

export default function PsychologistsDirectoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<MobilePsychologistListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [spec, setSpec] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingSpec, setPendingSpec] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchPsychologistsDirectory({
        limit: 50,
        page: 1,
        search: pendingSearch.trim() || undefined,
        specialization: pendingSpec.trim() || undefined,
      });
      setItems(res.data ?? []);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pendingSearch, pendingSpec]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const applyFilters = () => {
    setPendingSearch(search);
    setPendingSpec(spec);
  };

  if (loading && !refreshing && items.length === 0 && !error) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 items-center justify-center" edges={['bottom']}>
        <ActivityIndicator size="large" color="#5b7c6a" />
        <Text className="text-calm-500 mt-3">Mutaxassislar yuklanmoqda…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-calm-50" edges={['bottom']}>
      <ScrollView
        className="flex-1 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor="#5b7c6a"
          />
        }
      >
        <Pressable onPress={() => router.push('/(main)/psychologists/bookings')} className="mb-4 self-start">
          <Text className="text-accent font-semibold">Mening bronlarim →</Text>
        </Pressable>

        <Text className="text-calm-600 leading-6 mb-4">
          Tasdiqlangan mutaxassislar ro‘yxati. Bron insoniy yordam uchun — bu yerda tashxis yoki davolash maslahati berilmaydi.
        </Text>

        <View className="gap-2 mb-4">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Ism yoki yo‘nalish bo‘yicha qidirish"
            placeholderTextColor="#8a9ba8"
            className="rounded-2xl border border-calm-200 bg-white px-4 py-3 text-calm-900"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={applyFilters}
          />
          <TextInput
            value={spec}
            onChangeText={setSpec}
            placeholder="Mutaxassislik filtri (ixtiyoriy)"
            placeholderTextColor="#8a9ba8"
            className="rounded-2xl border border-calm-200 bg-white px-4 py-3 text-calm-900"
            autoCapitalize="none"
            onSubmitEditing={applyFilters}
          />
          <Pressable onPress={applyFilters} className="rounded-2xl bg-calm-200 py-3 items-center">
            <Text className="text-calm-800 font-semibold">Qidiruvni qo‘llash</Text>
          </Pressable>
        </View>

        {error ? (
          <View className="mb-4">
            <Text className="text-red-700 mb-2">{error}</Text>
            <Pressable onPress={() => { setLoading(true); void load(); }} className="py-2">
              <Text className="text-accent font-semibold text-center">Qayta urinish</Text>
            </Pressable>
          </View>
        ) : null}

        {!error && items.length === 0 ? (
          <View className="rounded-3xl border border-dashed border-calm-300 p-8 items-center">
            <Text className="text-calm-600 text-center leading-6">
              Hozircha mos mutaxassis topilmadi. Filtrlarni o‘zgartirib ko‘ring.
            </Text>
          </View>
        ) : (
          items.map((p) => (
            <PsychologistCard key={p.id} psych={p} onPress={() => router.push(`/(main)/psychologists/${p.id}`)} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
