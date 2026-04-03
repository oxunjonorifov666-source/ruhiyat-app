import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { icon: '\u{1F464}', label: 'Profil ma\'lumotlari', screen: 'ProfileDetails' },
  { icon: '\u{2699}\u{FE0F}', label: 'Sozlamalar', screen: 'Settings' },
  { icon: '\u{1F512}', label: 'Xavfsizlik', screen: 'Security' },
  { icon: '\u{1F4CA}', label: 'Faollik tarixi', screen: 'ActivityHistory' },
  { icon: '\u{1F514}', label: 'Bildirishnomalar', screen: 'Notifications' },
  { icon: '\\u{1F4E2}', label: 'E\'lonlar', screen: 'Announcements' },
  { icon: '\u{1F6CD}\u{FE0F}', label: 'Xizmatlar', screen: 'Services' },
  { icon: '\u{2B50}', label: 'Premium', screen: 'Premium' },
  { icon: '\\u{1F4B3}', label: 'To\'lovlar', screen: 'Payments' },
  { icon: '\u{2753}', label: 'Yordam', screen: 'Help' },
];

function getInitials(firstName?: string | null, lastName?: string | null) {
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase();
  }
  return 'FM';
}

export function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Hisobingizdan chiqishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Chiqish',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  };

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : 'Foydalanuvchi';

  const displayPhone = user?.phone || user?.email || '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.firstName, user?.lastName)}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.phone}>{displayPhone}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Kun</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Seanslar</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Testlar</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>{'\u{203A}'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>{'\u{1F6AA}'} Chiqish</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, paddingBottom: 32 },
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.light.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: Colors.light.primary },
  name: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text, marginTop: 12 },
  phone: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.light.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: Colors.light.border },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: Colors.light.primary },
  statLabel: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 4 },
  menu: { backgroundColor: Colors.light.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.light.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.light.text },
  menuArrow: { fontSize: 20, color: Colors.light.textSecondary },
  logoutButton: { marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: '#FEF2F2', alignItems: 'center' },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.light.error },
});
