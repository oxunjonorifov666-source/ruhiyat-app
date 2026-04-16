import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ruhiyat_telemetry_events_v1';
const MAX = 120;

export type TelemetryEvent = {
  t: number;
  type: 'screen';
  name: string;
};

let optIn = false;
let lastScreen = '';
let lastAt = 0;

export function setTelemetryOptIn(v: boolean) {
  optIn = v;
}

export function getTelemetryOptIn() {
  return optIn;
}

async function load(): Promise<TelemetryEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const j = JSON.parse(raw) as TelemetryEvent[];
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

async function save(rows: TelemetryEvent[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(-MAX)));
  } catch {
    /* ignore */
  }
}

/** Maxfiylik: faqat ekran nomi; serverga yuborilmaydi (mahalliy). */
export async function recordScreenView(name: string) {
  if (!optIn || !name) return;
  const now = Date.now();
  if (name === lastScreen && now - lastAt < 1500) return;
  lastScreen = name;
  lastAt = now;

  const ev: TelemetryEvent = { t: now, type: 'screen', name };
  const prev = await load();
  await save([...prev, ev]);
  if (__DEV__) {
    console.log('[telemetry]', name);
  }
}

export async function clearTelemetry() {
  lastScreen = '';
  lastAt = 0;
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function getTelemetrySummary(): Promise<Record<string, number>> {
  const rows = await load();
  const out: Record<string, number> = {};
  for (const e of rows) {
    if (e.type === 'screen') {
      out[e.name] = (out[e.name] ?? 0) + 1;
    }
  }
  return out;
}
