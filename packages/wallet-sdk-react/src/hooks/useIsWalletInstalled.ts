import type { ChainType } from '@sodax/types';
import type { XConnector } from '@/core/XConnector.js';
import { assert } from '@/shared/guards.js';
import { useXWalletStore } from '@/useXWalletStore.js';
import { matchesConnectorIdentifier } from '@/utils/matchConnectorIdentifier.js';

export type UseIsWalletInstalledOptions = {
  /**
   * Wallet identifiers to match. Each entry is compared case-insensitively
   * against `connector.id` and `connector.name` (substring). Returns `true`
   * if ANY identifier matches an installed connector. Mirrors the
   * `connectors` parameter of `useBatchConnect` / `useBatchDisconnect`.
   */
  connectors?: readonly string[];
  /** Restrict the scan to a single chain. */
  chainType?: ChainType;
};

/**
 * True when at least one connector across the configured chains is installed
 * AND matches the supplied filters. `connectors` and `chainType` AND together;
 * omitting both returns `true` if any installed connector exists anywhere.
 *
 * @example
 * // Single wallet across every chain
 * const isHanaInstalled = useIsWalletInstalled({ connectors: ['hana'] });
 *
 * @example
 * // Any of these wallets
 * const hasMultiChainWallet = useIsWalletInstalled({ connectors: ['hana', 'okx', 'phantom'] });
 *
 * @example
 * // Any wallet on a specific chain
 * const hasBitcoin = useIsWalletInstalled({ chainType: 'BITCOIN' });
 *
 * @example
 * // AND — Hana specifically on EVM
 * const hanaOnEvm = useIsWalletInstalled({ connectors: ['hana'], chainType: 'EVM' });
 */
export function useIsWalletInstalled(options: UseIsWalletInstalledOptions): boolean {
  const xConnectorsByChain = useXWalletStore(s => s.xConnectorsByChain);
  return isAnyConnectorInstalled(options, xConnectorsByChain);
}

/**
 * Pure helper backing `useIsWalletInstalled`. Extracted for testability
 * without mounting React.
 */
export function isAnyConnectorInstalled(
  options: UseIsWalletInstalledOptions,
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>,
): boolean {
  assert(
    options.connectors !== undefined || options.chainType !== undefined,
    'useIsWalletInstalled: requires at least one of `connectors` or `chainType`',
  );

  const identifiers = options.connectors;

  // Empty identifier list = explicit "match nothing".
  if (identifiers && identifiers.length === 0) return false;

  const chainsToScan = options.chainType
    ? [xConnectorsByChain[options.chainType]]
    : Object.values(xConnectorsByChain);

  for (const chainConnectors of chainsToScan) {
    if (!chainConnectors) continue;
    for (const connector of chainConnectors) {
      if (!connector.isInstalled) continue;
      if (!identifiers) return true;
      if (identifiers.some(id => matchesConnectorIdentifier(connector, id))) return true;
    }
  }
  return false;
}
