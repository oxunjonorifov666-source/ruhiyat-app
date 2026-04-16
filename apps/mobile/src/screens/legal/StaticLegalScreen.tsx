import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppPalette } from '../../theme/useAppPalette';
import { LEGAL_DOCS, type LegalDocId } from '../../content/legalDocs';

type Props = { route?: { params?: { doc?: LegalDocId } } };

export function StaticLegalScreen({ route }: Props) {
  const C = useAppPalette();
  const id = route?.params?.doc ?? 'help';
  const doc = LEGAL_DOCS[id] ?? LEGAL_DOCS.help;
  return (
    <ScrollView style={[styles.wrap, { backgroundColor: C.background }]} contentContainerStyle={styles.inner}>
      <Text style={[styles.title, { color: C.text }]}>{doc.title}</Text>
      <Text style={[styles.body, { color: C.textSecondary }]}>{doc.body}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  inner: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  body: { fontSize: 15, lineHeight: 24 },
});
