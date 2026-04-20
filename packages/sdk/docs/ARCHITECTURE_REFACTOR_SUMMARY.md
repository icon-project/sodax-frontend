## Executive Summary
This branch refactors the SDK around a simpler principle: **the request payload’s “source chain key” is the main input that drives everything** (which chain code runs, and what types TypeScript expects).

- **Spoke providers are eliminated**: the SDK no longer requires per-chain `*SpokeProvider` classes to carry logic or enable typing.
- **Spoke logic is consolidated into services**: spoke-specific behavior now lives in per-chain spoke services, owned by a single `SpokeService` instance.
- **Raw transaction flows are clarified**: instead of relying on an ambiguous optional `raw?: boolean`, the SDK makes “raw vs signed” a clear choice that TypeScript can enforce (“wallet provider required vs not allowed”).
- **Chain IDs are unified**: consumers migrate from many `*_CHAIN_ID` constants to a single `ChainKeys.*` namespace.

The most significant breaking changes are in `@sodax/types` (exports/layout and chain constants) and in SDK integration points that previously passed “spoke providers” rather than “(payload + chain key + wallet-provider slot)”.

---
## Old vs New (quick examples)
These examples are short and focused on integration shape.

### Example A: “Pick a chain” (routing)
**Old approach**: select the chain by constructing a chain-specific spoke provider (for example an EVM vs Solana vs Sui provider) and pass that provider into feature methods.

**New approach**: select the chain by setting `srcChain` / `srcChainKey` in the payload (typically using `ChainKeys.*`). The SDK routes to the correct spoke service internally.

### Example B: Signed tx vs raw tx (wallet provider rules)
**Old approach**: use an optional `raw?: boolean` flag to switch between “build raw tx” and “execute signed tx”. This shape makes it difficult for TypeScript to enforce when a `walletProvider` is required or forbidden.

**New approach**: use an explicit `raw: true` or `raw: false` call shape with strict wallet-provider rules:

- `raw: false` → you **must** pass a chain-correct `walletProvider`
- `raw: true` → you **must not** pass a `walletProvider` (you’re asking the SDK to build unsigned tx data)

This is enforced by types via `WalletProviderSlot<K, R>` and is driven by the source chain key (`srcChain` / `srcChainKey`).

### Example C: Chain constants
**Old approach**: import and use individual chain ID constants (`SONIC_MAINNET_CHAIN_ID`, `ARBITRUM_MAINNET_CHAIN_ID`, …).

**New approach**: import and use `ChainKeys` (`ChainKeys.SONIC_MAINNET`, `ChainKeys.ARBITRUM_MAINNET`, …).

For a direct mapping, see `packages/sdk/CHAIN_ID_MIGRATION.md`.

## Concept 1: Elimination of Spoke Providers
### What changed
All chain-specific `*SpokeProvider` classes were removed from the SDK’s core architecture. Previously, a spoke provider acted as a container that bundled:

- a wallet provider implementation
- a chain configuration
- chain-specific helper logic (and often type narrowing by class type)

This abstraction is gone. The SDK no longer expects callers to construct or pass spoke provider instances to drive the flow.

### How it works now (implementation)
The SDK now relies on two simple building blocks:

- **Source chain keys in payloads**:
  - swaps use `params.srcChain`
  - spoke helpers use `srcChainKey`
- **Typed “bullet providers” (wallet-provider slots)**:
  - for signed execution, a chain-specific `walletProvider` is required
  - for raw transaction building, `walletProvider` is forbidden

At runtime, the SDK routes actions by chain key using `getChainType(chainKey)` (from `@sodax/types`) and dispatches into the correct per-chain spoke service.

### How exactly do source chain keys allow us to narrow down the chain type now that spoke providers are gone?
The short version: **if you pass a specific chain key, TypeScript can “figure out the rest”.**

In the swap flow:

- `CreateIntentParams<K extends SpokeChainKey>` includes `srcChain: K`.
- That same `K` is used to determine what wallet provider type is expected, and what transaction type comes back.

When a caller supplies a literal chain key (for example `ChainKeys.ETHEREUM_MAINNET`), TypeScript keeps it as a specific value type (not just “some string”). From that one piece of information, the types can narrow:

- the chain family via `GetChainType<K>` (EVM vs ICON vs SOLANA vs …)
- the correct wallet provider interface via `GetWalletProviderType<K>`
- the correct raw transaction return shape via `TxReturnType<K, true>`

So instead of “the provider class tells us what chain we’re on”, it’s now “the payload’s chain key tells us what chain we’re on”.

---

## Concept 2: Stateful Spoke Services
### What changed
Logic that used to live inside spoke providers has been moved into spoke services. These services are now treated as **long-lived instances** owned by a single SDK “agent” (`Sodax`) instead of being little helper objects created around each call.

### How it’s implemented
The SDK now constructs and wires dependencies once, then reuses them:

- `Sodax` creates:
  - `BackendApiService` (for config fetches and backend endpoints)
  - `ConfigService` (runtime config + cached lookup tables)
  - `EvmHubProvider` (hub chain access)
  - `SpokeService` (routing facade + per-chain spoke services)
- Feature services (swap / bridge / money market / staking / dex / partner / migration) depend on `SpokeService` + `ConfigService` rather than on spoke providers.

`SpokeService` itself owns one per-chain-family service instance (EVM, Sonic/hub, ICON, Sui, Solana, Stellar, Injective, Near, Stacks, Bitcoin) and provides a typed router (`getSpokeService`) that selects the appropriate instance based on chain key.

### What specific configurations are required when initializing the new spoke service instances?
At the architectural level, “initializing spoke services” is now a responsibility of `Sodax` (or of an integrator constructing equivalent components). The required configuration is therefore the set of dependencies `Sodax` builds and shares:

- **`SodaxConfig` (base + overrides)**:
  - provides defaults for hub addresses, relay/solver endpoints, supported chains/tokens, etc.
  - can be deep-merged with overrides at construction time
- **`BackendApiService` configuration**:
  - drives dynamic configuration via `getAllConfig()` and related endpoints
- **`ConfigService`** (constructed from the above):
  - validates chain keys and token addresses at runtime
  - provides chain/token lookup structures (supported tokens per chain, relay chain-id maps, etc.)
- **Hub provider configuration**:
  - required to derive hub wallet abstraction addresses and interact with hub contracts

Per-chain spoke services are then created either:

- **Config-backed** (they receive `ConfigService` because they need addresses/tokens/relay mappings), or
- **Lightweight** (they don’t need config lookups)

Net effect: instead of “a provider object per user per chain”, the SDK favors “one `Sodax` instance that owns the whole service graph”, configured once and reused.

### Note on the “hubAssets / constants” cleanup
Part of this refactor is removing older “static tables” (for example, the old `hubAssets`-style structures that lived under `@sodax/types` constants).

**What you do now** is rely on `ConfigService` as the central source of truth:

- it can load a newer config from the backend (`initialize()`), with a safe fallback to the packaged defaults
- it exposes “is this token supported / is this chain key valid?” checks and lookup helpers
- feature flows use those lookups instead of reaching into old global constant maps

---

## Concept 3: Raw Transaction Handling
### What changed
The old API style used an optional `raw?: boolean` flag in many places, which made it hard to model “raw vs signed” as distinct call shapes. This refactor re-encodes the distinction so that TypeScript can reliably enforce:

- **raw mode**: return unsigned/raw transaction data, and do not accept a wallet provider
- **signed mode**: execute/sign as needed, and require a chain-correct wallet provider

### Why did the old approach of using an optional raw property make it nearly impossible to cleanly narrow down whether a wallet provider was required?
If `raw` is optional, TypeScript often ends up treating it as “maybe true, maybe false”. When that happens, it can’t confidently enforce rules like “wallet provider required only when raw is false”, because it can’t tell which mode you meant.

The practical symptom is either runtime checks like `if (!('walletProvider' in params)) throw ...`, or callers reaching for casts/`any`.

### How it works now (cleaner methodology)
The SDK ties raw/signed behavior to the method call shape:

- `K extends SpokeChainKey` (source chain key)
- `R extends boolean` (raw mode)

Then a shared helper type (`WalletProviderSlot<K, R>`) encodes the rule:

- when `R` is `true`, `walletProvider` is forbidden (`walletProvider?: never`)
- when `R` is `false`, `walletProvider` is required and chain-specific (`GetWalletProviderType<K>`)

In `SwapService.createIntent`, this shows up as:

- `params.srcChain: K` drives chain-family and wallet typing
- `raw: R` drives whether a wallet provider exists at all
- the method returns `TxReturnType<K, R>` so raw vs signed has different return shapes

Operationally, the implementation itself does split the work into distinct “raw vs signed” code paths (for example, hub-chain swap intent creation uses separate raw vs execute helpers), while the public API stays ergonomic and strongly typed. In other words:

- **Internally**: distinct raw vs execute methods are used where appropriate.
- **Externally**: callers select the branch by providing a literal `raw: true` or `raw: false`, and TypeScript enforces the correct wallet-provider requirement.

---

## Concept 4: Chain Keys Migration
### What changed
The previous pattern exported many individual constants like `SONIC_MAINNET_CHAIN_ID`, `ARBITRUM_MAINNET_CHAIN_ID`, etc. This was simplified into a single namespace object:

- `ChainKeys.SONIC_MAINNET`
- `ChainKeys.ARBITRUM_MAINNET`
- …

### How it’s implemented
`@sodax/types` defines:

- `ChainKeys` as a `const` object of string chain keys
- `ChainKey` as the union of `ChainKeys` values

The SDK (and integrators) import `ChainKeys` and use its members rather than importing dozens of separate constants. A dedicated reference mapping exists in `packages/sdk/CHAIN_ID_MIGRATION.md`.

### Why this change was necessary
- **Smaller, more maintainable export surface**: fewer top-level constants, less churn.
- **Better typing**: `ChainKey` is derived from the single source of truth.
- **Simpler extension**: adding a chain becomes a single addition to `ChainKeys` rather than multiple scattered exports.

---

## Types package: most significant breaking changes
Integrators upgrading `@sodax/types` should expect these breaking changes to impact imports and type usage:

- **Removal of the old constants index**:
  - the previous `packages/types/src/constants/index.ts` export surface was deleted
  - code importing `*_CHAIN_ID` (or other “constants index” exports) must migrate to `ChainKeys.*` and to the new chain/token modules
- **Re-organization into domain modules**:
  - chain keys, chain metadata, and token catalogs now live under clearer modules (not a single giant “constants” barrel)
  - imports may need to be updated to new entrypoints
- **Renames / new entrypoints you may have relied on implicitly**:
  - several domains are now available as explicit modules (e.g. `chains`, `swap`, `wallet`, etc.)
  - Bitcoin types are exposed under `bitcoin` (not `btc`)
- **Chain-key-driven wallet typing**:
  - the recommended way to express “wallet provider for chain X” is `GetWalletProviderType<ChainKey>`
  - when you pass a specific `srcChain`/`srcChainKey`, TypeScript can infer the correct provider interface automatically

If you maintain wrappers/enums around chain identifiers, they should now accept/emit the **string keys from `ChainKeys`**.

---

## This PR is a preview (expect follow-ups)
This branch represents a big direction change, but it’s still a draft of the final SDK v2 shape.

- Expect more polishing and follow-up PRs as the API settles.
- Longer-term, the direction is that the SDK becomes more “self-contained” (with `Sodax` owning the service graph and config), and the split between `@sodax/sdk` and `@sodax/types` may continue to evolve.

