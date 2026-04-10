import { useEffect, useMemo, useRef } from 'react';
import { useConfig, useConnectors, useConnections, useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { EvmWalletProvider } from '@sodax/wallet-sdk-core';
import { EvmXService } from '../../xchains/evm/EvmXService';
import { EvmXConnector } from '../../xchains/evm';
import { useXWalletStore } from '../../useXWalletStore';

/**
 * Hydrates EVM state from wagmi hooks into EvmXService singleton and store.
 * Runs as a child of WagmiProvider — has access to wagmi context.
 */
export const EvmHydrator = () => {
  const wagmiConfig = useConfig();
  const connectors = useConnectors();
  const evmConnections = useConnections();
  const { address } = useAccount();
  const evmPublicClient = usePublicClient();
  const { data: evmWalletClient } = useWalletClient();
  const setXConnection = useXWalletStore(state => state.setXConnection);
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);
  const setWalletProvider = useXWalletStore(state => state.setWalletProvider);

  // Hydrate wagmiConfig into singleton
  useEffect(() => {
    if (wagmiConfig) {
      EvmXService.getInstance().wagmiConfig = wagmiConfig;
    }
  }, [wagmiConfig]);

  // Hydrate connectors into store (useConnectors is reactive to EIP-6963 discovery)
  const evmConnectors = useMemo(() => connectors.map(c => new EvmXConnector(c)), [connectors]);
  useEffect(() => {
    EvmXService.getInstance().setXConnectors(evmConnectors);
    useXWalletStore.getState().setXConnectors('EVM', evmConnectors);
  }, [evmConnectors]);

  // Hydrate connection state into store (set + unset)
  const wasConnectedRef = useRef(!!useXWalletStore.getState().xConnections.EVM);
  useEffect(() => {
    if (address && evmConnections?.[0]) {
      wasConnectedRef.current = true;
      setXConnection('EVM', {
        xAccount: { address: address as string, xChainType: 'EVM' },
        xConnectorId: evmConnections[0].connector.id,
      });
    } else if (wasConnectedRef.current) {
      wasConnectedRef.current = false;
      unsetXConnection('EVM');
    }
  }, [address, evmConnections, setXConnection, unsetXConnection]);

  // Memoize wallet provider so a new instance is only created when client refs actually change.
  // wagmi returns new client object refs across some renders even when underlying state is stable —
  // without memoization, the store would receive a new EvmWalletProvider on every render, causing
  // every consumer of useWalletProvider('EVM') to re-render unnecessarily.
  const walletProvider = useMemo(() => {
    if (evmPublicClient && evmWalletClient) {
      return new EvmWalletProvider({ walletClient: evmWalletClient, publicClient: evmPublicClient });
    }
    return undefined;
  }, [evmPublicClient, evmWalletClient]);

  useEffect(() => {
    setWalletProvider('EVM', walletProvider);
  }, [walletProvider, setWalletProvider]);

  return null;
};
