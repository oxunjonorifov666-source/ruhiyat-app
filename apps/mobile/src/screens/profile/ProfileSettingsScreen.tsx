import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { resolveMediaUrl } from '../../config';
import { profileMobileService } from '../../services/profileMobile';
import { normalizeUzbekPhone, isValidUzbekMobile } from '../../lib/phone';
import { useAppPalette } from '../../theme/useAppPalette';

export function ProfileSettingsScreen({ navigation }: any) {
  const { user, logout, refreshProfile } = useAuth();
  const C = useAppPalette();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    bio: '',
  });

  const syncFromUser = useCallback(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      bio: user.bio || '',
    });
    setPhoneDraft(user.phone || '');
    setPhoneOtpSent(false);
    setPhoneOtp('');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      syncFromUser();
    }, [syncFromUser]),
  );

  const handleUpdate = async () => {
    setFieldErrors({});
    if (!form.firstName?.trim()) {
      setFieldErrors({ firstName: 'Ism kiritishingiz shart' });
      return;
    }
    const em = form.email?.trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setFieldErrors({ email: 'Email formati noto‘g‘ri' });
      return;
    }

    setLoading(true);
    try {
      await authService.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName?.trim(),
        email: em || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        bio: form.bio?.trim() || undefined,
      });
      await refreshProfile();
      Alert.alert('Muvaffaqiyat', "Profil ma'lumotlari saqlandi.");
    } catch (e: unknown) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Saqlashda xato');
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneChangeOtp = async () => {
    const p = normalizeUzbekPhone(phoneDraft.trim());
    if (!isValidUzbekMobile(p)) {
      Alert.alert('Telefon', '+998901234567 ko‘rinishida to‘g‘ri raqam kiriting');
      return;
    }
    setPhoneBusy(true);
    try {
      await authService.requestProfilePhoneChange(p);
      setPhoneOtpSent(true);
      Alert.alert('Kod yuborildi', 'Yangi raqamga SMS orqali 6 raqamli kod yuborildi (5 daqiqa).');
    } catch (e: unknown) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Yuborilmadi');
    } finally {
      setPhoneBusy(false);
    }
  };

  const confirmPhoneChange = async () => {
    const p = normalizeUzbekPhone(phoneDraft.trim());
    if (!/^\d{6}$/.test(phoneOtp.trim())) {
      Alert.alert('Kod', '6 raqamli kodni kiriting');
      return;
    }
    setPhoneBusy(true);
    try {
      await authService.confirmProfilePhoneChange(p, phoneOtp.trim());
      await refreshProfile();
      setPhoneOtpSent(false);
      setPhoneOtp('');
      Alert.alert('Muvaffaqiyat', 'Telefon raqam yangilandi.');
    } catch (e: unknown) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Tasdiqlanmadi');
    } finally {
      setPhoneBusy(false);
    }
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Ruxsat', 'Galereyaga ruxsat kerak.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setUploading(true);
    try {
      const u = await profileMobileService.uploadAvatar(
        asset.uri,
        asset.mimeType || 'image/jpeg',
        asset.fileName || 'avatar.jpg',
      );
      if (u) {
        await refreshProfile();
        Alert.alert('Rasm', 'Profil rasmi yangilandi.');
      }
    } catch (e: unknown) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : 'Yuklashda xato');
    } finally {
      setUploading(false);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age > 0 ? `${age} yosh` : '';
    } catch {
      return '';
    }
  };

  const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Foydalanuvchi';
  const resolved = user?.avatarUrl ? resolveMediaUrl(user.avatarUrl) : '';
  const avatarSource = resolved
    ? { uri: resolved }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff` };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: C.surface }]}>
            <Text style={[styles.backIcon, { color: C.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Shaxsiy ma'lumotlar</Text>
          <TouchableOpacity onPress={handleUpdate} disabled={loading || uploading}>
            {loading ? <ActivityIndicator size="small" color={C.primary} /> : <Text style={[styles.saveHeaderBtn, { color: C.primary }]}>Saqlash</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image source={avatarSource} style={styles.avatar} />
              <TouchableOpacity style={styles.editBadge} onPress={pickAvatar} disabled={uploading}>
                {uploading ? <ActivityIndicator size="small" /> : <Text style={{ fontSize: 16 }}>📸</Text>}
              </TouchableOpacity>
            </View>
            <Text style={styles.mainName}>{displayName}</Text>
            <Text style={styles.mainSubtitle}>{userLevelText(user)}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: C.text }]}>Ism</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.surface, borderColor: fieldErrors.firstName ? Colors.error : C.border, color: C.text }]}
                  value={form.firstName}
                  onChangeText={(v) => setForm((p) => ({ ...p, firstName: v }))}
                  placeholder="Ismingiz"
                  placeholderTextColor={C.textMuted}
                />
                {fieldErrors.firstName ? <Text style={styles.errText}>{fieldErrors.firstName}</Text> : null}
              </View>
              <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: C.text }]}>Familiya</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                  value={form.lastName}
                  onChangeText={(v) => setForm((p) => ({ ...p, lastName: v }))}
                  placeholder="Familiya"
                  placeholderTextColor={C.textMuted}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: C.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: C.surface, borderColor: fieldErrors.email ? Colors.error : C.border, color: C.text }]}
                value={form.email}
                onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
              />
              {fieldErrors.email ? <Text style={styles.errText}>{fieldErrors.email}</Text> : null}
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1.2, marginRight: 8 }]}>
                <Text style={[styles.label, { color: C.text }]}>Tug'ilgan sana (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                  value={form.dateOfBirth}
                  onChangeText={(v) => setForm((p) => ({ ...p, dateOfBirth: v }))}
                  placeholder="1995-01-01"
                  placeholderTextColor={C.textMuted}
                />
              </View>
              <View style={[styles.field, { flex: 0.8, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: C.text }]}>Yoshi</Text>
                <View style={[styles.input, styles.disabledInput, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <Text style={{ color: C.text }}>{calculateAge(form.dateOfBirth)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: C.text }]}>Jinsi</Text>
              <View style={styles.genderRow}>
                {['Erkak', 'Ayol'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setForm((p) => ({ ...p, gender: g }))}
                    style={[
                      styles.genderBtn,
                      { backgroundColor: C.surface, borderColor: C.border },
                      form.gender === g && { backgroundColor: C.primaryLight, borderColor: C.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        { color: C.textSecondary },
                        form.gender === g && { color: C.primary, fontWeight: '800' },
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: C.text }]}>O'zingiz haqingizda (bio)</Text>
              <TextInput
                style={[styles.input, { height: 100, paddingTop: 12, backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                value={form.bio}
                onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))}
                multiline
                placeholder="Qisqacha..."
                placeholderTextColor={C.textMuted}
                textAlignVertical="top"
              />
            </View>

            <View style={[styles.field, { gap: 10 }]}>
              <Text style={[styles.label, { color: C.text }]}>Telefon raqam</Text>
              <Text style={{ color: C.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 4 }}>
                Raqamni o‘zgartirish uchun yangi raqam kiriting va SMS kodini tasdiqlang.
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                value={phoneDraft}
                onChangeText={setPhoneDraft}
                keyboardType="phone-pad"
                placeholder="+998 90 123 45 67"
                placeholderTextColor={C.textMuted}
                editable={!phoneBusy}
              />
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: C.primary, opacity: phoneBusy ? 0.6 : 1 }]}
                  onPress={sendPhoneChangeOtp}
                  disabled={phoneBusy}
                >
                  <Text style={[styles.secondaryBtnText, { color: C.primary }]}>Kod yuborish</Text>
                </TouchableOpacity>
                {phoneOtpSent ? (
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: Colors.success, flex: 1, minWidth: 120 }]}
                    onPress={confirmPhoneChange}
                    disabled={phoneBusy}
                  >
                    <Text style={[styles.secondaryBtnText, { color: Colors.success }]}>Tasdiqlash</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {phoneOtpSent ? (
                <TextInput
                  style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                  value={phoneOtp}
                  onChangeText={setPhoneOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="6 raqamli kod"
                  placeholderTextColor={C.textMuted}
                />
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() =>
                Alert.alert('Chiqish', 'Haqiqatan ham chiqmoqchimisiz?', [
                  { text: 'Yo‘q' },
                  { text: 'Ha', onPress: logout, style: 'destructive' },
                ])
              }
            >
              <Text style={styles.logoutText}>Tizimdan chiqish</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function userLevelText(user: { isPremium?: boolean } | null) {
  if (user?.isPremium) return "🌟 Premium a'zo";
  return '🍃 Ruhiyat foydalanuvchisi';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 32, color: Colors.text, bottom: 2 },
  title: { fontSize: 17, fontWeight: '800', color: Colors.text, flex: 1, textAlign: 'center' },
  saveHeaderBtn: { color: Colors.primary, fontWeight: '800', fontSize: 16 },

  scroll: { paddingVertical: 30 },
  avatarSection: { alignItems: 'center', marginBottom: 40 },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 55, borderWidth: 4, borderColor: '#fff' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowOpacity: 0.1,
  },
  mainName: { fontSize: 24, fontWeight: '800', color: Colors.text, marginTop: 15 },
  mainSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

  form: { paddingHorizontal: 28, gap: 20 },
  row: { flexDirection: 'row' },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text, marginLeft: 4 },
  input: {
    minHeight: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
  },
  disabledInput: { backgroundColor: '#f1f5f9' },

  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  genderBtnActive: { backgroundColor: Colors.primary + '10', borderColor: Colors.primary },
  genderText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  genderTextActive: { color: Colors.primary, fontWeight: '800' },

  errText: { color: Colors.error, fontSize: 12, fontWeight: '600', marginTop: 4, marginLeft: 4 },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontWeight: '800', fontSize: 14 },

  logoutBtn: { marginTop: 20, padding: 18, alignItems: 'center', borderRadius: 18, borderWidth: 1.5, borderColor: '#fee2e2' },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },
});
