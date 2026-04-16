import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppPalette } from '../../theme/useAppPalette';
import { contentService, Training } from '../../services/content';
import { resolveMediaUrl } from '../../config';
import { ScreenStates } from '../../components/ScreenStates';

export function TrainingsScreen() {
  const C = useAppPalette();
  const [items, setItems] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await contentService.getTrainings();
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yuklanmadi');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <ScreenStates loading />;
  }
  if (error && !items.length) {
    return <ScreenStates error={error} onRetry={load} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
        ListEmptyComponent={
          <ScreenStates empty emptyMessage="Treninglar hozircha yo‘q. Superadmin chop etgach, bu yerda ko‘rinadi." />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
            activeOpacity={0.88}
            onPress={() => {
              const u = item.videoUrl ? resolveMediaUrl(item.videoUrl) : null;
              if (u) Linking.openURL(u).catch(() => {});
            }}
          >
            {item.imageUrl ? (
              <Image source={{ uri: resolveMediaUrl(item.imageUrl) || undefined }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPh, { backgroundColor: C.primaryLight }]}>
                <MaterialCommunityIcons name="school-outline" size={40} color={C.primary} />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              {item.description ? (
                <Text style={[styles.desc, { color: C.textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              {item.duration ? (
                <Text style={[styles.meta, { color: C.textMuted }]}>{item.duration} daq.</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  thumb: { width: 100, height: 100 },
  thumbPh: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, padding: 12, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800' },
  desc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  meta: { fontSize: 12, marginTop: 6 },
});
