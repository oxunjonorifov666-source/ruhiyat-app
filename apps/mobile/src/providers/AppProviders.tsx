import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { queryClient } from "../queryClient";
import { getStartupFlags } from "../config/startupFlags";

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "RUHIYAT_QUERY_CACHE_V1",
});

const WHITELIST = new Set([
  "articles-all-cats",
  "articles",
  "mood-entries",
  "mood-weekly",
  "habits",
  "sleep",
  "diary",
  "test-results",
  "bookings-cal",
  "article-cats",
  "consumer-plans",
  "entitlements",
  "my-payments",
]);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const persist = getStartupFlags().queryPersistEnabled;

  if (!persist) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (q) =>
            q.state.status === "success" &&
            typeof q.queryKey[0] === "string" &&
            WHITELIST.has(q.queryKey[0] as string),
        },
      }}
      onError={() => {
        /* persist restore xatosi — app ochilishni to‘xtatmasin */
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
