import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  Share,
  Linking as RNLinking,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { resolveMediaUrl } from '../../config';
import { profileMobileService, type DashboardStats } from '../../services/profileMobile';
import { useThemeStore } from '../../stores/themeStore';
import { useAccessibilityStore, FONT_SCALE_STEPS } from '../../stores/accessibilityStore';
import { ScreenStates } from '../../components/ScreenStates';
import { useAppPalette } from '../../theme/useAppPalette';
import type { AppPalette } from '../../constants/colors';

function createStyles(C: AppPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    profileHeader: {
      alignItems: 'center',
      paddingTop: 24,
      paddingBottom: 24,
      backgroundColor: C.surface,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    avatarLarge: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      shadowColor: C.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    avatarImg: {
      width: 90,
      height: 90,
      borderRadius: 45,
      marginBottom: 12,
      borderWidth: 3,
      borderColor: C.surface,
    },
    avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
    name: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
    phone: { fontSize: 14, color: C.textSecondary, marginBottom: 10 },
    roleBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 },
    roleText: { fontSize: 12, color: C.primary, fontWeight: '600' },
    statsRow: {
      flexDirection: 'row',
      margin: 16,
      backgroundColor: C.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '700', color: C.primary },
    statLabel: { fontSize: 10, color: C.textSecondary, marginTop: 2, textAlign: 'center' },
    statsHint: { fontSize: 10, color: C.textMuted, paddingHorizontal: 20, marginBottom: 8, lineHeight: 14 },
    menu: {
      marginHorizontal: 16,
      backgroundColor: C.surface,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: C.text },
    menuArrow: { fontSize: 18, color: C.textMuted },
    logoutBtn: {
      margin: 16,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.surface,
    },
    logoutText: { color: C.error, fontSize: 15, fontWeight: '700' },
    version: { textAlign: 'center', fontSize: 11, color: C.textMuted, marginBottom: 8 },
  });
}

export function ProfileScreen() {
  const C = useAppPalette();
  const styles = useMemo(() => createStyles(C), [C]);
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const fontScale = useAccessibilityStore((s) => s.fontScale);
  const setFontScale = useAccessibilityStore((s) => s.setFontScale);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsError(null);
    try {
      const s = await profileMobileService.getStats();
      setStats(s);
    } catch (e) {
      setStats(null);
      setStatsError(e instanceof Error ? e.message : 'Statistikani yuklab bo‘lmadi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadStats();
    }, [loadStats]),
  );

  const go = (name: string, params?: object) => {
    navigation.navigate(name as never, params as never);
  };

  const themeLabel =
    themeMode === 'system' ? 'Tizim' : themeMode === 'dark' ? 'Tun' : 'Kun';

  const pickTheme = () => {
    Alert.alert('Mavzu', 'Ko‘rinishni tanlang', [
      { text: 'Yorug‘ (kun)', onPress: () => setThemeMode('light') },
      { text: 'Qorong‘u (tun)', onPress: () => setThemeMode('dark') },
      { text: 'Tizim (avtomatik)', onPress: () => setThemeMode('system') },
      { text: 'Bekor', style: 'cancel' },
    ]);
  };

  const pickFontScale = () => {
    Alert.alert(
      'Matn hajmi',
      'Qulay o‘qish uchun',
      [
        ...FONT_SCALE_STEPS.map((s) => ({
          text: `${Math.round(s * 100)}%`,
          onPress: () => setFontScale(s),
        })),
        { text: 'Bekor', style: 'cancel' },
      ],
    );
  };

  const inviteFriend = async () => {
    try {
      const url = Linking.createURL('/');
      await Share.share({
        message: `Ruhiyat — psixologik salomatlik ilovasi. ${url}`,
      });
    } catch {
      /* bekor */
    }
  };

  const menuItems: { icon: string; label: string; color: string; onPress: () => void }[] = [
    { icon: '🔐', label: 'Maxfiylik markazi', color: '#0f766e', onPress: () => go('PrivacyCenter') },
    { icon: '🌓', label: `Mavzu (${themeLabel})`, color: '#64748b', onPress: pickTheme },
    { icon: '🔤', label: `Matn hajmi (${Math.round(fontScale * 100)}%)`, color: '#475569', onPress: pickFontScale },
    {
      icon: '⚙️',
      label: 'Tizim sozlamalari (katta shrift, VoiceOver)',
      color: '#64748b',
      onPress: () => RNLinking.openSettings().catch(() => {}),
    },
    { icon: '✉️', label: 'Do‘stni taklif qilish', color: '#2563eb', onPress: inviteFriend },
    { icon: '👤', label: "Shaxsiy ma'lumotlar", color: C.primary, onPress: () => go('ProfileSettings') },
    { icon: '🔔', label: 'Bildirishnomalar', color: '#f59e0b', onPress: () => go('NotificationSettings') },
    { icon: '📅', label: 'Mening seanslarim', color: '#0ea5e9', onPress: () => go('MySessions') },
    { icon: '🧠', label: 'Psixologik testlar', color: '#8b5cf6', onPress: () => go('Tests') },
    { icon: '📚', label: 'Test tarixi', color: '#7c3aed', onPress: () => go('TestHistory') },
    { icon: '📰', label: 'Maqolalar', color: '#0284c7', onPress: () => go('Articles') },
    { icon: '🫁', label: 'Nafas mashqlari', color: '#ec4899', onPress: () => go('Breathing') },
    { icon: '🎯', label: 'Odatlar', color: '#059669', onPress: () => go('Habits') },
    { icon: '😴', label: 'Uyqu', color: '#4f46e5', onPress: () => go('Sleep') },
    { icon: '📊', label: 'Haftalik kayfiyat', color: '#ea580c', onPress: () => go('MoodWeekly') },
    { icon: '🗓', label: 'Kalendar', color: '#0d9488', onPress: () => go('Calendar') },
    { icon: '🤖', label: 'AI Psixolog', color: '#a855f7', onPress: () => go('AiPsychologist') },
    { icon: '🆘', label: 'SOS', color: C.error, onPress: () => go('Sos') },
    { icon: '💬', label: 'Chat va xabarlar', color: '#10b981', onPress: () => go('Messages') },
    {
      icon: '🏆',
      label: 'Hamjamiyat',
      color: '#f97316',
      onPress: () => navigation.navigate('Main' as never, { screen: 'Ranking' } as never),
    },
    { icon: '📓', label: 'Kundalik (Diary)', color: '#6366f1', onPress: () => go('Diary') },
    { icon: '🔒', label: 'Xavfsizlik va parol', color: '#ef4444', onPress: () => go('ChangePassword') },
  ];

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Tizimdan chiqmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: logout },
    ]);
  };

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Foydalanuvchi' : '';
  const avatarUri = user?.avatarUrl ? resolveMediaUrl(user.avatarUrl) : '';

  return (
    <ScreenStates showOfflineBanner>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadStats();
            }}
          />
        }
      >
        <TouchableOpacity style={styles.profileHeader} activeOpacity={0.9} onPress={() => go('ProfileSettings')}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.phone}>{user?.phone || user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.isPremium ? '⭐ Premium' : '🌟 Ruhiyat a’zosi'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          {loading && !stats ? (
            <ActivityIndicator style={{ padding: 20 }} color={C.primary} />
          ) : statsError ? (
            <View style={{ flex: 1, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: C.error, textAlign: 'center', marginBottom: 8 }}>{statsError}</Text>
              <TouchableOpacity
                onPress={loadStats}
                style={{ backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Qayta urinish</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.sessions ?? 0}</Text>
                <Text style={styles.statLabel}>Sessiyalar</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.articles ?? 0}</Text>
                <Text style={styles.statLabel}>Maqolalar*</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.days ?? 0}</Text>
                <Text style={styles.statLabel}>Kunlar**</Text>
              </View>
            </>
          )}
        </View>
        <Text style={styles.statsHint}>
          *Saqlangan maqolalar · **Kayfiyat/kundalik bilan ketma-ket faol kunlar
        </Text>

        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Tizimdan chiqish</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Ruhiyat v1.0.0 · © 2026</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenStates>
  );
}
