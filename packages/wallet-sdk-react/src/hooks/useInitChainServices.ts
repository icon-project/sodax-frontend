import { useEffect } from 'react';
import type { RpcConfig } from '@sodax/types';
import type { ChainsConfig } from '../types/config.js';
import { useXWalletStore } from '../useXWalletStore.js';
import { reconnectIcon } from '../xchains/icon/actions.js';
import { reconnectInjective } from '../xchains/injective/actions.js';
import { reconnectStellar } from '../xchains/stellar/actions.js';

/**
 * Initializes chain services based on config. Runs once on mount.
 * Config is immutable after initial render — dynamic changes require remounting SodaxWalletProvider.
 * Handles reconnect for ICON/Injective/Stellar after persist hydration.
 */
export function useInitChainServices(chains: ChainsConfig, rpcConfig?: RpcConfig) {
  const initChainServices = useXWalletStore(state => state.initChainServices);
  const cleanupDisabledConnections = useXWalletStore(state => state.cleanupDisabledConnections);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run-once on mount — config is immutable after initial render, dynamic changes require remounting SodaxWalletProvider
  useEffect(() => {
    initChainServices(chains, rpcConfig);

    const afterHydration = () => {
      // Clean up persisted connections for disabled chains (must run after hydration
      // because persist middleware restores xConnections from localStorage)
      cleanupDisabledConnections();

      if (chains.ICON) {
        reconnectIcon().catch(error => console.warn('[wallet-sdk-react] ICON reconnect failed:', error));
      }

      if (chains.INJECTIVE) {
        reconnectInjective().catch(error => console.warn('[wallet-sdk-react] Injective reconnect failed:', error));
      }

      if (chains.STELLAR) {
        reconnectStellar().catch(error => console.warn('[wallet-sdk-react] Stellar reconnect failed:', error));
      }
    };

    if (useXWalletStore.persist.hasHydrated()) {
      afterHydration();
    } else {
      useXWalletStore.persist.onFinishHydration(afterHydration);
    }
  }, []);
}
