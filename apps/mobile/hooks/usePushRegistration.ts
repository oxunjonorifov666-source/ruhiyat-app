import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerPushDevice } from '~/lib/pushApi';
import { isExpoGo } from '~/lib/expoRuntime';
import { useAuthStore } from '~/store/authStore';

/**
 * Registers Expo push token with `POST /mobile/push/register` when the user is a mobile consumer.
 * Fails silently if permission denied, Expo Go, or network errors — never blocks the app.
 */
export function usePushRegistration() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const lastSentToken = useRef<string | null>(null);
  const lastUserId = useRef<number | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== 'MOBILE_USER') {
      lastSentToken.current = null;
      lastUserId.current = null;
      return;
    }
    if (user.id !== lastUserId.current) {
      lastSentToken.current = null;
      lastUserId.current = user.id;
    }
    if (isExpoGo()) return;

    const extra = Constants.expoConfig?.extra as { startupEnableNotifications?: boolean } | undefined;
    if (extra?.startupEnableNotifications === false) return;

    let cancelled = false;

    void (async () => {
      try {
        const Notifications = await import('expo-notifications');

        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted' || cancelled) return;

        const projectId = (
          Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
        )?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        const token = tokenData.data;
        if (!token || cancelled) return;
        if (lastSentToken.current === token) return;

        await registerPushDevice({
          expoPushToken: token,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          deviceLabel: Constants.deviceName ?? undefined,
        });
        if (!cancelled) lastSentToken.current = token;
      } catch {
        /* non-intrusive: permission, missing projectId in dev, network */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, user?.id, user?.role]);
}
