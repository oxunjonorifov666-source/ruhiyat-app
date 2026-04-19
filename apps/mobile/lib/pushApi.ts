import { api } from '~/lib/api';

export type RegisterPushBody = {
  expoPushToken: string;
  platform: string;
  deviceLabel?: string;
};

export async function registerPushDevice(body: RegisterPushBody) {
  const { data } = await api.post<{ ok?: boolean }>('/mobile/push/register', body);
  return data;
}
