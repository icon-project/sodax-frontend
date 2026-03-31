'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React, { useEffect, useMemo } from 'react';
import { WagmiProvider, useConfig, useConnect, useConnections, useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RpcConfig } from '@sodax/types';
import type { XConnection } from '../types';
import type { ChainActions } from '../context/ChainActionsContext';
import { EvmXService, createWagmiConfig } from '../xchains/evm/EvmXService';
import { EvmXConnector } from '../xchains/evm';
import { useXWagmiStore } from '../useXWagmiStore';
import type { EvmChainConfig } from '../types/config';

const queryClient = new QueryClient();

const defaultEvmConfig: Required<Pick<EvmChainConfig, 'reconnectOnMount' | 'ssr'>> = {
  reconnectOnMount: false,
  ssr: true,
};

type EvmProviderProps = {
  children: React.ReactNode;
  config?: EvmChainConfig;
  rpcConfig?: RpcConfig;
  onRegisterActions: (actions: ChainActions) => void;
};

/**
 * Hydrates EVM state from wagmi hooks into EvmXService singleton and store.
 * Registers EVM ChainActions.
 */
const EvmHydrator = ({ onRegisterActions }: Pick<EvmProviderProps, 'onRegisterActions'>) => {
  const wagmiConfig = useConfig();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const evmConnections = useConnections();
  const { address } = useAccount();
  const setXConnection = useXWagmiStore(state => state.setXConnection);
  const unsetXConnection = useXWagmiStore(state => state.unsetXConnection);

  // Hydrate wagmiConfig into singleton
  useEffect(() => {
    if (wagmiConfig) {
      EvmXService.getInstance().wagmiConfig = wagmiConfig;
    }
  }, [wagmiConfig]);

  // Hydrate connectors into store
  const connectors = wagmiConfig.connectors;
  useEffect(() => {
    const evmConnectors = connectors.map(c => new EvmXConnector(c));
    EvmXService.getInstance().setXConnectors(evmConnectors);
    // TODO Phase 4: useXWagmiStore.getState().setXConnectors('EVM', evmConnectors);
  }, [connectors]);

  // Hydrate connection state into store
  useEffect(() => {
    if (address && evmConnections?.[0]) {
      setXConnection('EVM', {
        xAccount: { address: address as string, xChainType: 'EVM' },
        xConnectorId: evmConnections[0].connector.id,
      });
    }
  }, [address, evmConnections, setXConnection]);

  // Register ChainActions
  useEffect(() => {
    const actions: ChainActions = {
      connect: async (xConnectorId: string) => {
        const connector = wagmiConfig.connectors.find(c => c.id === xConnectorId);
        if (!connector) return undefined;
        await connectAsync({ connector });
        // Connection state hydrated via useAccount/useConnections effects above
        return undefined;
      },
      disconnect: async () => {
        await disconnectAsync();
        unsetXConnection('EVM');
      },
      getConnectors: () => EvmXService.getInstance().getXConnectors(),
      getConnection: (): XConnection | undefined => {
        return useXWagmiStore.getState().xConnections.EVM;
      },
      signMessage: async (message: string) => {
        const signature = await signMessageAsync({ message });
        return signature;
      },
    };
    onRegisterActions(actions);
  }, [wagmiConfig, connectAsync, disconnectAsync, signMessageAsync, unsetXConnection, onRegisterActions]);

  return null;
};

export const EvmProvider = ({ children, config, rpcConfig, onRegisterActions }: EvmProviderProps) => {
  const reconnectOnMount = config?.reconnectOnMount ?? defaultEvmConfig.reconnectOnMount;
  const ssr = config?.ssr ?? defaultEvmConfig.ssr;

  const wagmiConfig = useMemo(() => {
    return createWagmiConfig(rpcConfig ?? {}, { reconnectOnMount, ssr });
  }, [rpcConfig, reconnectOnMount, ssr]);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider reconnectOnMount={reconnectOnMount} config={wagmiConfig} initialState={config?.initialState as never}>
        <EvmHydrator onRegisterActions={onRegisterActions} />
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
};
