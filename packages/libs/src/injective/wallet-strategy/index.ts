/**
 * Bundled re-export of @injectivelabs/wallet-strategy.
 *
 * TODO(#1070): @injectivelabs/wallet-strategy is bundled here via tsup
 * `noExternal` because it contains `await import('@injectivelabs/wallet-ledger')`
 * and siblings. Turbopack static-analyzes these dynamic imports and tries to
 * resolve `wallet-ledger` at build time — wallet-ledger's CryptoJS UMD has
 * dead AMD `define(["./core"])` branches that Turbopack parses as real
 * imports → build fails. The 5 hardware-wallet packages are stubbed to empty
 * modules; SODAX only uses browser wallets so they are never called at runtime.
 *
 * Remove this subpath and revert consumers to `@injectivelabs/wallet-strategy`
 * imports when the upstream CryptoJS UMD is fixed.
 */

export { WalletStrategy } from '@injectivelabs/wallet-strategy';
