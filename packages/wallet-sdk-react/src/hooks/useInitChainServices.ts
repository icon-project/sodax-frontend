import { useEffect } from 'react';
import type { RpcConfig } from '@sodax/types';
import type { ChainsConfig } from '../types/config';
import { useXWalletStore } from '../useXWalletStore';
import { reconnectIcon } from '../xchains/icon/actions';
import { reconnectInjective } from '../xchains/injective/actions';
import { reconnectStellar } from '../xchains/stellar/actions';

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
        reconnectIcon().catch(e => console.warn('[wallet-sdk-react] ICON reconnect failed:', e));
      }

      if (chains.INJECTIVE) {
        reconnectInjective().catch(e => console.warn('[wallet-sdk-react] Injective reconnect failed:', e));
      }

      if (chains.STELLAR) {
        reconnectStellar().catch(e => console.warn('[wallet-sdk-react] Stellar reconnect failed:', e));
      }
    };

    if (useXWalletStore.persist.hasHydrated()) {
      afterHydration();
    } else {
      useXWalletStore.persist.onFinishHydration(afterHydration);
    }
  }, []);
}
