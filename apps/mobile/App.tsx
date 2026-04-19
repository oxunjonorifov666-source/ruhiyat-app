import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { registerRootComponent } from 'expo';
import React, { Suspense, useEffect, useMemo } from 'react';
import { ActivityIndicator, PanResponder, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { navigationRef } from './src/navigation/navigationRef';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AppProviders } from './src/providers/AppProviders';
import { NetworkProvider } from './src/providers/NetworkProvider';
import { NetworkBanner } from './src/components/NetworkBanner';
import { useThemeStore } from './src/stores/themeStore';
import { useAccessibilityStore } from './src/stores/accessibilityStore';
import { useResolvedThemeMode } from './src/hooks/useResolvedThemeMode';
import { Colors, Palette } from './src/constants/colors';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { setupNotifications } from './src/notifications/setupNotifications';
import { startupLog } from './src/utils/startupLog';
import { InAppNotificationBanner } from './src/components/InAppNotificationBanner';
import { getActiveRouteName } from './src/lib/getActiveRouteName';
import { recordScreenView } from './src/services/telemetry';
import { useAppActivityStore } from './src/stores/appActivityStore';

const LazyAppNavigator = React.lazy(() =>
  import('./src/navigation/AppNavigator').then((m) => ({ default: m.AppNavigator })),
);

function linkingPrefixes(): string[] {
  const out: string[] = ['ruhiyat://'];
  try {
    const u = Linking.createURL('/');
    if (u && !out.includes(u)) out.unshift(u);
  } catch {
    /* ba’zi build’larda scheme hali bog‘lanmagan bo‘lishi mumkin */
  }
  return out;
}

const linking = {
  prefixes: linkingPrefixes(),
  config: {
    screens: {
      Main: {
        path: 'main',
        screens: {
          Home: 'home',
          Lessons: 'lessons',
          Library: 'library',
          Ranking: 'ranking',
          Extra: 'profile',
        },
      },
      /** CLICK `return_url` — `ruhiyat://payment-return` (MarketScreen da refetch) */
      Market: 'payment-return',
      MySessions: 'sessions',
      Messages: 'messages',
      PrivacyCenter: 'privacy',
      Tests: 'tests',
      Trainings: 'trainings',
      VideoLessons: 'videokutubxona',
      ArticleDetail: {
        path: 'article/:id',
        parse: { id: (id: string) => parseInt(id, 10) },
      },
      TestPass: {
        path: 'test/:testId',
        parse: { testId: (id: string) => parseInt(id, 10) },
      },
      CrisisResources: 'crisis-help',
    },
  },
};

function SecurityWrapper({ children }: { children: React.ReactNode }) {
  const { resetInactivityTimer, isAuthenticated } = useAuth();
  const touchActivity = useAppActivityStore((s) => s.touch);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        if (isAuthenticated) {
          touchActivity();
          resetInactivityTimer();
        }
        return false;
      },
      onMoveShouldSetPanResponderCapture: () => {
        if (isAuthenticated) {
          touchActivity();
          resetInactivityTimer();
        }
        return false;
      },
    }),
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

function ThemedNavigation() {
  const resolvedMode = useResolvedThemeMode();
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const hydrateA11y = useAccessibilityStore((s) => s.hydrate);
  const a11yHydrated = useAccessibilityStore((s) => s.hydrated);

  useEffect(() => {
    void hydrateTheme();
    void hydrateA11y();
  }, [hydrateTheme, hydrateA11y]);

  const navTheme = useMemo(() => {
    const base = resolvedMode === 'dark' ? DarkTheme : DefaultTheme;
    const P = resolvedMode === 'dark' ? Palette.dark : Palette.light;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: P.primary,
        background: P.background,
        card: P.surface,
        text: P.text,
        border: P.border,
        notification: P.accent,
      },
    };
  }, [resolvedMode]);

  if (!themeHydrated || !a11yHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NetworkProvider>
      <NavigationContainer
        ref={navigationRef}
        theme={navTheme}
        linking={linking}
        onStateChange={(state) => {
          const name = getActiveRouteName(state);
          if (name) void recordScreenView(name);
        }}
      >
        <InAppNotificationBanner />
        <View style={{ flex: 1 }}>
          <NetworkBanner />
          <View style={{ flex: 1 }}>
            <Suspense
              fallback={
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: Colors.background,
                  }}
                >
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              }
            >
              <LazyAppNavigator />
            </Suspense>
          </View>
        </View>
        <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      </NavigationContainer>
    </NetworkProvider>
  );
}

function App() {
  useEffect(() => {
    startupLog('root App mounted');
    void setupNotifications().catch((e) => startupLog('setupNotifications promise rejected', e));
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppProviders>
            <AuthProvider>
              <SecurityWrapper>
                <ThemedNavigation />
              </SecurityWrapper>
            </AuthProvider>
          </AppProviders>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

registerRootComponent(App);
