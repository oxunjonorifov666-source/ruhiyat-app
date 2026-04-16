import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Colors } from '../../constants/colors';
import { resolveMediaUrl } from '../../config';
import type { AudioContent } from '../../services/content';

export function AudioPlayerScreen({ route, navigation }: any) {
  const item = route?.params as AudioContent | undefined;
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!item?.fileUrl) return;
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const uri = resolveMediaUrl(item.fileUrl);
      const { sound: s } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        (st) => {
          if (!st.isLoaded) return;
          setPos((st.positionMillis || 0) / 1000);
          setDur((st.durationMillis || 0) / 1000);
          setPlaying(st.isPlaying);
        },
      );
      if (!mounted) {
        await s.unloadAsync();
        return;
      }
      soundRef.current = s;
      setLoading(false);
    })();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, [item?.fileUrl]);

  const toggle = async () => {
    const sound = soundRef.current;
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if (st.isLoaded && st.isPlaying) await sound.pauseAsync();
    else await sound.playAsync();
  };

  const seek = async (delta: number) => {
    const sound = soundRef.current;
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if (!st.isLoaded || !st.durationMillis) return;
    const next = Math.max(0, Math.min(st.durationMillis, (st.positionMillis || 0) + delta * 1000));
    await sound.setPositionAsync(next);
  };

  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Audio topilmadi</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const pct = dur > 0 ? Math.min(100, (pos / dur) * 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.title}</Text>
      {item.category ? <Text style={styles.cat}>{item.category}</Text> : null}
      <View style={styles.progressBg}>
        <View style={[styles.progressFg, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.time}>
        {fmt(pos)} / {fmt(dur)}
      </Text>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => seek(-10)} style={styles.ctrl}>
          <Text style={styles.ctrlText}>-10s</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggle} style={styles.play}>
          <Text style={styles.playText}>{playing ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => seek(10)} style={styles.ctrl}>
          <Text style={styles.ctrlText}>+10s</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>Yopish</Text>
      </TouchableOpacity>
    </View>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  cat: { textAlign: 'center', color: Colors.primary, marginTop: 8, fontWeight: '600' },
  progressBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4, marginTop: 32, overflow: 'hidden' },
  progressFg: { height: '100%', backgroundColor: Colors.primary },
  time: { textAlign: 'center', marginTop: 12, color: Colors.textSecondary },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  ctrl: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 8,
  },
  ctrlText: { fontWeight: '700', color: Colors.text },
  play: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: 14,
  },
  playText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  back: { textAlign: 'center', marginTop: 32, color: Colors.primary, fontWeight: '600' },
});
