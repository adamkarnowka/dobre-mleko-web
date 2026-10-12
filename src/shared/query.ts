import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

/** Retries only network and server errors; a 4xx answer will not change by asking again. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failures, err) => !(err instanceof ApiError && err.status < 500) && failures < 2,
      },
    },
  });
}
