import type { ChainType } from '@sodax/types';
import type { XConnector } from '@/core/XConnector.js';
import { useXWalletStore } from '@/useXWalletStore.js';
import { matchesConnectorIdentifier } from '@/utils/matchConnectorIdentifier.js';

/**
 * Either `connectors`, `chainType`, or both. The union prevents an empty
 * `{}` at the type level — the hook must narrow at least one axis so the
 * return value has a meaningful interpretation (not "is any wallet installed
 * anywhere", which is rarely the intent).
 */
export type UseIsWalletInstalledOptions =
  | {
      /**
       * Wallet brand identifiers (e.g. `'hana'`, `'phantom'`). Matched via
       * case-insensitive substring against `connector.id` and `connector.name` —
       * see {@link matchesConnectorIdentifier}. Returns `true` if ANY identifier
       * matches an installed connector. Mirrors the `connectors` parameter of
       * `useBatchConnect` / `useBatchDisconnect`.
       */
      connectors: readonly string[];
      chainType?: ChainType;
    }
  | {
      connectors?: readonly string[];
      /** Restrict the scan to a single chain. */
      chainType: ChainType;
    };

/**
 * True when at least one connector across the configured chains is installed
 * AND matches the supplied filters. `connectors` and `chainType` AND together;
 * at least one of them must be supplied (enforced at the type level).
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
 *
 * Runtime safety: callers that bypass the compile-time union (e.g. an `as`
 * cast to `{}`) get `false` plus a dev-time warning instead of a thrown
 * error — a hook crashing the render tree over a type-level misuse is
 * worse than returning a conservative default.
 */
export function isAnyConnectorInstalled(
  options: UseIsWalletInstalledOptions,
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>,
): boolean {
  const { connectors: identifiers, chainType } = options as {
    connectors?: readonly string[];
    chainType?: ChainType;
  };

  if (identifiers === undefined && chainType === undefined) {
    console.warn(
      '[useIsWalletInstalled] called without `connectors` or `chainType` — returning `false`. ' +
        'Supply at least one filter.',
    );
    return false;
  }

  // Empty identifier list = explicit "match nothing".
  if (identifiers && identifiers.length === 0) return false;

  const chainsToScan = chainType ? [xConnectorsByChain[chainType]] : Object.values(xConnectorsByChain);

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
