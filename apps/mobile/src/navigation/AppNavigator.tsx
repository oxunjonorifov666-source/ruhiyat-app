import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, ActivityIndicator, View } from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';

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
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    'Asosiy': '\u{1F3E0}',
    'Psixologiya': '\u{1F9E0}',
    'Kontent': '\u{1F4DA}',
    'Hamjamiyat': '\u{1F30D}',
    'Profil': '\u{1F464}',
  };
  return <Text style={{ fontSize: focused ? 24 : 20 }}>{icons[label] || '\u{1F4F1}'}</Text>;
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

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="OTPVerify" component={OTPVerifyScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AppMainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Main" component={MainTabs} />
      <MainStack.Screen
        name="Development"
        component={DevelopmentScreen}
        options={{ headerShown: true, title: 'Rivojlantirish' }}
      />
      <MainStack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ headerShown: true, title: 'Xabarlar' }}
      />
      <MainStack.Screen
        name="Market"
        component={MarketScreen}
        options={{ headerShown: true, title: 'Market' }}
      />
    </MainStack.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={{ marginTop: 16, color: Colors.light.textSecondary }}>Yuklanmoqda...</Text>
      </View>
    );
  }

  return isAuthenticated ? <AppMainNavigator /> : <AuthNavigator />;
}
