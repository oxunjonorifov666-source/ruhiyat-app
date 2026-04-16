import Constants, { ExecutionEnvironment } from "expo-constants";

/** Expo Go ilovasida (SDK 53+) masofaviy push va ba’zi notification APIlari cheklangan. */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}
