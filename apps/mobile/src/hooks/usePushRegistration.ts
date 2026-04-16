import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { mobileAppService } from "../services/mobileApp";
import { useAuth } from "../contexts/AuthContext";
import { getStartupFlags } from "../config/startupFlags";
import { startupLog } from "../utils/startupLog";
import { isExpoGo } from "../utils/expoRuntime";

/**
 * expo-notifications faqat dynamic import — modul yuklanishi bilan native JNI chaqirilmaydi.
 */
export function usePushRegistration() {
  const { isAuthenticated } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!getStartupFlags().notificationsEnabled) return;
    if (isExpoGo()) return;
    if (!isAuthenticated || registered.current) return;

    let cancelled = false;

    (async () => {
      try {
        const Notifications = await import("expo-notifications");

        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted" || cancelled) return;

        const projectId = (
          Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
        )?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        const token = tokenData.data;
        if (!token || cancelled) return;

        await mobileAppService.registerPush({
          expoPushToken: token,
          platform: Platform.OS === "ios" ? "ios" : "android",
          deviceLabel: Constants.deviceName ?? undefined,
        });
        registered.current = true;
        startupLog("push: token registered");
      } catch (e) {
        startupLog("push: registration skipped or failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);
}
