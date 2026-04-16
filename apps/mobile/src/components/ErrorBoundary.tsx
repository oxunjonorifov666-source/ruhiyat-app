import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import { startupLog } from '../utils/startupLog';

type Props = { children: ReactNode };

type State = { hasError: boolean; message: string };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err?.message || 'Noma’lum xato' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    startupLog(`ErrorBoundary: ${error.message}`, `${info.componentStack ?? ''}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <ScrollView contentContainerStyle={styles.inner}>
            <Text style={styles.title}>Kutilmagan xato</Text>
            <Text style={styles.sub}>
              Ilovani qayta ishga tushiring. Muammo takrorlansa, qo‘llab-quvvatlashga murojaat qiling.
            </Text>
            {__DEV__ ? <Text style={styles.dev}>{this.state.message}</Text> : null}
            <TouchableOpacity
              style={styles.btn}
              onPress={() => this.setState({ hasError: false, message: '' })}
              accessibilityRole="button"
            >
              <Text style={styles.btnText}>Qayta urinish</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: 24, paddingTop: 64 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  sub: { fontSize: 15, color: Colors.textSecondary, marginBottom: 16 },
  dev: { fontSize: 12, color: Colors.error, marginBottom: 16, fontFamily: 'monospace' },
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
