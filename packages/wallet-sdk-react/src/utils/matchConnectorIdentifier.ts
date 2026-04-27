import type { IXConnector } from '@/types/interfaces.js';

const SHORT_IDENTIFIER_THRESHOLD = 3;
const warnedShortIdentifiers = new Set<string>();

/**
 * Case-insensitive substring match of `identifier` against `connector.id` and
 * `connector.name`. Shared by `useBatchConnect`, `useBatchDisconnect`, and
 * `useIsWalletInstalled` so user-supplied wallet identifiers (e.g. `'hana'`,
 * `'phantom'`) resolve to connector instances the same way across all three.
 *
 * Intent: identifier is a **wallet brand name** — the same brand often surfaces
 * with different ids per chain (IconHanaXConnector has `id='hana'`; the EVM
 * Hana EIP-6963 connector comes through as `id='io.hana.wallet'`), and
 * substring matching is what lets `['hana']` cover both without forcing the
 * consumer to enumerate ids. For the same reason there is no `exact` mode —
 * ids are not a stable public contract (many come from upstream libs like
 * `@hot-labs/near-connect`, `@creit.tech/stellar-wallets-kit`, wagmi EIP-6963,
 * `@solana/wallet-adapter-react`), and pinning to them would be fragile.
 *
 * When the target is a **specific connector** rather than a brand, prefer the
 * explicit path:
 *
 * ```ts
 * const connectors = useXConnectors('BITCOIN');
 * const okx = connectors.find(c => c.id === 'okx-bitcoin');
 * if (okx) await disconnect('BITCOIN');
 * ```
 *
 * Short identifiers (fewer than 3 chars) emit a one-time dev-mode warning
 * because substring matching on short strings produces false positives — a
 * disconnect scoped to `'ok'` would also disconnect any connector whose name
 * happens to contain "ok".
 */
export function matchesConnectorIdentifier(connector: IXConnector, identifier: string): boolean {
  const needle = identifier.toLowerCase();

  if (
    needle.length > 0 &&
    needle.length < SHORT_IDENTIFIER_THRESHOLD &&
    !warnedShortIdentifiers.has(needle)
  ) {
    warnedShortIdentifiers.add(needle);
    console.warn(
      `[matchesConnectorIdentifier] identifier "${identifier}" is ${needle.length} chars — substring matching on short strings frequently hits unintended connectors. Use a more distinctive wallet brand name, or match a single connector via useXConnectors(chainType).find(c => c.id === '...') directly.`,
    );
  }

  return connector.id.toLowerCase().includes(needle) || connector.name.toLowerCase().includes(needle);
}
