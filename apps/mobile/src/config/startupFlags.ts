import Constants from "expo-constants";

/** `app.json` → `expo.extra` */
export type StartupExtra = {
  /** `true` bo‘lsa push + notification handler yoqiladi (FCM/google-services tayyor bo‘lganda). Default: o‘chiq — APK crashsiz ochilish. */
  startupEnableNotifications?: boolean;
  /** `false` bo‘lsa React Query AsyncStorage persist o‘chadi (faqat noyob restore muammosi bo‘lsa). */
  startupEnableQueryPersist?: boolean;
};

export function getStartupFlags(): {
  notificationsEnabled: boolean;
  queryPersistEnabled: boolean;
} {
  const extra = (Constants.expoConfig?.extra ?? {}) as StartupExtra;
  return {
    notificationsEnabled: extra.startupEnableNotifications === true,
    queryPersistEnabled: extra.startupEnableQueryPersist !== false,
  };
}
