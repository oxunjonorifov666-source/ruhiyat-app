import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Home, ClipboardList, HeartHandshake, UserRound, Users } from 'lucide-react-native';
import { AccountDeletionBanner } from '~/components/AccountDeletionBanner';
import { useAuthStore } from '~/store/authStore';

const ME_REFRESH_MIN_MS = 30_000;

export default function MainTabsLayout() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const lastMeRefresh = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const user = useAuthStore.getState().user;
      if (user?.role !== 'MOBILE_USER') return;
      const now = Date.now();
      if (now - lastMeRefresh.current < ME_REFRESH_MIN_MS) return;
      lastMeRefresh.current = now;
      void refreshUser();
    }, [refreshUser]),
  );

  return (
    <View className="flex-1 bg-calm-50">
      <AccountDeletionBanner />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5b7c6a',
        tabBarInactiveTintColor: '#8a9ba8',
        tabBarStyle: {
          backgroundColor: '#f7f8f9',
          borderTopColor: '#d9e0e5',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bosh sahifa',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: 'Testlar',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="psychologists"
        options={{
          title: 'Mutaxassislar',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Yordam',
          tabBarIcon: ({ color, size }) => <HeartHandshake color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="wellness" options={{ href: null }} />
      <Tabs.Screen name="library" options={{ href: null }} />
    </Tabs>
    </View>
  );
}
