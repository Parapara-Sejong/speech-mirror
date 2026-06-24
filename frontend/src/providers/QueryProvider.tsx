import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

type QueryProviderProps = {
  children: ReactNode;
  client: QueryClient;
};

export function QueryProvider({ children, client }: QueryProviderProps) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
