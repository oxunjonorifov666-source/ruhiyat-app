import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { radius, typography } from '../../theme/tokens';

type Props = {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { ...typography.title, color: Colors.text, textAlign: 'center' },
  desc: { ...typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  btn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
