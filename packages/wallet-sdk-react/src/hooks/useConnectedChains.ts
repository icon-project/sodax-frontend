import { useMemo, useSyncExternalStore } from 'react';
import { ChainTypeArr, type ChainType } from '@sodax/types';
import type { XAccount, XConnection } from '@/types/index.js';
import type { XConnector } from '@/core/index.js';
import { useXWalletStore } from '@/useXWalletStore.js';
import { compareChainByOrder } from '@/utils/chainOrder.js';

export type ConnectedChain = {
  chainType: ChainType;
  account: XAccount;
  connectorId: string;
  connectorName: string | undefined;
  connectorIcon: string | undefined;
};

export type UseConnectedChainsResult = {
  /** One entry per chain currently holding a connected account. */
  chains: ConnectedChain[];
  /** Number of connected chains. */
  total: number;
  /**
   * `'loading'` until the store rehydrates from localStorage. Gate UI that
   * switches visibly on connection state (e.g. `total >= 1 ? Connected : Cta`)
   * with this flag to avoid flicker on reload.
   */
  status: 'loading' | 'ready';
};

export type UseConnectedChainsOptions = {
  /**
   * Display order by `chainType`. Chains not listed fall to the bottom
   * alphabetical amongst themselves. Omit to leave chains in the insertion
   * order of the underlying store (non-deterministic across page reloads).
   */
  order?: readonly ChainType[];
};

/**
 * Pure helper — extracted for testability. Same logic as `useConnectedChains`
 * but without React hook bindings. `isReady` defaults to `true` so tests that
 * don't care about loading state don't need to pass it.
 */
export function buildConnectedChains(
  xConnections: Partial<Record<ChainType, XConnection>>,
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>,
  isReady = true,
  order?: readonly ChainType[],
): UseConnectedChainsResult {
  const chains: ConnectedChain[] = [];
  for (const chainType of ChainTypeArr) {
    const connection = xConnections[chainType];
    if (!connection?.xAccount.address) continue;
    const connectors = xConnectorsByChain[chainType] ?? [];
    const connector = connectors.find(c => c.id === connection.xConnectorId);
    chains.push({
      chainType,
      account: connection.xAccount,
      connectorId: connection.xConnectorId,
      connectorName: connector?.name,
      connectorIcon: connector?.icon,
    });
  }

  if (order) {
    chains.sort((a, b) => compareChainByOrder(a.chainType, b.chainType, order));
  }

  return {
    chains,
    total: chains.length,
    status: isReady ? 'ready' : 'loading',
  };
}

function subscribeHydration(onChange: () => void): () => void {
  const unsubHydrate = useXWalletStore.persist.onHydrate(onChange);
  const unsubFinish = useXWalletStore.persist.onFinishHydration(onChange);
  return () => {
    unsubHydrate();
    unsubFinish();
  };
}

/**
 * Aggregate view of every currently-connected chain with enriched connector
 * metadata (name + icon) looked up from the store. Useful for "Manage
 * connections" UIs and status badges.
 *
 * Gate rendering on `status === 'ready'` to avoid the "Connect wallet" →
 * "Connected" flicker on reload while the store rehydrates from localStorage.
 *
 * @example
 * const { chains, total, status } = useConnectedChains();
 * if (status === 'loading') return <Skeleton />;
 * return total >= 1 ? <ConnectedChainsDisplay chains={chains} /> : <ConnectCta />;
 *
 * @example
 * // Deterministic display order — required if rendering a list that must
 * // be stable across page reloads (hydrator race otherwise randomizes
 * // insertion order).
 * const { chains } = useConnectedChains({ order: ['EVM', 'ICON', 'SOLANA'] });
 */
export function useConnectedChains(options: UseConnectedChainsOptions = {}): UseConnectedChainsResult {
  const xConnections = useXWalletStore(s => s.xConnections);
  const xConnectorsByChain = useXWalletStore(s => s.xConnectorsByChain);
  const isReady = useSyncExternalStore(
    subscribeHydration,
    () => useXWalletStore.persist.hasHydrated(),
    () => false,
  );

  const { order } = options;
  return useMemo(
    () => buildConnectedChains(xConnections, xConnectorsByChain, isReady, order),
    [xConnections, xConnectorsByChain, isReady, order],
  );
}
