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

export function ProfileSettingsScreen({ navigation }: any) {
  const { user, logout, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      syncFromUser();
    }, [syncFromUser]),
  );

  const handleUpdate = async () => {
    if (!form.firstName?.trim()) {
      Alert.alert('Xatolik', 'Ism kiritishingiz shart');
      return;
    }

    setLoading(true);
    try {
      await authService.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName?.trim(),
        email: form.email?.trim() || undefined,
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Shaxsiy ma'lumotlar</Text>
          <TouchableOpacity onPress={handleUpdate} disabled={loading || uploading}>
            {loading ? <ActivityIndicator size="small" color={Colors.primary} /> : <Text style={styles.saveHeaderBtn}>Saqlash</Text>}
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
                <Text style={styles.label}>Ism</Text>
                <TextInput style={styles.input} value={form.firstName} onChangeText={(v) => setForm((p) => ({ ...p, firstName: v }))} />
              </View>
              <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Familiya</Text>
                <TextInput style={styles.input} value={form.lastName} onChangeText={(v) => setForm((p) => ({ ...p, lastName: v }))} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1.2, marginRight: 8 }]}>
                <Text style={styles.label}>Tug'ilgan sana (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={form.dateOfBirth}
                  onChangeText={(v) => setForm((p) => ({ ...p, dateOfBirth: v }))}
                  placeholder="1995-01-01"
                />
              </View>
              <View style={[styles.field, { flex: 0.8, marginLeft: 8 }]}>
                <Text style={styles.label}>Yoshi</Text>
                <View style={[styles.input, styles.disabledInput]}>
                  <Text style={{ color: Colors.text }}>{calculateAge(form.dateOfBirth)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Jinsi</Text>
              <View style={styles.genderRow}>
                {['Erkak', 'Ayol'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setForm((p) => ({ ...p, gender: g }))}
                    style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                  >
                    <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>O'zingiz haqingizda (bio)</Text>
              <TextInput
                style={[styles.input, { height: 100, paddingTop: 12 }]}
                value={form.bio}
                onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))}
                multiline
                placeholder="Qisqacha..."
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Telefon</Text>
              <View style={[styles.input, styles.disabledInput]}>
                <Text style={{ color: Colors.textMuted }}>{user?.phone || '—'}</Text>
              </View>
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

  logoutBtn: { marginTop: 20, padding: 18, alignItems: 'center', borderRadius: 18, borderWidth: 1.5, borderColor: '#fee2e2' },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },
});
