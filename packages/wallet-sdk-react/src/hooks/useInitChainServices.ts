import { useEffect, useRef } from 'react';
import type { RpcConfig } from '@sodax/types';
import type { ChainsConfig } from '../types/config';
import { useXWalletStore } from '../useXWalletStore';
import { reconnectIcon } from '../xchains/icon/actions';
import { reconnectInjective } from '../xchains/injective/actions';
import { reconnectStellar } from '../xchains/stellar/actions';

/**
 * Initializes chain services based on config. Runs once on mount.
 * Handles reconnect for ICON/Injective/Stellar after persist hydration.
 */
export function useInitChainServices(chains: ChainsConfig, rpcConfig?: RpcConfig) {
  const initChainServices = useXWalletStore(state => state.initChainServices);
  const cleanupDisabledConnections = useXWalletStore(state => state.cleanupDisabledConnections);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    initChainServices(chains, rpcConfig);

    const afterHydration = () => {
      // Clean up persisted connections for disabled chains (must run after hydration
      // because persist middleware restores xConnections from localStorage)
      cleanupDisabledConnections();

      if (chains.ICON) reconnectIcon();
      if (chains.INJECTIVE) reconnectInjective();
      if (chains.STELLAR) reconnectStellar();
    };

    if (useXWalletStore.persist.hasHydrated()) {
      afterHydration();
    } else {
      useXWalletStore.persist.onFinishHydration(afterHydration);
    }
  }, [chains, rpcConfig, initChainServices, cleanupDisabledConnections]);
}
