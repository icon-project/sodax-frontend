import { useMemo } from 'react';
import { baseChainInfo, CHAIN_KEYS, type SpokeChainKey, type ChainType } from '@sodax/types';
import type { XAccount, XConnection } from '@/types/index.js';
import { useXWalletStore } from '@/useXWalletStore.js';
import { chainRegistry, type ChainServiceFactory } from '@/chainRegistry.js';
import { compareChainByOrder } from '@/utils/chainOrder.js';

export type ChainGroup = {
  chainType: ChainType;
  /** All SpokeChainKeys that share this ChainType — e.g. every EVM network for `chainType: 'EVM'`. */
  chainIds: readonly SpokeChainKey[];
  displayName: string;
  /** Icon URL from chainRegistry. `undefined` when SDK doesn't ship a default — consumer provides. */
  iconUrl: string | undefined;
  isConnected: boolean;
  account: XAccount | undefined;
  connectorId: string | undefined;
};

export type UseChainGroupsOptions = {
  /**
   * Display order by `chainType`. Chains not listed fall to the bottom,
   * sorted alphabetically among themselves. Omit to follow the insertion
   * order of `enabledChains` (driven by `SodaxWalletProvider` config).
   */
  order?: readonly ChainType[];
};

function getSpokeChainKeysByType(chainType: ChainType): readonly SpokeChainKey[] {
  const ids: SpokeChainKey[] = [];
  for (const chainKey of CHAIN_KEYS) {
    if (baseChainInfo[chainKey].type === chainType) ids.push(chainKey);
  }
  return ids;
}

/**
 * Pure helper — extracted for testability. Same logic as `useChainGroups` but
 * without React hook bindings.
 */
export function buildChainGroups(
  enabledChains: readonly ChainType[],
  xConnections: Partial<Record<ChainType, XConnection>>,
  registry: Record<string, ChainServiceFactory> = chainRegistry,
  order?: readonly ChainType[],
): ChainGroup[] {
  const chains = order
    ? [...enabledChains].sort((a, b) => compareChainByOrder(a, b, order))
    : enabledChains;

  return chains.map(chainType => {
    const factory = registry[chainType];
    const connection = xConnections[chainType];
    return {
      chainType,
      chainIds: getSpokeChainKeysByType(chainType),
      displayName: factory?.displayName ?? chainType,
      iconUrl: factory?.iconUrl,
      isConnected: !!connection?.xAccount.address,
      account: connection?.xAccount,
      connectorId: connection?.xConnectorId,
    };
  });
}

/**
 * Returns one `ChainGroup` per enabled chain type. EVM collapses to a single
 * group covering every EVM network via `chainIds`. Use for rendering modal
 * chain-pickers.
 *
 * @example
 * const groups = useChainGroups();
 * return groups.map(g => (
 *   <button key={g.chainType}>
 *     {g.iconUrl && <img src={g.iconUrl} alt="" />}
 *     {g.displayName}
 *     {g.isConnected && <Badge>Connected</Badge>}
 *   </button>
 * ));
 *
 * @example
 * // Deterministic display order — useful when the chain picker must render
 * // hub-first regardless of enabledChains insertion order.
 * const groups = useChainGroups({ order: ['EVM', 'ICON', 'SOLANA'] });
 */
export function useChainGroups(options: UseChainGroupsOptions = {}): ChainGroup[] {
  const enabledChains = useXWalletStore(s => s.enabledChains);
  const xConnections = useXWalletStore(s => s.xConnections);
  const { order } = options;

  return useMemo(
    () => buildChainGroups(enabledChains, xConnections, chainRegistry, order),
    [enabledChains, xConnections, order],
  );
}
