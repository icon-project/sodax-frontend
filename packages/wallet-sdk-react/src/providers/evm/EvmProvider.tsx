import { type ReactNode, useMemo, useRef } from 'react';
import { WagmiProvider, type State as WagmiState } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RpcConfig } from '@sodax/types';
import { createWagmiConfig } from '../../xchains/evm/EvmXService';
import type { EvmChainConfig } from '../../types/config';
import { EvmHydrator } from './EvmHydrator';
import { EvmActions } from './EvmActions';
import { EVM_DEFAULT_RECONNECT_ON_MOUNT, EVM_DEFAULT_SSR } from '../../constants';

type EvmProviderProps = {
  children: ReactNode;
  config?: EvmChainConfig;
  rpcConfig?: RpcConfig;
};

export const EvmProvider = ({ children, config, rpcConfig }: EvmProviderProps) => {
  const reconnectOnMount = config?.reconnectOnMount ?? EVM_DEFAULT_RECONNECT_ON_MOUNT;
  const ssr = config?.ssr ?? EVM_DEFAULT_SSR;

  const queryClientRef = useRef<QueryClient>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  const wagmiConfig = useMemo(() => {
    return createWagmiConfig(rpcConfig ?? {}, { reconnectOnMount, ssr });
  }, [rpcConfig, reconnectOnMount, ssr]);

  // wagmi requires its own QueryClientProvider — this is wagmi-internal, not the app's React Query cache.
  return (
    <QueryClientProvider client={queryClientRef.current}>
      <WagmiProvider reconnectOnMount={reconnectOnMount} config={wagmiConfig} initialState={config?.initialState as WagmiState | undefined}>
        <EvmHydrator />
        <EvmActions />
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
};
