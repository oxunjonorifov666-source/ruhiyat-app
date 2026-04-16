import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

type Ctx = { isOnline: boolean };

const NetworkContext = createContext<Ctx>({ isOnline: true });

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const sub = NetInfo.addEventListener((s) => {
      setIsOnline(s.isConnected === true && s.isInternetReachable !== false);
    });
    return () => sub();
  }, []);

  return <NetworkContext.Provider value={{ isOnline }}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  return useContext(NetworkContext);
}
