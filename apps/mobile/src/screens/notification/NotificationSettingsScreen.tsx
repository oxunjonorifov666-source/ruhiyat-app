import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { mobileAppService, type NotificationPrefsPayload } from '../../services/mobileApp';

type Prefs = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  remindersEnabled: boolean;
  marketingEnabled: boolean;
  moodReminder: boolean;
  sessionReminder: boolean;
};

const defaultPrefs: Prefs = {
  pushEnabled: true,
  emailEnabled: true,
  remindersEnabled: true,
  marketingEnabled: false,
  moodReminder: true,
  sessionReminder: true,
};

function mergeFromDb(raw: unknown): Prefs {
  if (!raw || typeof raw !== 'object') return { ...defaultPrefs };
  const o = raw as Record<string, unknown>;
  return {
    pushEnabled: typeof o.pushEnabled === 'boolean' ? o.pushEnabled : defaultPrefs.pushEnabled,
    emailEnabled: typeof o.emailEnabled === 'boolean' ? o.emailEnabled : defaultPrefs.emailEnabled,
    remindersEnabled: typeof o.remindersEnabled === 'boolean' ? o.remindersEnabled : defaultPrefs.remindersEnabled,
    marketingEnabled: typeof o.marketingEnabled === 'boolean' ? o.marketingEnabled : defaultPrefs.marketingEnabled,
    moodReminder: typeof o.moodReminder === 'boolean' ? o.moodReminder : defaultPrefs.moodReminder,
    sessionReminder: typeof o.sessionReminder === 'boolean' ? o.sessionReminder : defaultPrefs.sessionReminder,
  };
}

export function NotificationSettingsScreen({ navigation }: any) {
  const { user, refreshProfile } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrefs(mergeFromDb(user?.notificationPrefs));
  }, [user?.notificationPrefs]);

  const persist = useCallback(
    async (next: Prefs) => {
      setPrefs(next);
      setSaving(true);
      try {
        const payload: NotificationPrefsPayload = { ...next };
        await mobileAppService.patchPreferences({ notificationPrefs: payload });
        await refreshProfile();
      } finally {
        setSaving(false);
      }
    },
    [refreshProfile],
  );

  const row = (label: string, desc: string, key: keyof Prefs) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={prefs[key]}
        onValueChange={(v) => persist({ ...prefs, [key]: v })}
        trackColor={{ false: '#e2e8f0', true: Colors.primaryLight }}
        thumbColor={prefs[key] ? Colors.primary : '#f4f4f5'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bildirishnoma sozlamalari</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.intro}>
          Sozlamalar PostgreSQL `mobile_users.notification_prefs` maydonida saqlanadi (real baza). Push token
          `mobile_push_devices` jadvaliga yoziladi.
        </Text>
        {saving ? <ActivityIndicator color={Colors.primary} style={{ marginBottom: 12 }} /> : null}
        {row('Push-bildirishnomalar', 'Tizim orqali push', 'pushEnabled')}
        {row('Email', 'Muhim xabarlar', 'emailEnabled')}
        {row('Eslatmalar', 'Umumiy eslatmalar', 'remindersEnabled')}
        {row('Kayfiyat eslatmasi', 'Kunlik eslatma (server tomonida rejalashtirish keyingi bosqich)', 'moodReminder')}
        {row('Seans eslatmasi', 'Uchrashuvdan oldin', 'sessionReminder')}
        {row('Marketing', 'Aksiya va yangiliklar', 'marketingEnabled')}

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.linkText}>Barcha bildirishnomalar →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 32, color: Colors.text, bottom: 2 },
  title: { fontSize: 17, fontWeight: '800', color: Colors.text, flex: 1, textAlign: 'center' },
  body: { padding: 16, paddingBottom: 40 },
  intro: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  rowTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  rowDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  link: { marginTop: 24, padding: 16, backgroundColor: Colors.primaryLight + '50', borderRadius: 14 },
  linkText: { fontSize: 15, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
});
