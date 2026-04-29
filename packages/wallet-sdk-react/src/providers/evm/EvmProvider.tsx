import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import type { CreateConnectorFn } from 'wagmi';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RpcConfig } from '@sodax/types';
import { createWagmiConfig } from '../../xchains/evm/EvmXService.js';
import type { EvmChainConfig } from '../../types/config.js';
import { EvmHydrator } from './EvmHydrator.js';
import { EvmActions } from './EvmActions.js';
import { EVM_DEFAULT_RECONNECT_ON_MOUNT, EVM_DEFAULT_SSR } from '../../constants.js';

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

  const [wcConnector, setWcConnector] = useState<CreateConnectorFn | null>(null);
  const walletConnectConfig = config?.walletConnect;

  useEffect(() => {
    if (!walletConnectConfig) return;
    if (!walletConnectConfig.projectId) {
      console.warn('[wallet-sdk-react] walletConnect.projectId is required — WalletConnect connector skipped.');
      return;
    }
    import('wagmi/connectors').then(({ walletConnect }) => {
      setWcConnector(() => walletConnect({ showQrModal: true, ...walletConnectConfig }));
    });
  }, [walletConnectConfig]);

  const wagmiConfig = useMemo(() => {
    const connectors = wcConnector ? [wcConnector] : [];
    return createWagmiConfig(rpcConfig ?? {}, { reconnectOnMount, ssr, connectors });
  }, [rpcConfig, reconnectOnMount, ssr, wcConnector]);

  // wagmi requires its own QueryClientProvider — this is wagmi-internal, not the app's React Query cache.
  return (
    <QueryClientProvider client={queryClientRef.current}>
      <WagmiProvider reconnectOnMount={reconnectOnMount} config={wagmiConfig} initialState={config?.initialState}>
        <EvmHydrator />
        <EvmActions />
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
};
