'use client';

import { useEffect, useRef } from 'react';
import { useConfig, useConnections, useAccount } from 'wagmi';
import { EvmXService } from '../../xchains/evm/EvmXService';
import { EvmXConnector } from '../../xchains/evm';
import { useXWalletStore } from '../../useXWalletStore';

/**
 * Hydrates EVM state from wagmi hooks into EvmXService singleton and store.
 * Runs as a child of WagmiProvider — has access to wagmi context.
 */
export const EvmHydrator = () => {
  const wagmiConfig = useConfig();
  const evmConnections = useConnections();
  const { address } = useAccount();
  const setXConnection = useXWalletStore(state => state.setXConnection);
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);

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
    useXWalletStore.getState().setXConnectors('EVM', evmConnectors);
  }, [connectors]);

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

  return null;
};
