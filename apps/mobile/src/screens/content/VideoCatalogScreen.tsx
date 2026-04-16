import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { contentService, VideoContent } from '../../services/content';
import { resolveMediaUrl } from '../../config';
import { useAppPalette } from '../../theme/useAppPalette';

function formatDurationLabel(seconds: number | null | undefined): string | null {
  if (seconds == null || Number.isNaN(seconds)) return null;
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} sek`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h} soat ${mm} daq`;
  }
  if (r === 0) return `${m} daqiqa`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function VideoCatalogScreen() {
  const C = useAppPalette();
  const [items, setItems] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await contentService.getVideos();
      setItems(res?.data || []);
    } catch (e) {
      console.warn('VideoCatalog load', e);
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
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={[styles.list, { backgroundColor: C.background }]}
      data={items}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={C.primary}
        />
      }
      ListEmptyComponent={
        <Text style={[styles.empty, { color: C.textSecondary }]}>
          Hozircha videolar yo'q. Superadmin videokutubxonaga qo'shgach, bu yerda ko'rinadi.
        </Text>
      }
      renderItem={({ item }) => {
        const thumbUri = item.thumbnailUrl ? resolveMediaUrl(item.thumbnailUrl) : null;
        const durationLabel = formatDurationLabel(item.duration ?? undefined);
        return (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
            activeOpacity={0.9}
            onPress={() => {
              const u = resolveMediaUrl(item.fileUrl);
              if (u) Linking.openURL(u).catch(() => {});
            }}
          >
            <View style={styles.thumbWrap}>
              {thumbUri ? (
                <Image source={{ uri: thumbUri }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: C.primaryLight }]}>
                  <MaterialCommunityIcons name="play-circle" size={52} color={C.primary} />
                </View>
              )}
              <View style={styles.thumbOverlay} pointerEvents="none" />
              <View style={[styles.playFab, { backgroundColor: 'rgba(37,99,235,0.92)' }]}>
                <MaterialCommunityIcons name="play" size={28} color="#fff" />
              </View>
              {durationLabel ? (
                <View style={[styles.durationBadge, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.durationText}>{durationLabel}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.footerRow}>
                <MaterialCommunityIcons name="play-circle-outline" size={16} color={C.primary} />
                <Text style={[styles.hint, { color: C.textMuted }]}>Tomosha qilish uchun bosing</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40, gap: 0 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.12)',
  },
  playFab: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -32,
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  durationBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cardBody: { padding: 14 },
  title: { fontSize: 16, fontWeight: '800', lineHeight: 22 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  hint: { fontSize: 12, fontWeight: '600', flex: 1 },
  empty: { textAlign: 'center', marginTop: 48, paddingHorizontal: 24, lineHeight: 22, fontSize: 14 },
});
