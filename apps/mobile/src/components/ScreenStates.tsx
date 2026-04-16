import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';
import { useNetwork } from '../providers/NetworkProvider';

type Props = {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
  /** Tarmoq yo‘q bo‘lsa ustida banner */
  showOfflineBanner?: boolean;
};

/**
 * API ekranlari uchun yagona loading / error / empty / offline naqsh.
 */
export function ScreenStates({
  loading,
  error,
  empty,
  emptyMessage = "Ma'lumot yo'q",
  onRetry,
  children,
  showOfflineBanner = true,
}: Props) {
  const { isOnline } = useNetwork();

  if (loading) {
    return (
      <View style={styles.center} accessibilityLabel="Yuklanmoqda">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.muted}>Yuklanmoqda...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        {!isOnline && showOfflineBanner ? (
          <Text style={styles.offline}>Internet aloqasi yo‘q. Ulanishni tekshiring.</Text>
        ) : null}
        <Text style={styles.errTitle}>Xatolik</Text>
        <Text style={styles.errBody}>{error}</Text>
        {onRetry ? (
          <TouchableOpacity style={styles.btn} onPress={onRetry} accessibilityRole="button">
            <Text style={styles.btnText}>Qayta urinish</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{emptyMessage}</Text>
        {onRetry ? (
          <TouchableOpacity style={styles.btn} onPress={onRetry}>
            <Text style={styles.btnText}>Yangilash</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <>
      {!isOnline && showOfflineBanner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Offline: ma’lumotlar yangilanmasligi mumkin.</Text>
        </View>
      ) : null}
      {children ?? null}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  muted: { marginTop: 12, color: Colors.textMuted, fontSize: 14 },
  errTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  errBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  offline: { color: Colors.error, marginBottom: 12, textAlign: 'center', fontWeight: '600' },
  empty: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  btn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  banner: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bannerText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
