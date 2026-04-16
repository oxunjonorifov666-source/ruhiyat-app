import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { radius, typography } from '../../theme/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { mobileAppService } from '../../services/mobileApp';
import { hapticLight } from '../../lib/haptics';

const SLIDES = [
  {
    emoji: '🧠',
    title: 'Ruhiyatga xush kelibsiz',
    text: 'Psixologik testlar, AI yordamchi va mutaxassislar — barchasi bitta ilovada.',
  },
  {
    emoji: '🔒',
    title: 'Maxfiylik',
    text: "Ma’lumotlaringiz PostgreSQL bazasida saqlanadi. Superadmin sozlamalari `mobile_app_settings` orqali boshqariladi.",
  },
  {
    emoji: '🆘',
    title: 'Favqulodda',
    text: 'SOS signal `sos_alerts` jadvaliga yoziladi va mas’ullarga bildirishnoma yuboriladi.',
  },
  {
    emoji: '✨',
    title: 'Boshlaymiz',
    text: 'Davom etish orqali ilovadan foydalanishga tayyorligingizni bildirasiz.',
  },
];

export function OnboardingScreen() {
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    try {
      await mobileAppService.patchPreferences({ onboardingComplete: true });
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const item = SLIDES[step];

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotOn]} />
        ))}
      </View>
      {step < SLIDES.length - 1 ? (
        <TouchableOpacity
          style={styles.next}
          onPress={() => {
            hapticLight();
            setStep((s) => s + 1);
          }}
        >
          <Text style={styles.nextText}>Keyingi</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.next} onPress={finish} disabled={loading}>
          <Text style={styles.nextText}>{loading ? '...' : 'Boshlash'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 28, justifyContent: 'center' },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: 20 },
  title: { ...typography.hero, color: Colors.text, textAlign: 'center', marginBottom: 12 },
  text: { ...typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotOn: { backgroundColor: Colors.primary, width: 22 },
  next: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
