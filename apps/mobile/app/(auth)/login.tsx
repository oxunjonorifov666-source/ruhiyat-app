import { useState } from 'react';
import { Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Screen } from '~/components/Screen';
import { PrimaryButton } from '~/components/PrimaryButton';
import { useAuthStore } from '~/store/authStore';
import { getApiErrorMessage } from '~/lib/errors';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'email' | 'phone'>('phone');
  const [phone, setPhone] = useState('+998');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    setErr(null);
    setLoading(true);
    try {
      if (mode === 'email') {
        await login({ email, password });
      } else {
        await login({ phone: phone.trim(), password });
      }
      router.replace('/(main)');
    } catch (e: unknown) {
      setErr(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-calm-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen title="Kirish" subtitle="Hisobingizga kiring.">
        <View className="flex-row gap-2 mb-4">
          <Text
            className={`px-3 py-2 rounded-full text-sm ${mode === 'phone' ? 'bg-accent text-white' : 'bg-calm-200 text-calm-700'}`}
            onPress={() => setMode('phone')}
          >
            Telefon
          </Text>
          <Text
            className={`px-3 py-2 rounded-full text-sm ${mode === 'email' ? 'bg-accent text-white' : 'bg-calm-200 text-calm-700'}`}
            onPress={() => setMode('email')}
          >
            Email
          </Text>
        </View>

        {mode === 'email' ? (
          <TextInput
            className="bg-white border border-calm-200 rounded-2xl px-4 py-3 mb-3 text-calm-900"
            placeholder="email@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        ) : (
          <TextInput
            className="bg-white border border-calm-200 rounded-2xl px-4 py-3 mb-3 text-calm-900"
            placeholder="+998901234567"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        )}
        <TextInput
          className="bg-white border border-calm-200 rounded-2xl px-4 py-3 mb-2 text-calm-900"
          placeholder="Parol"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {err ? <Text className="text-red-600 mb-3">{err}</Text> : null}
        <PrimaryButton title="Kirish" loading={loading} onPress={onSubmit} />
        <View className="mt-6 items-center">
          <Link href="/(auth)/register" asChild>
            <Text className="text-accent font-medium">Hisob yo‘qmi? Ro‘yxatdan o‘tish</Text>
          </Link>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
