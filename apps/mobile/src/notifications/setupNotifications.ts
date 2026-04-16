import { InteractionManager, Platform } from "react-native";
import { getStartupFlags } from "../config/startupFlags";
import { startupLog } from "../utils/startupLog";
import { isExpoGo } from "../utils/expoRuntime";
import { navigateFromNotification } from "../navigation/navigationRef";
import { useInAppNotificationStore } from "../stores/inAppNotificationStore";

let finished = false;

/**
 * Statik `import 'expo-notifications'` qo‘llanmaydi — faqat flag yoqilganda dynamic import.
 * Native bridge tayyor bo‘lishi uchun `runAfterInteractions` dan keyin chaqiriladi.
 */
export async function setupNotifications(): Promise<void> {
  if (finished) return;

  if (!getStartupFlags().notificationsEnabled) {
    startupLog("notifications: skipped (extra.startupEnableNotifications !== true)");
    finished = true;
    return;
  }

  if (isExpoGo()) {
    startupLog(
      "notifications: Expo Go — masofaviy push SDK 53+ da o‘chirilgan; development build yoki haqiqiy APK ishlating",
    );
    finished = true;
    return;
  }

  finished = true;

  try {
    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => resolve());
    });

    const Notifications = await import("expo-notifications");

    if (typeof Notifications.setNotificationHandler !== "function") {
      startupLog("notifications: setNotificationHandler mavjud emas — bu muhitda o‘tkazib yuborildi");
    } else {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: false,
          shouldShowList: false,
        }),
      });
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    Notifications.addNotificationReceivedListener((notification) => {
      try {
        const title = notification.request.content.title ?? "";
        const body = notification.request.content.body ?? "";
        if (title || body) {
          useInAppNotificationStore.getState().push(title || "Bildirishnoma", body);
        }
      } catch {
        /* ignore */
      }
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const raw = response.notification.request.content.data;
        if (raw && typeof raw === "object") {
          navigateFromNotification(raw as Record<string, unknown>);
        }
      } catch {
        /* ignore */
      }
    });

    startupLog("notifications: handler + channel OK");
  } catch (e) {
    startupLog("notifications: setup failed (ignored)", e);
  }
}
