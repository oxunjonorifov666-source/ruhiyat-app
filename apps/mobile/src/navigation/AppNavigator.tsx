import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { useAppPalette } from '../theme/useAppPalette';

import { HomeScreen } from '../screens/home/HomeScreen';
import { PsychologyScreen } from '../screens/psychology/PsychologyScreen';
import { TestsScreen } from '../screens/psychology/TestsScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { MarketScreen } from '../screens/market/MarketScreen';
import { ChatRoomScreen } from '../screens/messages/ChatRoomScreen';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ChangePasswordScreen } from '../screens/auth/ChangePasswordScreen';

import { LibraryScreen } from '../screens/content/LibraryScreen';
import { VideochatScreen } from '../screens/video/VideochatScreen';
import { VideochatRoomScreen } from '../screens/video/VideochatRoomScreen';
import { ProfileSettingsScreen } from '../screens/profile/ProfileSettingsScreen';
import { NotificationsScreen } from '../screens/notification/NotificationsScreen';
import { NotificationSettingsScreen } from '../screens/notification/NotificationSettingsScreen';
import { DiaryScreen } from '../screens/wellness/DiaryScreen';
import { AudioCatalogScreen } from '../screens/content/AudioCatalogScreen';
import { VideoCatalogScreen } from '../screens/content/VideoCatalogScreen';
import { TrainingsScreen } from '../screens/wellness/TrainingsScreen';
import { TestPassScreen } from '../screens/psychology/TestPassScreen';
import { BookPsychologistScreen } from '../screens/psychology/BookPsychologistScreen';
import { MySessionsScreen } from '../screens/profile/MySessionsScreen';
import { SosScreen } from '../screens/safety/SosScreen';
import { CrisisResourcesScreen } from '../screens/safety/CrisisResourcesScreen';
import { AiPsychologistScreen } from '../screens/ai/AiPsychologistScreen';
import { BreathingScreen } from '../screens/wellness/BreathingScreen';
import { HabitsScreen } from '../screens/wellness/HabitsScreen';
import { SleepScreen } from '../screens/wellness/SleepScreen';
import { MoodWeeklyScreen } from '../screens/wellness/MoodWeeklyScreen';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';
import { ArticlesListScreen } from '../screens/articles/ArticlesListScreen';
import { ArticleDetailScreen } from '../screens/articles/ArticleDetailScreen';
import { TestHistoryScreen } from '../screens/psychology/TestHistoryScreen';
import { AudioPlayerScreen } from '../screens/content/AudioPlayerScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { PrivacyCenterScreen } from '../screens/privacy/PrivacyCenterScreen';
import { AppPinSettingsScreen } from '../screens/privacy/AppPinSettingsScreen';
import { StaticLegalScreen } from '../screens/legal/StaticLegalScreen';
import { BiometricGate } from '../components/BiometricGate';
import { AppLockGate } from '../components/AppLockGate';
import { TestResultScreen } from '../screens/psychology/TestResultScreen';
import { usePushRegistration } from '../hooks/usePushRegistration';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();


type TabIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabBarIcon({
  name,
  focused,
  activeColor,
  inactiveColor,
}: {
  name: TabIconName;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <View style={focused ? tabStyles.activeTab : undefined}>
      <MaterialCommunityIcons name={name} size={focused ? 26 : 24} color={focused ? activeColor : inactiveColor} />
    </View>
  );
}

function MainTabs() {
  const C = useAppPalette();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.tabBarInactive,
        tabBarStyle: {
          backgroundColor: C.tabBar,
          borderTopColor: C.border,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.05,
          shadowRadius: 15,
          elevation: 20,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 4 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Asosiy',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="home-variant-outline" focused={focused} activeColor={C.primary} inactiveColor={C.tabBarInactive} />
          ),
        }}
      />
      <Tab.Screen
        name="Lessons"
        component={PsychologyScreen}
        options={{
          tabBarLabel: 'Darslar',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="school-outline" focused={focused} activeColor={C.primary} inactiveColor={C.tabBarInactive} />
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Marklar',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="bookmark-multiple-outline" focused={focused} activeColor={C.primary} inactiveColor={C.tabBarInactive} />
          ),
        }}
      />
      <Tab.Screen
        name="Ranking"
        component={CommunityScreen}
        options={{
          tabBarLabel: 'Reyting',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="trophy-outline" focused={focused} activeColor={C.primary} inactiveColor={C.tabBarInactive} />
          ),
        }}
      />
      <Tab.Screen
        name="Extra"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="account-circle-outline" focused={focused} activeColor={C.primary} inactiveColor={C.tabBarInactive} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AppMainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Main" component={MainTabs} />
      <MainStack.Screen name="Videochat" component={VideochatScreen} />
      <MainStack.Screen name="VideochatRoom" component={VideochatRoomScreen} />
      <MainStack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <MainStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: true, title: 'Parol', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen name="Notifications" component={NotificationsScreen} />
      <MainStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="Diary" component={DiaryScreen} />
      <MainStack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ headerShown: true, title: 'Xabarlar', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ headerShown: true, title: 'Chat', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="Market"
        component={MarketScreen}
        options={{ headerShown: true, title: 'Market', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="Tests"
        component={TestsScreen}
        options={{ headerShown: true, title: 'Psixologik Testlar', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="AudioLessons"
        component={AudioCatalogScreen}
        options={{ headerShown: true, title: 'Audio darslar', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="VideoLessons"
        component={VideoCatalogScreen}
        options={{ headerShown: true, title: 'Videokutubxona', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="Trainings"
        component={TrainingsScreen}
        options={{ headerShown: true, title: 'Treninglar', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="TestPass"
        component={TestPassScreen}
        options={{ headerShown: true, title: 'Test', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="TestResult"
        component={TestResultScreen}
        options={{ headerShown: true, title: 'Test natijasi', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="BookPsychologist"
        component={BookPsychologistScreen}
        options={{ headerShown: true, title: 'Band qilish', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="MySessions"
        component={MySessionsScreen}
        options={{ headerShown: true, title: 'Mening seanslarim', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="Sos"
        component={SosScreen}
        options={{ headerShown: true, title: 'SOS', headerTintColor: Colors.error }}
      />
      <MainStack.Screen
        name="CrisisResources"
        component={CrisisResourcesScreen}
        options={{ headerShown: true, title: 'Yordam liniyalari', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="AiPsychologist"
        component={AiPsychologistScreen}
        options={{ headerShown: true, title: 'AI Psixolog', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="Breathing"
        component={BreathingScreen}
        options={{ headerShown: true, title: 'Nafas mashqlari', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="Habits"
        component={HabitsScreen}
        options={{ headerShown: true, title: 'Odatlar', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="Sleep"
        component={SleepScreen}
        options={{ headerShown: true, title: 'Uyqu', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="MoodWeekly"
        component={MoodWeeklyScreen}
        options={{ headerShown: true, title: 'Haftalik kayfiyat', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ headerShown: true, title: 'Kalendar', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="Articles"
        component={ArticlesListScreen}
        options={{ headerShown: true, title: 'Maqolalar', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{ headerShown: true, title: 'Maqola', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="TestHistory"
        component={TestHistoryScreen}
        options={{ headerShown: true, title: 'Test natijalari', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="AudioPlayer"
        component={AudioPlayerScreen}
        options={{ headerShown: true, title: 'Audio', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="PrivacyCenter"
        component={PrivacyCenterScreen}
        options={{ headerShown: true, title: 'Maxfiylik markazi', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="AppPinSettings"
        component={AppPinSettingsScreen}
        options={{ headerShown: true, title: 'Ilova PIN', headerTintColor: Colors.primary }}
      />
      <MainStack.Screen
        name="LegalDocument"
        component={StaticLegalScreen}
        options={({ route }: any) => ({
          headerShown: true,
          title:
            route.params?.doc === 'terms'
              ? 'Foydalanish shartlari'
              : route.params?.doc === 'help'
                ? 'Yordam'
                : 'Maxfiylik',
          headerTintColor: Colors.primary,
        })}
      />
    </MainStack.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  activeTab: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
});


function PushBootstrap() {
  usePushRegistration();
  return null;
}

export function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ fontSize: 48, marginBottom: 24 }}>🧠</Text>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 16, color: Colors.textSecondary, fontSize: 14 }}>Yuklanmoqda...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (user && !user.onboardingCompletedAt) {
    return <OnboardingScreen />;
  }

  return (
    <>
      <PushBootstrap />
      <AppLockGate>
        <BiometricGate>
          <AppMainNavigator />
        </BiometricGate>
      </AppLockGate>
    </>
  );
}
