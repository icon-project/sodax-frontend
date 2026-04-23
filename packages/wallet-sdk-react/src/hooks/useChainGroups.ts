import { useMemo } from 'react';
import { baseChainInfo, type ChainId, type ChainType } from '@sodax/types';
import type { XAccount, XConnection } from '@/types/index.js';
import { useXWalletStore } from '@/useXWalletStore.js';
import { chainRegistry, type ChainServiceFactory } from '@/chainRegistry.js';

export type ChainGroup = {
  chainType: ChainType;
  /** All ChainIds that share this ChainType — e.g. every EVM network for `chainType: 'EVM'`. */
  chainIds: readonly ChainId[];
  displayName: string;
  /** Icon URL from chainRegistry. `undefined` when SDK doesn't ship a default — consumer provides. */
  iconUrl: string | undefined;
  isConnected: boolean;
  account: XAccount | undefined;
  connectorId: string | undefined;
};

function getChainIdsByType(chainType: ChainType): readonly ChainId[] {
  const ids: ChainId[] = [];
  for (const [id, info] of Object.entries(baseChainInfo)) {
    if (info.type === chainType) ids.push(id as ChainId);
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
): ChainGroup[] {
  return enabledChains.map(chainType => {
    const factory = registry[chainType];
    const connection = xConnections[chainType];
    return {
      chainType,
      chainIds: getChainIdsByType(chainType),
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
 */
export function useChainGroups(): ChainGroup[] {
  const enabledChains = useXWalletStore(s => s.enabledChains);
  const xConnections = useXWalletStore(s => s.xConnections);

  return useMemo(() => buildChainGroups(enabledChains, xConnections), [enabledChains, xConnections]);
}
