import { useState } from 'react';
import { Text, TextInput, View, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Screen } from '~/components/Screen';
import { PrimaryButton } from '~/components/PrimaryButton';
import { useAuthStore } from '~/store/authStore';
import { getApiErrorMessage } from '~/lib/errors';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    setErr(null);
    setLoading(true);
    try {
      await register({
        phone: phone.trim(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
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
      <Screen title="Ro‘yxatdan o‘tish" subtitle="Telefon va parol kiriting. Parol: kamida 8 belgi, katta/kichik harf va raqam.">
        <TextInput
          className="bg-white border border-calm-200 rounded-2xl px-4 py-3 mb-3 text-calm-900"
          placeholder="+998901234567"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          className="bg-white border border-calm-200 rounded-2xl px-4 py-3 mb-3 text-calm-900"
          placeholder="Ism (ixtiyoriy)"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          className="bg-white border border-calm-200 rounded-2xl px-4 py-3 mb-3 text-calm-900"
          placeholder="Familiya (ixtiyoriy)"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          className="bg-white border border-calm-200 rounded-2xl px-4 py-3 mb-2 text-calm-900"
          placeholder="Parol"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {err ? <Text className="text-red-600 mb-3">{err}</Text> : null}
        <PrimaryButton title="Ro‘yxatdan o‘tish" loading={loading} onPress={onSubmit} />
        <View className="mt-6 items-center">
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="text-accent font-medium">Allaqachon hisob bormi? Kirish</Text>
            </Pressable>
          </Link>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
