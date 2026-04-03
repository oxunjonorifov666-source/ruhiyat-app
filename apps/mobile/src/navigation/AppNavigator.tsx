import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { Colors } from '../constants/colors';

import { HomeScreen } from '../screens/home/HomeScreen';
import { PsychologyScreen } from '../screens/psychology/PsychologyScreen';
import { ContentScreen } from '../screens/content/ContentScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { DevelopmentScreen } from '../screens/development/DevelopmentScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { MarketScreen } from '../screens/market/MarketScreen';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { OTPVerifyScreen } from '../screens/auth/OTPVerifyScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    'Asosiy': '🏠',
    'Psixologiya': '🧠',
    'Kontent': '📚',
    'Hamjamiyat': '🌍',
    'Profil': '👤',
  };
  return <Text style={{ fontSize: focused ? 24 : 20 }}>{icons[label] || '📱'}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.light.tabBar,
          borderTopColor: Colors.light.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Asosiy" component={HomeScreen} />
      <Tab.Screen name="Psixologiya" component={PsychologyScreen} />
      <Tab.Screen name="Kontent" component={ContentScreen} />
      <Tab.Screen name="Hamjamiyat" component={CommunityScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Development"
        component={DevelopmentScreen}
        options={{ headerShown: true, title: 'Rivojlantirish' }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ headerShown: true, title: 'Xabarlar' }}
      />
      <Stack.Screen
        name="Market"
        component={MarketScreen}
        options={{ headerShown: true, title: 'Market' }}
      />
    </Stack.Navigator>
  );
}
