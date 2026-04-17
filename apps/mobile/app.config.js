/**
 * EAS Build: `EXPO_PUBLIC_API_URL` (ustun), `ANDROID_VERSION_CODE`, `EXPO_PUBLIC_ALLOW_CLEARTEXT`.
 * Default: app.json → expo.extra.apiUrl (production Render API).
 * New Architecture: `newArchEnabled` — Reanimated 4 / react-native-worklets talab qiladi; EAS prebuild → android/gradle.properties.
 * `EXPO_NEW_ARCH_ENABLED=false` bo‘lsa (faqat favqulodda) o‘chirish mumkin.
 * @see https://docs.expo.dev/build-reference/variables/
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appJson = require('./app.json');

const basePlugins = Array.isArray(appJson.expo.plugins) ? [...appJson.expo.plugins] : [];
const hasExpoWebBrowser = basePlugins.some(
  (p) => p === 'expo-web-browser' || (Array.isArray(p) && p[0] === 'expo-web-browser'),
);
if (!hasExpoWebBrowser) {
  basePlugins.push('expo-web-browser');
}

module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    newArchEnabled: process.env.EXPO_NEW_ARCH_ENABLED === 'false' ? false : true,
    plugins: basePlugins,
    extra: {
      ...appJson.expo.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || appJson.expo.extra.apiUrl,
    },
    android: {
      ...appJson.expo.android,
      versionCode: Number(process.env.ANDROID_VERSION_CODE || appJson.expo.android.versionCode),
      ...(process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT !== undefined
        ? { usesCleartextTraffic: process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === 'true' }
        : {}),
    },
  },
});
