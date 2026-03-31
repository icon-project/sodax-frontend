'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React, { useEffect, useMemo, useRef } from 'react';
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

  // Refs to hold latest hook values — avoids re-registering actions on every render
  const connectRef = useRef(connectAsync);
  const disconnectRef = useRef(disconnectAsync);
  const signMessageRef = useRef(signMessageAsync);
  const unsetConnectionRef = useRef(unsetXConnection);
  const wagmiConfigRef = useRef(wagmiConfig);

  useEffect(() => { connectRef.current = connectAsync; }, [connectAsync]);
  useEffect(() => { disconnectRef.current = disconnectAsync; }, [disconnectAsync]);
  useEffect(() => { signMessageRef.current = signMessageAsync; }, [signMessageAsync]);
  useEffect(() => { unsetConnectionRef.current = unsetXConnection; }, [unsetXConnection]);
  useEffect(() => { wagmiConfigRef.current = wagmiConfig; }, [wagmiConfig]);

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
    useXWagmiStore.getState().setXConnectors('EVM', evmConnectors);
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

  // Register ChainActions — once on mount, uses refs for latest values
  useEffect(() => {
    const actions: ChainActions = {
      connect: async (xConnectorId: string) => {
        const connector = wagmiConfigRef.current.connectors.find(c => c.id === xConnectorId);
        if (!connector) return undefined;
        await connectRef.current({ connector });
        return undefined;
      },
      disconnect: async () => {
        await disconnectRef.current();
        unsetConnectionRef.current('EVM');
      },
      getConnectors: () => EvmXService.getInstance().getXConnectors(),
      getConnection: (): XConnection | undefined => {
        return useXWagmiStore.getState().xConnections.EVM;
      },
      signMessage: async (message: string) => {
        const signature = await signMessageRef.current({ message });
        return signature;
      },
    };
    onRegisterActions(actions);
  }, [onRegisterActions]);

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
