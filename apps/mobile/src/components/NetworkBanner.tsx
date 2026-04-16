import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetwork } from '../providers/NetworkProvider';
import { Colors } from '../constants/colors';

export function NetworkBanner() {
  const { isOnline } = useNetwork();
  if (isOnline) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>Internet yo‘q. Ba’zi ma’lumotlar keshdan ko‘rinadi.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.warning + '33',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning,
  },
  text: { color: Colors.text, fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
