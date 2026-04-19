import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMyBookings } from '~/lib/careApi';
import { bookingStatusUz, paymentStatusUz } from '~/lib/bookingLabels';
import { getApiErrorMessage } from '~/lib/errors';
import { resolvePublicAssetUrl } from '~/lib/publicAsset';
import type { MyBookingRow } from '~/types/care';

function BookingCard({ row }: { row: MyBookingRow }) {
  const name = [row.psychologist.firstName, row.psychologist.lastName].filter(Boolean).join(' ');
  const uri = resolvePublicAssetUrl(row.psychologist.avatarUrl);
  const when = (() => {
    try {
      return new Date(row.scheduledAt).toLocaleString('uz-UZ', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return row.scheduledAt;
    }
  })();

  return (
    <View className="rounded-3xl bg-white border border-calm-200 p-4 mb-3">
      <View className="flex-row gap-3 mb-3">
        <View className="w-12 h-12 rounded-2xl bg-calm-200 overflow-hidden items-center justify-center">
          {uri ? (
            <Image source={{ uri }} className="w-full h-full" accessibilityIgnoresInvertColors />
          ) : (
            <Text className="text-calm-600 font-semibold">{row.psychologist.firstName?.[0] ?? '?'}</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-calm-900 font-semibold">{name}</Text>
          {row.psychologist.specialization ? (
            <Text className="text-calm-500 text-sm" numberOfLines={2}>
              {row.psychologist.specialization}
            </Text>
          ) : null}
        </View>
      </View>
      <Text className="text-calm-800 mb-1">{when}</Text>
      <Text className="text-calm-600 text-sm mb-1">
        Davomiylik: {row.duration} daq. · Narxi: {row.price.toLocaleString()} so‘m
      </Text>
      <View className="flex-row flex-wrap gap-2 mt-2">
        <View className="rounded-full bg-calm-100 px-3 py-1">
          <Text className="text-calm-800 text-sm font-medium">{bookingStatusUz(row.status)}</Text>
        </View>
        <View className="rounded-full bg-calm-50 border border-calm-200 px-3 py-1">
          <Text className="text-calm-700 text-sm">{paymentStatusUz(row.paymentStatus)}</Text>
        </View>
      </View>
      {row.notes ? (
        <Text className="text-calm-600 text-sm mt-2 italic" numberOfLines={3}>
          Izoh: {row.notes}
        </Text>
      ) : null}
    </View>
  );
}

export default function MyBookingsScreen() {
  const [rows, setRows] = useState<MyBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchMyBookings({ limit: 50, page: 1 });
      setRows(res.data ?? []);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && rows.length === 0 && !error) {
    return (
      <SafeAreaView className="flex-1 bg-calm-50 items-center justify-center" edges={['bottom']}>
        <ActivityIndicator size="large" color="#5b7c6a" />
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
        <Text className="text-calm-600 leading-6 mb-4">
          Statuslar mutaxassis yoki markaz tomonidan yangilanadi. Savollar uchun ilova ichidagi aloqadan foydalaning.
        </Text>
        {error ? (
          <View className="mb-4">
            <Text className="text-red-700 mb-2">{error}</Text>
            <Pressable onPress={() => { setLoading(true); void load(); }}>
              <Text className="text-accent font-semibold">Qayta urinish</Text>
            </Pressable>
          </View>
        ) : null}
        {!error && rows.length === 0 ? (
          <View className="rounded-3xl border border-dashed border-calm-300 p-8 items-center">
            <Text className="text-calm-600 text-center leading-6">Hozircha bronlar yo‘q.</Text>
          </View>
        ) : (
          rows.map((r) => <BookingCard key={r.id} row={r} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
