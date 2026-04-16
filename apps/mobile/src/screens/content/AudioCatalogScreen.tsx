import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { contentService, AudioContent } from '../../services/content';

export function AudioCatalogScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<AudioContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await contentService.getAudio();
      setItems(res?.data || []);
    } catch (e) {
      console.warn('AudioCatalog load', e);
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
      <View style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListEmptyComponent={
        <Text style={styles.empty}>Hozircha audio darslar yo'q. Superadmin ularni kiritgach, bu yerda ko'rinadi.</Text>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AudioPlayer', item)}
        >
          <Text style={styles.title}>{item.title}</Text>
          {item.duration != null ? (
            <Text style={styles.meta}>{Math.round(item.duration / 60)} daqiqa</Text>
          ) : null}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  meta: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  empty: { textAlign: 'center', color: Colors.textSecondary, marginTop: 48, paddingHorizontal: 24, lineHeight: 22 },
});
