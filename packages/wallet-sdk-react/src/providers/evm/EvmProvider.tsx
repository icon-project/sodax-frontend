import { type ReactNode, useMemo } from 'react';
import { WagmiProvider, type State as WagmiState } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RpcConfig } from '@sodax/types';
import { createWagmiConfig } from '../../xchains/evm/EvmXService';
import type { EvmChainConfig } from '../../types/config';
import { EvmHydrator } from './EvmHydrator';
import { EvmActions } from './EvmActions';

const queryClient = new QueryClient();

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

  const wagmiConfig = useMemo(() => {
    return createWagmiConfig(rpcConfig ?? {}, { reconnectOnMount, ssr });
  }, [rpcConfig, reconnectOnMount, ssr]);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider reconnectOnMount={reconnectOnMount} config={wagmiConfig} initialState={config?.initialState as WagmiState | undefined}>
        <EvmHydrator />
        <EvmActions />
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
};
