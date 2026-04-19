---
name: sdk-feature-service
description: Guide for creating or refactoring SDK feature services (swap, bridge, money market, etc.) in the SODAX SDK. Enforces unified parameter pattern across allowance, approval, action, and raw action methods. Use when creating a new feature service, refactoring an existing one, or adding methods to a service in packages/sdk.
---

# SDK Feature Service Pattern

Every feature service (SwapService, BridgeService, MoneyMarketService, etc.) follows a standard method structure with a **unified parameter type**.

## Core Principle

All primary methods on a feature service accept the **same inner params type**, varying only the `Raw` generic constraint. This lets callers build one params object and pass it to any method in the flow (check allowance -> approve -> execute).

## Required Method Set

Each feature service exposes these primary methods (names vary by feature):

| Method | Purpose | Raw constraint | Uses walletProvider | Uses fee/timeout |
|--------|---------|---------------|--------------------|-----------------| 
| `isAllowanceValid` | Read-only check | `boolean` (unconstrained) | No | No |
| `approve` | Approval transaction | `R extends boolean` (caller decides) | When `R = false` | No |
| `action` (e.g. `swap`) | Execute full flow | `false` (always executes) | Yes | Yes |
| `rawAction` (e.g. `createRawIntent`) | Return raw tx data | `true` (never executes) | No | Yes |

## Unified Parameter Type

Define one **inner params type** per feature. All primary methods accept it (or a union with related types like limit orders).

```typescript
// The inner type — non-distributive, used in all method signatures
export type FeatureParamsInner<C extends SpokeChainKey, Raw extends boolean = boolean> = Prettify<
  {
    params: FeatureActionParams<C>; // The feature-specific action parameters
  } & OptionalRaw<Raw>
    & OptionalSkipSimulation
    & OptionalFee
    & OptionalTimeout
    & OptionalWalletActionParamType<C, Raw>
>;

// The distributed type — public API surface for per-chain narrowing
export type FeatureParams<C extends SpokeChainKey, Raw extends boolean = boolean> = C extends C
  ? FeatureParamsInner<C, Raw>
  : never;
```

### How Raw constrains the type

- `Raw = boolean` (default): `walletProvider` is optional. Used for read-only methods.
- `Raw = false`: `walletProvider` is **required**. Used for methods that execute transactions.
- `Raw = true`: `walletProvider` is **absent**. Used for methods that return raw tx data.

### Method signatures

```typescript
// Read-only: Raw unconstrained — caller can pass any params object
isAllowanceValid<C extends SpokeChainKey>(_params: FeatureParamsInner<C>): Promise<Result<boolean>>

// Approval: Raw parameterized — preserves raw/walletProvider discrimination
approve<C extends SpokeChainKey, R extends boolean = false>(_params: FeatureParamsInner<C, R>): Promise<Result<TxReturnType<C, R>>>

// Action (executed): Raw = false — walletProvider required
action<C extends SpokeChainKey>(_params: FeatureParamsInner<C, false>): Promise<Result<...>>

// Raw action: Raw = true — no walletProvider
rawAction<C extends SpokeChainKey>(_params: FeatureParamsInner<C, true>): Promise<Result<...>>
```

### Supporting multiple action param types (e.g. swap + limit orders)

When a service supports multiple related action types, use a union:

```typescript
isAllowanceValid<C>(_params: SwapParamsInner<C> | LimitOrderParamsInner<boolean, C>): Promise<...>
approve<C, R>(_params: SwapParamsInner<C, R> | LimitOrderParamsInner<R, C>): Promise<...>
```

The action methods typically accept only their specific type:
```typescript
swap<C>(_params: SwapParamsInner<C, false>): Promise<...>
createRawIntent<C>(_params: SwapParamsInner<C, true>): Promise<...>
createLimitOrder<C>(_params: LimitOrderParamsInner<false, C>): Promise<...>
```

## Method Implementation Pattern

### Chain branching order

Always check hub chain first (Sonic is both hub and EVM):

```typescript
try {
  // 1. Hub chain (Sonic) — must come before EVM since Sonic is EVM type
  if (isHubChainKeyType(params.srcChain) && isSonicChainKeyType(params.srcChain)) { ... }

  // 2. EVM spoke chains
  if (isEvmChainKeyType(params.srcChain)) { ... }

  // 3. Non-EVM chains (Stellar, Solana, etc.) as needed
  if (isStellarChainKeyType(params.srcChain)) { ... }

  // 4. Default: unsupported or no-op
  return { ok: true, value: true };
} catch (error) {
  return { ok: false, error };
}
```

### WalletActionParams forwarding

When forwarding `raw`/`walletProvider` to downstream services, extract once and spread:

```typescript
const walletActionParams = _params.raw === true
  ? ({ raw: true } as const)
  : ({ raw: false, walletProvider: _params.walletProvider } as const);

// Then spread into each call:
await Erc20Service.approve({
  token: ...,
  ...walletActionParams,
} as unknown as Erc20ApproveParams<R>);
```

The `as unknown as TargetType<R>` cast is needed because TypeScript cannot narrow the generic `GetWalletProviderType<C>` (all wallet providers) to a chain-specific provider type through runtime guards.

### Accessing chain-specific services

Use `this.spokeService` (a `SpokeService` instance) — never accept `spokeProvider` as a parameter:

```typescript
this.spokeService.evmSpokeService.getPublicClient(chainId)
this.spokeService.sonicSpokeService.publicClient
this.spokeService.stellarSpokeService.hasSufficientTrustline(...)
```

## Util Methods

Methods that don't fit the primary four (e.g. `getQuote`, `getIntent`, `estimateGas`) can have their own parameter types. Only the primary allowance/approval/action/rawAction methods must share the unified type.
