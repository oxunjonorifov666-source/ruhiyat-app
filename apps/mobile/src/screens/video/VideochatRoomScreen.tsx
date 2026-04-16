import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { videochatService } from '../../services/videochat';
import { ScreenStates } from '../../components/ScreenStates';

export function VideochatRoomScreen({ route, navigation }: any) {
  const { sessionId } = route.params as { sessionId: number };
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUrl(null);
    try {
      const res = await videochatService.getJoinToken(sessionId);
      setUrl(res.url);
    } catch (e: any) {
      setError(e?.message || 'Ulanib bo‘lmadi');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  if (loading) {
    return <ScreenStates loading />;
  }

  if (error || !url) {
    return <ScreenStates error={error || 'Video havola olinmadi'} onRetry={loadToken} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
      />
      <TouchableOpacity style={styles.fabBack} onPress={() => navigation.goBack()}>
        <Text style={styles.fabText}>← Chiqish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fabBack: {
    position: 'absolute',
    top: 48,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
