## Executive Summary
This branch refactors the SDK around a simpler principle: **the request payload’s “source chain key” is the main input that drives everything** (which chain code runs, and what types TypeScript expects).

See [`packages/sdk/CHAIN_ID_MIGRATION.md`](../CHAIN_ID_MIGRATION.md) for the chain-constants rename table and [`packages/sdk/CLAUDE.md`](../CLAUDE.md) for the per-service rules and error-handling convention referenced below.

- **Spoke providers are eliminated**: the SDK no longer requires per-chain `*SpokeProvider` classes to carry logic or enable typing.
- **Spoke logic is consolidated into services**: spoke-specific behavior now lives in per-chain spoke services, owned by a single `SpokeService` instance.
- **Raw transaction flows are clarified**: “raw vs signed” is now a discriminated union on the params — `raw: true` vs `raw: false` — paired with a chain-narrowed `walletProvider` slot that TypeScript forbids when `raw: true` and requires when `raw: false`.
- **Chain IDs are unified**: consumers migrate from many `*_CHAIN_ID` constants to a single `ChainKeys.*` namespace.
- **All async SDK methods return `Result<T>`**: every public async method on `SpokeService`, `BackendApiService`, and every feature service (`SwapService`, `BridgeService`, `MoneyMarketService`, `StakingService`, `MigrationService`, `AssetService`, `ConcentratedLiquidityService`, `PartnerFeeClaimService`) now returns `Promise<Result<T>>`. Module-specific error unions (`MoneyMarketError<Code>`, `IntentError<Code>`, `StakingError<Code>`, `BridgeError<Code>`, `MigrationError<Code>`, `AssetServiceError<Code>`, `ConcentratedLiquidityError<Code>`, `RelayError`, and five Partner error types) are deleted along with their type-guard helpers; the underlying error message (`result.error.message`) and `.cause` are the new contract.

The most significant breaking changes are in `@sodax/types` (exports/layout and chain constants) and in SDK integration points that previously passed “spoke providers” rather than “(payload + chain key + wallet-provider slot)”.

---
## Old vs New (quick examples)
These examples are short and focused on integration shape.

### Example A: “Pick a chain” (routing)
**Old approach**: select the chain by constructing a chain-specific spoke provider (for example an EVM vs Solana vs Sui provider) and pass that provider into feature methods.

**New approach**: select the chain by setting `srcChain` / `srcChainKey` in the payload (typically using `ChainKeys.*`). The SDK routes to the correct spoke service internally.

### Example B: Signed tx vs raw tx (wallet provider rules)
**Old approach**: use an optional `raw?: boolean` flag to switch between "build raw tx" and "execute signed tx". This shape makes it difficult for TypeScript to enforce when a `walletProvider` is required or forbidden.

**New approach**: the `raw` tag and the `walletProvider` slot are a single discriminated union. `raw: true` forbids `walletProvider` (compile error if passed); `raw: false` requires it and narrows its type to the chain-appropriate provider interface:

- **Signed execution**: `{ raw: false, walletProvider: <chain-correct provider> }` → SDK signs/executes, returns a tx hash
- **Raw transaction**: `{ raw: true }` → SDK returns an unsigned transaction payload

Chain-specific narrowing of `walletProvider` still flows from `srcChain` / `srcChainKey`. See Concept 3 for the mechanism (`WalletProviderSlot<K, Raw>`).

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
- **Typed wallet-provider slots** (`WalletProviderSlot<K, Raw>`):
  - for signed execution (`raw: false`), a chain-specific `walletProvider` is required
  - for raw transaction building (`raw: true`), `walletProvider` is forbidden

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
The old API style used an optional `raw?: boolean` flag in many places, which made it hard to model “raw vs signed” as distinct call shapes and hard for TypeScript to enforce the rule that a signed call needs a `walletProvider` while a raw call must not receive one.

The branch ships a concrete **discriminated union** that pairs the `raw` tag with a chain-narrowed `walletProvider` slot. The mode is still declared by the `raw` field, but the pairing with `walletProvider` is now enforced by the type system at the call site — no runtime checks required.

### Why the old approach was ambiguous
When the mode is controlled by an optional boolean and `walletProvider` is always optional, TypeScript ends up with a single “maybe raw, maybe signed” call shape. That ambiguity makes it difficult to enforce “walletProvider required vs forbidden” without runtime validation or unsafe casts.

### How it works today: `WalletProviderSlot<K, Raw>`

The discriminated union lives in [`packages/types/src/common/common.ts`](../../types/src/common/common.ts) (search `WalletProviderSlot`):

```ts
export type WalletProviderSlot<K extends SpokeChainKey | ChainType, Raw extends boolean> =
  Raw extends true
    ? { raw: true; walletProvider?: never }
    : { raw: false; walletProvider: GetWalletProviderType<K> };
```

Three rules this enforces at compile time:

1. **`raw: true`** → `walletProvider` is **forbidden** (TypeScript’s `?: never` rejects any value). The method returns a raw transaction payload — `TxReturnType<K, true>`, e.g. `EvmRawTransaction`, `IconRawTransaction`, `SolanaRawTransaction`.
2. **`raw: false`** → `walletProvider` is **required**, and its type is narrowed to the chain-appropriate provider interface via `GetWalletProviderType<K>` (e.g. `IEvmWalletProvider` for `ChainKeys.ETHEREUM_MAINNET`, `ISolanaWalletProvider` for `ChainKeys.SOLANA_MAINNET`). The method signs/broadcasts and returns a transaction hash — `TxReturnType<K, false>`.
3. **Chain narrowing flows from `K`** — when the caller passes a literal chain key (like `ChainKeys.SOLANA_MAINNET`), `K` is preserved as the specific literal, so `GetWalletProviderType<K>` resolves to the exact chain interface (`ISolanaWalletProvider`), not a broad union.

Service methods pick up this slot by intersecting it with their action params, e.g.:

```ts
export type SwapActionParams<K extends SpokeChainKey, Raw extends boolean> = {
  params: CreateIntentParams<K>;
  skipSimulation?: boolean;
  timeout?: number;
  fee?: PartnerFee;
} & WalletProviderSlot<K, Raw>;
```

Generic inference does the rest: callers write

```ts
// Raw — walletProvider is a compile error if passed
sodax.swap.createIntent({ params, raw: true });

// Signed — walletProvider is required and chain-narrowed
sodax.swap.createIntent({ params, raw: false, walletProvider: evmWp });
```

Return shape follows symmetrically — `TxReturnType<C extends SpokeChainKey | ChainType, Raw extends boolean>` (defined in the same file) is chain-family-conditional: EVM chains yield `EvmReturnType<Raw>`, Solana yields `SolanaReturnType<Raw>`, etc. Wrapped in `Promise<Result<TxReturnType<K, Raw>>>`, the final caller gets:

```ts
// raw: true + ChainKeys.ETHEREUM_MAINNET
Promise<Result<EvmRawTransaction>>

// raw: false + ChainKeys.ETHEREUM_MAINNET
Promise<Result<Hash>>  // `0x…` tx hash
```

This is the shipped shape, not a direction. A further simplification — dropping the `raw` flag entirely and inferring mode purely from `walletProvider` presence/absence — remains possible as a follow-up; because the discriminant is already a union, that change would be type-only with no runtime impact.

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

## Concept 5: `Result<T>` propagation
### What changed
Every public async method across the SDK now returns `Promise<Result<T>>`. Functions no longer throw across the service boundary; the result is a tagged success/failure envelope.

### Shape
`Result<T, E = Error | unknown>` is defined in `packages/types/src/common/common.ts`:

```ts
export type Result<T, E = Error | unknown> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### Where it applies
Every async public method on `SpokeService`, `BackendApiService`, and every feature service (`SwapService`, `BridgeService`, `MoneyMarketService`, `StakingService`, `MigrationService`, `AssetService`, `ConcentratedLiquidityService`, `PartnerFeeClaimService`). Private helpers may still throw; the outer `try/catch` at each method’s boundary absorbs those and converts them to `{ ok: false, error }`.

### Propagation pattern
The SDK uses one idiom throughout:

- Forwarding a sub-Result without re-wrapping: `if (!sub.ok) return sub;`
- Success: `return { ok: true, value: … };`
- Outer catch at every method’s boundary: `catch (error) { return { ok: false, error }; }`
- Inner catches that tag a specific phase wrap the underlying error via `new Error('PHASE_FAILED', { cause: error })` — see Concept 6 for the CODE/prose rule.

There is no `toResult` / `tryCatch` / `safeCall` helper. Explicit `try/catch` is deliberate — it keeps the error origin visible at the call site and matches the pattern set by `SpokeService`.

### What replaces module error types
Code that used to branch on a typed discriminator:

```ts
// Before
if (!result.ok && result.error.code === 'CREATE_SUPPLY_INTENT_FAILED') { … }
```

now reads the Error message (and/or the `.cause`):

```ts
// After
if (!result.ok && result.error instanceof Error &&
    result.error.message === 'CREATE_SUPPLY_INTENT_FAILED') { … }
```

The CODE is still present — it has moved from a typed discriminator on `error.code` to the `Error` message string (see Concept 6).

---

## Concept 6: Error-message convention
### What changed
With module error unions gone, the SDK needed a predictable way to tell phase failures apart from precondition failures. Two forms of `new Error(…)` are now the convention.

### Two forms, one rule
**CODE form — `new Error('PHASE_FAILED', { cause: underlying })`**
Use for **phase tags** — errors that originate in a `catch` block and wrap a lower-level failure. `PHASE` is `SCREAMING_SNAKE_CASE`, ending in `_FAILED` or `_TIMEOUT`. Examples: `SUBMIT_TX_FAILED`, `POST_EXECUTION_FAILED`, `SIMULATION_FAILED`, `RELAY_TIMEOUT`, `HTTP_REQUEST_FAILED`, `GET_POOL_REWARD_CONFIG_FAILED`.

```ts
try {
  const v = await this.doWork();
  return { ok: true, value: v };
} catch (error) {
  return { ok: false, error: new Error('DO_WORK_FAILED', { cause: error }) };
}
```

**Prose form — `new Error('<human sentence>')`**
Use for **preconditions / invariants** — input validation, unsupported chain type, config lookup failures. Typically paired with `invariant()` or an early-return guard before any async call. There is no underlying error to wrap — the prose *is* the information.

```ts
invariant(params.amount > 0n, 'Amount must be greater than 0');
return { ok: false, error: new Error('Approve only supported for EVM/Stellar spoke chains') };
```

### Rule of thumb
If the error comes from a `catch` block, it is CODE form. If it comes from an `invariant`-style guard before any async call, it is prose.

### `Error.cause`
ES2022 `Error.cause` is used whenever a lower-level error exists (most CODE-form sites). Attach it always — it preserves the original stack and structure. Omit it only when the failure condition is boolean/status-derived with no wrapped throw (`SIMULATION_FAILED` from a `value === false` check, `RELAY_TIMEOUT` from a polling-loop giveup, `TRANSACTION_VERIFICATION_FAILED` from a non-`success` status).

See [`packages/sdk/CLAUDE.md`](../CLAUDE.md) for the full convention with worked examples.

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
- **`ChainId` type renamed to `SpokeChainKey`** — same value union (chain-key strings), exported from `@sodax/types`. Consumers that typed params as `ChainId` must switch.
- **`XToken.xChainId` → `XToken.chainKey`** — the field on tokens now matches the `ChainKey` vocabulary used across the SDK.
- **`AddressType` renamed to `BtcAddressType`** — Bitcoin-specific address-type union (`'P2PKH' | 'P2SH' | 'P2WPKH' | 'P2TR'`). The generic `AddressType` name is no longer exported; Bitcoin wallet-provider implementations must import the new name.
- **Wallet-provider `chainType` discriminants** — every `I*WalletProvider` now declares `readonly chainType: '<CHAIN>'` as a literal field (`'EVM'`, `'BITCOIN'`, `'SOLANA'`, `'STELLAR'`, `'SUI'`, `'ICON'`, `'INJECTIVE'`, `'STACKS'`, `'NEAR'`). Consumers can discriminate at runtime without `instanceof`. Custom implementations must add the field.
- **`RpcConfig` shape** — previously had chain-name properties (`.bitcoin`, `.stellar`, `.solana`, `.sui`, `.stacks`) and permissive string indexing. Now a mapped type keyed by `ChainKey` **values** (so `rpcConfig[ChainKeys.SONIC_MAINNET]`), with `BitcoinRpcConfig` for Bitcoin, `StellarRpcConfig` for Stellar, and `string` (the RPC URL) for every other chain. A latent typing bug in the old definition — where conditional branches silently collapsed to `string` because the mapped-type iterated property names instead of value literals — is fixed in the new shape.
- **`IConfigApi` now returns `Promise<Result<T>>`** — every method on the backend-API contract (`getChains`, `getSwapTokens`, `getSwapTokensByChainId`, `getMoneyMarketTokens`, `getMoneyMarketTokensByChainId`). Any external implementer must update its method signatures to match.
- **Module error types deleted** — `MoneyMarketError<Code>`, `IntentError<Code>`, `StakingError<Code>`, `BridgeError<Code>`, `MigrationError<Code>`, `AssetServiceError<Code>`, `ConcentratedLiquidityError<Code>`, `RelayError`, plus five Partner error types and their type-guard helpers (`isIntentCreationFailedError`, `isIntentSubmitTxFailedError`, `isIntentPostExecutionFailedError`, `isWaitUntilIntentExecutedFailed`, `isIntentCreationUnknownError`, `isSetSwapPreferenceError`, `isCreateIntentAutoSwapError`, `isWaitIntentAutoSwapError`, `isUnknownIntentAutoSwapError`). See Concept 5 for the `Result<T>` replacement and Concept 6 for how the error CODE now appears on `error.message`.

If you maintain wrappers/enums around chain identifiers, they should now accept/emit the **string keys from `ChainKeys`**.

---

## This PR is a preview (expect follow-ups)
This branch represents a big direction change, but it’s still a draft of the final SDK v2 shape.

- Expect more polishing and follow-up PRs as the API settles.
- Longer-term, the direction is that the SDK becomes more “self-contained” (with `Sodax` owning the service graph and config), and the split between `@sodax/sdk` and `@sodax/types` may continue to evolve.