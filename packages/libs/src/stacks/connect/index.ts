/**
 * Bundled re-exports of @stacks/connect.
 *
 * TODO(#1070): @stacks/connect is bundled here via tsup `noExternal` to work
 * around a Turbopack scope-hoisting cycle that crashes Next.js 16 client
 * builds. Unused transitive deps (@reown/appkit*, @stacks/connect-ui,
 * cross-fetch) are stubbed out — SODAX uses browser extensions (Leather,
 * Xverse) directly via `request({ provider }, ...)`, not WalletConnect or
 * the built-in UI picker.
 *
 * Remove this subpath and revert consumers to `@stacks/connect` imports when
 * the upstream cycle is fixed.
 */

export { request, disconnect } from '@stacks/connect';
export type { StacksProvider } from '@stacks/connect';
