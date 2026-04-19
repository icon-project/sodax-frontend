---
name: refactor-feature-service-strong-typing
description: Refactor a SODAX SDK feature service (any class whose description comment contains `@namespace SodaxFeatures`) to a strongly-typed public API where `srcChainKey: K extends SpokeChainKey` narrows `walletProvider` via `GetWalletProviderType<K>` and `raw: R extends boolean` decides whether `walletProvider` is required. Use when refactoring SwapService, BridgeService, MoneyMarketService, StakingService, MigrationService, DexService, ConcentratedLiquidityService, AssetService, PartnerService, PartnerFeeClaimService, BackendApiService, or any other service in `packages/sdk/src/**/*Service.ts` marked with `@namespace SodaxFeatures`.
---

# Refactor a SodaxFeatures Service to Strong Typing

A feature service's public API is the SDK's contract with dApp developers. The goal of this refactor is: **passing an EVM `ChainKey` must compile-time force an EVM wallet provider; passing `raw: true` must compile-time forbid a wallet provider; passing `raw: false` must compile-time require one.**

Use this skill when you're asked to improve typing on any `*Service.ts` file under `packages/sdk/src/` whose class doc comment contains `@namespace SodaxFeatures`.

## Discovery: find the services in scope

```bash
grep -rl "@namespace SodaxFeatures" packages/sdk/src
```

As of this writing the list is: `SwapService`, `BridgeService`, `MoneyMarketService`, `StakingService`, `MigrationService`, `DexService`, `ConcentratedLiquidityService`, `AssetService`, `PartnerService`, `PartnerFeeClaimService`, `BackendApiService`. SwapService is already refactored — use it ([packages/sdk/src/swap/SwapService.ts](packages/sdk/src/swap/SwapService.ts)) as the canonical reference implementation while working through the others.

## Building blocks — reuse, don't reinvent

These primitives already exist in the repo. Do not recreate them:

- [`ChainKey` / `SpokeChainKey`](packages/types/src/chains/chain-keys.ts) — string-literal union of all 20 chains.
- [`ChainType`](packages/types/src/chains/chain-keys.ts) — `'EVM' | 'SOLANA' | 'STELLAR' | 'ICON' | 'SUI' | 'INJECTIVE' | 'STACKS' | 'NEAR' | 'BITCOIN'`.
- [`GetChainType<C>`](packages/sdk/src/shared/types/spoke-types.ts) — type-level `ChainKey → ChainType`.
- [`getChainType(chainKey)`](packages/sdk/src/shared/utils/shared-utils.ts) — runtime equivalent.
- **[`GetWalletProviderType<C>`](packages/types/src/wallet/wallet.ts)** — the load-bearing primitive. Maps a `ChainKey` literal to the matching wallet-provider interface (`IEvmWalletProvider`, `ISolanaWalletProvider`, …). Used in every narrowing.
- `getIntentRelayChainId(chainKey)` — forward map for runtime validation of `Intent`-shaped inputs.
- Runtime chain-type guards: `isEvmChainKeyType`, `isSonicChainKeyType`, `isStellarChainKeyType`, `isBitcoinChainKeyType`, `isHubChainKeyType`, …

## Design decisions (apply to every service)

1. **Hoist `srcChainKey` to the top level of every tx-producing method's params.** Do not keep the chain nested inside a `params.srcChain` field. `srcChainKey` is the generic anchor. If downstream sub-services (e.g. `EvmSolverService`) still need a `srcChain`-bearing shape, define an internal `*WithSrcChain` type and populate it inside the service before invoking the sub-service.

2. **Collapse split methods.** If the service has both `action` (raw=false) and `rawAction` (raw=true) as separate methods, merge them into one generic `action<K, R>`. The return type uses `TxReturnType<K, R>`; the compiler picks the correct branch from the call site's `raw` value.

3. **Forbid `walletProvider` when `raw: true`** via `{ walletProvider?: never }` — not just "optional". A `never` branch catches accidentally-passing-both bugs at compile time.

4. **For methods that take an opaque `Intent`-like payload carrying an `IntentRelayChainId`** (e.g. `cancelIntent`): require the caller to also pass `srcChainKey: K` explicitly. The `IntentRelayChainId` (a bigint union) cannot narrow to a specific `ChainKey` at the type level. Assert `getIntentRelayChainId(srcChainKey) === intent.srcChain` at runtime; throw on mismatch.

5. **Default `R = false`.** When absent, the caller is expected to execute — that matches the common path. Raw usage is the opt-in.

## Core type primitives (copy-paste template)

Place these near the top of the service file. They can be promoted to a shared module later if more than one service adopts them — for now keep them colocated.

```ts
// Narrows walletProvider based on srcChainKey + raw:
//   R=true  → walletProvider forbidden (typed as never)
//   R=false → walletProvider required, narrowed via GetWalletProviderType<K>
export type WalletProviderSlot<K extends SpokeChainKey, R extends boolean> = R extends true
  ? { walletProvider?: never }
  : R extends false
    ? { walletProvider: GetWalletProviderType<K> }
    : never;

// Unified params shape for all tx-producing methods. P is the feature-specific payload.
export type FeatureActionParams<
  K extends SpokeChainKey,
  R extends boolean,
  P = FeatureInputParams, // e.g. CreateIntentParams, BridgeParams, SupplyParams
> = {
  srcChainKey: K;
  params: P;
  raw?: R;
  skipSimulation?: boolean;
  fee?: PartnerFee;          // only if the feature supports partner fees
  timeout?: number;          // only if the feature awaits relay
} & WalletProviderSlot<K, R>;

// Read-only-with-wallet methods (e.g. isAllowanceValid). No raw flag.
export type FeatureAllowanceParams<K extends SpokeChainKey> = {
  srcChainKey: K;
  params: FeatureInputParams;
  walletProvider: GetWalletProviderType<K>;
};

// Methods that take an Intent-like payload: srcChainKey is explicit, not inferred.
export type FeatureCancelParams<K extends SpokeChainKey, R extends boolean> = {
  srcChainKey: K;
  intent: Intent;            // or the feature's equivalent opaque payload
  raw?: R;
  skipSimulation?: boolean;
} & WalletProviderSlot<K, R>;
```

## Method signature pattern

```ts
// Executes the full user flow (incl. relay). R is always false — user needs a wallet.
action<K extends SpokeChainKey>(
  p: FeatureActionParams<K, false>,
): Promise<Result<[...ExecutedReturn], FeatureError<FeatureErrorCode>>>;

// Prepares the spoke-side tx. R is generic so callers choose raw or executed output.
createAction<K extends SpokeChainKey, R extends boolean = false>(
  p: FeatureActionParams<K, R>,
): Promise<Result<[TxReturnType<K, R>, ...metadata], FeatureError<'CREATION_FAILED'>>>;

// Approval (ERC20 allowance / Stellar trustline / etc).
approve<K extends SpokeChainKey, R extends boolean = false>(
  p: FeatureActionParams<K, R>,
): Promise<Result<TxReturnType<K, R>>>;

// Read-only allowance check.
isAllowanceValid<K extends SpokeChainKey>(
  p: FeatureAllowanceParams<K>,
): Promise<Result<boolean>>;

// Cancel/revert a previously-created intent.
cancel<K extends SpokeChainKey, R extends boolean = false>(
  p: FeatureCancelParams<K, R>,
): Promise<Result<TxReturnType<K, R>, FeatureError<'CANCEL_FAILED'>>>;
```

## Step-by-step refactor procedure

Work one service at a time. Commit between services.

### 1. Read the service end-to-end
- Enumerate every public method.
- For each, note: what `raw` currently controls, what `walletProvider` currently is typed as, whether the chain comes from `params.srcChain` or elsewhere, whether there's a split `action` / `rawAction` pair to collapse.
- Find every downstream call-site within the method body that currently accepts an un-narrowed `IWalletProvider` union — these will stop needing `as unknown as ...` casts after the refactor at the public API, but may still need casts where the generic `K` can't be narrowed through runtime guards (see "Gotchas" below).

### 2. Add the type primitives
Declare `WalletProviderSlot<K, R>`, `FeatureActionParams<K, R, P>`, `FeatureAllowanceParams<K>`, `FeatureCancelParams<K, R>` (or the feature-specific equivalents) at the top of the service file, right after the existing user-facing param/input types.

### 3. Split the user-input type from the internal type
If the current user-facing input type has a `srcChain: SpokeChainKey` field, remove it from the public type and create a sibling `InputWithSrcChain = Input & { srcChain: SpokeChainKey }` for internal use by sub-services (`EvmSolverService`, `SonicSpokeService`, etc.). Inside the method body, construct the internal shape by spreading: `{ ...userParams, srcChain: srcChainKey }`.

### 4. Rewrite each method signature
- Replace `(_params: OldParams<Raw>)` with `<K extends SpokeChainKey, R extends boolean = false>(_params: FeatureActionParams<K, R>)`.
- Update the return type's `TxReturnType<SpokeChainKey, Raw>` → `TxReturnType<K, R>`.
- Collapse `action` / `rawAction` pairs into one generic method; delete the now-redundant one.

### 5. Rewrite method bodies
Replace the runtime-cast pattern:
```ts
const raw = (_params as { raw?: R }).raw;
const walletActionParams = raw === true
  ? { raw: true } as const
  : { raw: false, walletProvider: (_params as unknown as { walletProvider: unknown }).walletProvider } as const;
```
with direct typed access:
```ts
const raw = (_params.raw ?? false) as R;
const walletActionParams = raw === true
  ? ({ raw: true } as const)
  : ({ raw: false, walletProvider: (_params as FeatureActionParams<K, false>).walletProvider } as const);
```

The `(_params as FeatureActionParams<K, false>)` cast is narrow and safe — we've runtime-proven `raw === false`.

### 6. Update sub-service contracts (if any)
If the service calls into helpers like `EvmSolverService.constructCreateIntentData(createIntentParams, ...)` which expect a `srcChain`-bearing shape, update the helper's parameter type from `Input` to `InputWithSrcChain` (step 3). Mirror this wherever `SonicSpokeService` / chain-specific services consume the same shape.

### 7. Handle `cancelIntent`-style methods
Require `srcChainKey: K` explicitly on the params. Inside the method body add:
```ts
invariant(
  getIntentRelayChainId(srcChainKey) === intent.srcChain,
  `srcChainKey (${srcChainKey}) does not match intent.srcChain (${intent.srcChain})`,
);
```

### 8. Clean up stale imports
Remove `IWalletProvider`, `OptionalWalletActionParamType`, `OptionalRaw`, `OptionalSkipSimulation`, `OptionalTimeout`, `OptionalFee`, `Prettify`, `getChainKeyFromRelayChainId`, etc. if they become unused. Also remove helper types that existed solely to support the old pattern (e.g. the old `XxxParams<Raw>` union).

### 9. Run `checkTs` on just the service file
```bash
cd packages/sdk && npx tsc --noEmit 2>&1 | grep -E "your/service/path/YourService"
```
Pre-existing errors in other files on the branch are not in scope for this refactor — confirm they were there before your changes with `git stash` + rerun.

### 10. Write the dedicated test file
Create `<YourService>.refactor.test.ts` next to the service. Use the structure in [packages/sdk/src/swap/SwapService.refactor.test.ts](packages/sdk/src/swap/SwapService.refactor.test.ts). Tests to include:

- **Type-level** (`expectTypeOf` + `@ts-expect-error` guarded by `if (false as boolean) { ... }`):
  - `WalletProviderSlot<K, true>` equals `{ walletProvider?: never }`.
  - `WalletProviderSlot<K, false>` requires the correct chain-narrowed provider for at least EVM, Solana, Stellar, Bitcoin.
  - Each method rejects: mismatched wallet provider, walletProvider-with-raw-true, missing-walletProvider-with-raw-false.
- **Runtime** (heavy mocking):
  - Each chain-branch hits the right sub-service (Sonic/EVM/Stellar/Bitcoin paths).
  - `raw` is forwarded correctly; `walletProvider` is omitted downstream when `raw: true`.
  - `Intent`-style methods throw when `srcChainKey` mismatches the intent.

## Implementation gotchas

### Gotcha 1 — Sonic hub branch needs a cast

Inside an `if (isHubChainKeyType(srcChainKey) && isSonicChainKeyType(srcChainKey))` branch, TypeScript does NOT narrow the generic `K` to `SonicChainKey`. `_params.walletProvider` is still typed as `GetWalletProviderType<K>` (the full union). When passing to `SonicSpokeService.createAndExecuteSwapIntent` (which expects `IEvmWalletProvider`), cast:

```ts
const sonicWalletProvider = (_params as FeatureActionParams<K, false>)
  .walletProvider as unknown as GetWalletProviderType<'EVM'>;
```

Leave a short comment explaining the runtime-narrowing-vs-generic mismatch.

### Gotcha 2 — Final deposit / sendMessage payload cast

When constructing the final params object for `this.spokeService.deposit<K, R>(...)` or `this.spokeService.sendMessage<K, R>(...)`, the object literal won't satisfy `DepositParams<K, R>` / `SendMessageParams<K, R>` because of the discriminated `walletProvider` union. Use `as unknown as DepositParams<K, R>` (with the double cast) — this is the same pattern `SpokeService` already uses internally.

### Gotcha 3 — Barrel init + static methods in tests

Service files import downstream helpers (`SonicSpokeService`, `EvmSolverService`, `HubService`) via the SDK barrel `'../index.js'`. Under Vitest, barrel re-export ordering can make `vi.spyOn(SonicSpokeService, 'staticMethod')` target a DIFFERENT module instance than the one the service sees — your spy doesn't fire.

Fix: mock the module at its source path with `vi.mock`, using `vi.hoisted` so the factory can reference the mock functions:

```ts
const mocks = vi.hoisted(() => ({
  staticMethod: vi.fn(),
  anotherStatic: vi.fn(),
}));
vi.mock('../shared/services/spoke/SonicSpokeService.js', () => ({
  SonicSpokeService: {
    staticMethod: mocks.staticMethod,
    anotherStatic: mocks.anotherStatic,
  },
}));
```

Repeat for `EvmSolverService` (`./EvmSolverService.js`), `HubService` (`../shared/services/hub/HubService.js`), etc. Your tests then refer to `mocks.staticMethod.mockResolvedValueOnce(...)`.

### Gotcha 4 — Quiet the type-level negative tests

Tests that do `// @ts-expect-error` followed by `void svc.method({...})` will at runtime try to call the real method and print stderr noise (because the mocks aren't set up for those arguments). Wrap the call in an unreachable branch so it's only type-checked:

```ts
it('rejects mismatched walletProvider', () => {
  const svc = makeSwapService();
  if (false as boolean) {
    // @ts-expect-error — Solana provider can't satisfy an EVM chain key.
    void svc.createIntent({ srcChainKey: 'ethereum', params, raw: false, walletProvider: solanaProvider });
  }
});
```

`if (false as boolean)` is specifically typed `boolean` (not literal `false`) so TS still checks the body for type errors.

### Gotcha 5 — Pre-existing branch breakage is out of scope

The `refactor/sdks-eliminate-spoke-provider` branch has pre-existing unrelated type and module errors. Confirm each error you see is caused by your refactor (not the branch) by stashing your changes and re-running the check:

```bash
git stash && npx tsc --noEmit 2>&1 | grep "YourService" ; git stash pop
```

Only fix errors that are NEW relative to the baseline.

## What NOT to change

- Do not touch `apps/node/**`, `apps/web/**`, `apps/demo/**`, or `packages/dapp-kit/**` call sites in the same PR. Those are stale-on-this-branch anyway; fixing them is a separate concern and would balloon the diff. Leave them for follow-up work.
- Do not promote the type primitives to a shared module until a second service has adopted them. Premature extraction before there are two users locks in a shape you haven't validated.
- Do not fix unrelated pre-existing typecheck errors (see Gotcha 5) unless they block your refactor.

## Done definition

A service refactor is complete when:

1. Every public method that takes a chain + wallet accepts `srcChainKey: K` at the top level, not a nested `params.srcChain`.
2. `walletProvider` is typed via `GetWalletProviderType<K>` (never `IWalletProvider` union).
3. `raw: true` forbids `walletProvider` (tested with `@ts-expect-error`).
4. `raw: false` / default requires `walletProvider` of the correct chain type (tested with `@ts-expect-error`).
5. Any `action` + `rawAction` pair is collapsed into one generic method.
6. Any `cancelIntent`-style method has explicit `srcChainKey` and a runtime `getIntentRelayChainId(srcChainKey) === intent.srcChain` assertion.
7. `<YourService>.refactor.test.ts` exists and all tests pass (`pnpm vitest run src/.../YourService.refactor.test.ts`).
8. `npx tsc --noEmit` shows no NEW type errors attributable to your diff (pre-existing branch errors can remain — see Gotcha 5).

## Reference

See [packages/sdk/src/swap/SwapService.ts](packages/sdk/src/swap/SwapService.ts) for the canonical implementation and [packages/sdk/src/swap/SwapService.refactor.test.ts](packages/sdk/src/swap/SwapService.refactor.test.ts) for the test structure.
