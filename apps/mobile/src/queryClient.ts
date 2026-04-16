import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './lib/ApiError';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      networkMode: 'online',
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.code === 'NETWORK_ERROR') return failureCount < 3;
          if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});
