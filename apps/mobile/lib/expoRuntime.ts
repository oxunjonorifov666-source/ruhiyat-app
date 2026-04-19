import Constants, { ExecutionEnvironment } from 'expo-constants';

/** Expo Go limits remote push and some notification APIs. */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}
