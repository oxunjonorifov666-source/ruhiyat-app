/**
 * EAS Build: ixtiyoriy `EXPO_PUBLIC_API_URL` (boshqa serverga ulash), `ANDROID_VERSION_CODE`.
 * Default: app.json → expo.extra.apiUrl (hozir LAN backend).
 * @see https://docs.expo.dev/build-reference/variables/
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appJson = require('./app.json');

module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || appJson.expo.extra.apiUrl,
    },
    android: {
      ...appJson.expo.android,
      versionCode: Number(process.env.ANDROID_VERSION_CODE || appJson.expo.android.versionCode),
      // Play Market: EAS `production` profilida EXPO_PUBLIC_ALLOW_CLEARTEXT=false bering (HTTPS API).
      ...(process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT !== undefined
        ? { usesCleartextTraffic: process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === 'true' }
        : {}),
    },
  },
});
