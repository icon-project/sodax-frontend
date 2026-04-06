import { type ReactNode, useMemo, useRef } from 'react';
import { WagmiProvider, type State as WagmiState } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RpcConfig } from '@sodax/types';
import { createWagmiConfig } from '../../xchains/evm/EvmXService';
import type { EvmChainConfig } from '../../types/config';
import { EvmHydrator } from './EvmHydrator';
import { EvmActions } from './EvmActions';

const defaultEvmConfig: Required<Pick<EvmChainConfig, 'reconnectOnMount' | 'ssr'>> = {
  reconnectOnMount: false,
  ssr: true,
};

type EvmProviderProps = {
  children: ReactNode;
  config?: EvmChainConfig;
  rpcConfig?: RpcConfig;
};

export const EvmProvider = ({ children, config, rpcConfig }: EvmProviderProps) => {
  const reconnectOnMount = config?.reconnectOnMount ?? defaultEvmConfig.reconnectOnMount;
  const ssr = config?.ssr ?? defaultEvmConfig.ssr;

  const queryClientRef = useRef<QueryClient>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  const walletConnectConfig = config?.walletConnect;

  const wagmiConfig = useMemo(() => {
    return createWagmiConfig(rpcConfig ?? {}, { reconnectOnMount, ssr, walletConnect: walletConnectConfig });
  }, [rpcConfig, reconnectOnMount, ssr, walletConnectConfig]);

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
