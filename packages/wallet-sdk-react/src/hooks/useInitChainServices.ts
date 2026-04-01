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
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    initChainServices(chains, rpcConfig);

    const runReconnect = () => {
      if (chains.ICON) reconnectIcon();
      if (chains.INJECTIVE) reconnectInjective();
      if (chains.STELLAR) reconnectStellar();
    };

    if (useXWalletStore.persist.hasHydrated()) {
      runReconnect();
    } else {
      useXWalletStore.persist.onFinishHydration(runReconnect);
    }
  }, [chains, rpcConfig, initChainServices]);
}
