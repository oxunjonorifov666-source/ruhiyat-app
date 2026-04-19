import * as SecureStore from 'expo-secure-store';

const ACCESS = 'ruhiyat_mobile_access_token';
const REFRESH = 'ruhiyat_mobile_refresh_token';

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS, access);
  await SecureStore.setItemAsync(REFRESH, refresh);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS).catch(() => undefined);
  await SecureStore.deleteItemAsync(REFRESH).catch(() => undefined);
}
