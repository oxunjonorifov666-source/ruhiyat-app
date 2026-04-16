import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors } from '../../constants/colors';
import { mobileAppService, type AppMetadata } from '../../services/mobileApp';
import { radius, typography } from '../../theme/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { clearTelemetry } from '../../services/telemetry';

export function PrivacyCenterScreen() {
  const navigation = useNavigation<any>();
  const { user, refreshProfile } = useAuth();
  const [meta, setMeta] = useState<AppMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(!!user?.analyticsOptIn);
  const [biometric, setBiometric] = useState(!!user?.biometricEnabled);

  useEffect(() => {
    setAnalytics(!!user?.analyticsOptIn);
  }, [user?.analyticsOptIn]);

  useEffect(() => {
    setBiometric(!!user?.biometricEnabled);
  }, [user?.biometricEnabled]);

  const toggleAnalytics = useCallback(
    async (v: boolean) => {
      setAnalytics(v);
      try {
        await mobileAppService.patchPreferences({ analyticsOptIn: v });
        await refreshProfile();
        if (!v) void clearTelemetry();
      } catch {
        setAnalytics(!v);
      }
    },
    [refreshProfile],
  );

  const toggleBiometric = useCallback(
    async (v: boolean) => {
      if (v) {
        const has = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!has || !enrolled) {
          Alert.alert(
            'Mavjud emas',
            'Qurilmada biometrik autentifikatsiya yo‘q yoki sozlanmagan.',
          );
          return;
        }
      }
      setBiometric(v);
      try {
        await mobileAppService.patchPreferences({ biometricEnabled: v });
        await refreshProfile();
      } catch {
        setBiometric(!v);
      }
    },
    [refreshProfile],
  );

  useEffect(() => {
    mobileAppService
      .getAppMetadata()
      .then(setMeta)
      .catch(() => setMeta(null))
      .finally(() => setLoading(false));
  }, []);

  const openUrl = async (label: string, url?: string | null, fallbackDoc?: 'privacy' | 'terms' | 'help') => {
    if (!url?.trim()) {
      if (fallbackDoc) {
        navigation.navigate('LegalDocument', { doc: fallbackDoc });
        return;
      }
      Alert.alert(label, 'Superadmin panelida URL hali kiritilmagan — ilova ichidagi matnni ochamiz.');
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Linking.openURL(url).catch(() => (fallbackDoc ? navigation.navigate('LegalDocument', { doc: fallbackDoc }) : Alert.alert('Xatolik', 'Havola ochilmadi')));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Maxfiylik va ma’lumot</Text>
      <Text style={styles.intro}>
        Quyidagi havolalar va aloqa Superadmin tomonidan mobile_app_settings jadvalidagi haqiqiy qiymatlardan olinadi.
      </Text>

      <TouchableOpacity style={styles.row} onPress={() => openUrl('Maxfiylik', meta?.privacyPolicyUrl, 'privacy')}>
        <Text style={styles.rowTitle}>Maxfiylik siyosati</Text>
        <Text style={styles.rowHint}>{meta?.privacyPolicyUrl || 'Ilova ichidagi matn'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={() => openUrl('Shartlar', meta?.termsOfServiceUrl, 'terms')}>
        <Text style={styles.rowTitle}>Foydalanish shartlari</Text>
        <Text style={styles.rowHint}>{meta?.termsOfServiceUrl || 'Ilova ichidagi matn'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={() => openUrl('Yordam', meta?.helpCenterUrl, 'help')}>
        <Text style={styles.rowTitle}>Yordam markazi</Text>
        <Text style={styles.rowHint}>{meta?.helpCenterUrl || 'Ilova ichidagi matn'}</Text>
      </TouchableOpacity>

      {meta?.supportEmail ? (
        <TouchableOpacity
          style={styles.row}
          onPress={() => Linking.openURL(`mailto:${meta.supportEmail}`)}
        >
          <Text style={styles.rowTitle}>Qo‘llab-quvvatlash</Text>
          <Text style={styles.rowHint}>{meta.supportEmail}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.rowSwitch}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Anonim statistika</Text>
          <Text style={styles.rowHint}>Ruxsat `mobile_users.analytics_opt_in` ustunida saqlanadi.</Text>
        </View>
        <Switch value={analytics} onValueChange={toggleAnalytics} />
      </View>

      <View style={styles.rowSwitch}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Biometrik qulf</Text>
          <Text style={styles.rowHint}>Face ID / barmoq izi — `mobile_users.biometric_enabled`.</Text>
        </View>
        <Switch value={biometric} onValueChange={toggleBiometric} />
      </View>

      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('AppPinSettings')}>
        <Text style={styles.rowTitle}>Ilova PIN qulfi</Text>
        <Text style={styles.rowHint}>Har safar ilovani ochganda PIN — hisob parolingizdan alohida, bu yerda yoqiladi yoki o‘chiriladi.</Text>
      </TouchableOpacity>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>SOS signallar</Text>
        <Text style={styles.boxText}>
          Har bir SOS yozuvi sos_alerts jadvaliga yoziladi va mas’ullarga bildirishnoma yuboriladi.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.title, color: Colors.text, marginBottom: 8 },
  intro: { ...typography.caption, color: Colors.textSecondary, marginBottom: 20, lineHeight: 18 },
  row: {
    backgroundColor: Colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  rowHint: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  box: {
    marginTop: 16,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: Colors.primaryLight,
  },
  boxTitle: { fontWeight: '800', color: Colors.primaryDark, marginBottom: 6 },
  boxText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  rowSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
