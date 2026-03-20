# packages/sdk — Core SDK

## Mini Map

```
src/
├── swap/              # SwapService (getQuote, createSwapIntent, approve), SolverApiService
├── bridge/            # BridgeService
├── moneyMarket/       # MoneyMarketService (supply, withdraw, borrow, repay), math-utils/
├── staking/           # StakingService, StakingLogic
├── migration/         # MigrationService, IcxMigration, BnUSDMigration, BalnSwap
├── partner/           # PartnerService, PartnerFeeClaimService
├── dex/               # DexService (liquidity pools)
├── backendApi/        # BackendApiService (REST client)
├── shared/
│   ├── entities/Sodax.ts          # ⭐ Main entry — wires all services
│   ├── config/                    # ConfigService, ConfigMapper
│   ├── services/
│   │   ├── spoke/                 # ⭐ SpokeService (dispatcher) + per-chain implementations
│   │   ├── hub/                   # HubService, EvmAssetManager, EvmVaultToken
│   │   ├── intentRelay/           # IntentRelayApiService (xcall relay)
│   │   └── erc-20/                # Erc20Service (approve/allowance)
│   ├── guards.ts                  # Type guards (isEvmSpokeProviderType, etc.)
│   ├── types.ts, constants.ts
│   └── utils/                     # shared-utils, evm-utils, etc.
└── index.ts
```

## Service Class Pattern

All feature services follow this constructor pattern:

```typescript
type ServiceConstructorParams = {
  hubProvider: EvmHubProvider;          // Always required
  configService: ConfigService;         // Always required
  relayerApiEndpoint?: HttpUrl;         // For cross-chain features
  config: FeatureConfigParams | undefined;  // Optional feature-specific config
};

export class FeatureService {
  public readonly config: FeatureServiceConfig;
  public readonly hubProvider: EvmHubProvider;
  public readonly configService: ConfigService;

  constructor(params: ServiceConstructorParams) {
    // Config resolution: explicit config > hub config > defaults
    this.hubProvider = params.hubProvider;
    this.configService = params.configService;
  }
}
```

## Sodax.ts Wiring Order

Services are wired in `Sodax` constructor in this dependency order:
1. `BackendApiService` (no deps)
2. `ConfigService` (depends on BackendApiService)
3. `EvmHubProvider` (depends on ConfigService)
4. All feature services (depend on hubProvider + configService)

## Common Method Patterns

Every feature service exposes these methods (where applicable):

```typescript
// 1. Check allowance (query)
isAllowanceValid<S extends SpokeProviderType>({ params, spokeProvider }): Promise<Result<boolean>>

// 2. Approve token (transaction)
approve<S extends SpokeProviderType, R extends boolean = false>({ params, spokeProvider, raw }): Promise<Result<TxReturnType<S, R>>>

// 3. Create intent (transaction — main action)
createXxxIntent<S extends SpokeProviderType, R extends boolean = false>({ intentParams, spokeProvider, raw }): Promise<Result<[spokeTxHash, hubTxHash]>>

// 4. Estimate gas (static utility)
static estimateGas<T extends SpokeProviderType>(params, spokeProvider): Promise<GetEstimateGasReturnType<T>>
```

**User flow**: `isAllowanceValid()` → `approve()` → `createXxxIntent()` → relay monitors execution

## Result Type Pattern

All async methods return discriminated `Result<T, E>`:
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```
Never throw errors from service methods — always return Result.

## Generic Type Patterns

```typescript
// S = spoke provider type (chain-specific)
// R = raw mode (true = return raw tx, false = return tx hash)
<S extends SpokeProviderType, R extends boolean = false>

// TxReturnType resolves based on S and R
TxReturnType<EvmSpokeProviderType, true>  → EvmRawTransaction
TxReturnType<EvmSpokeProviderType, false> → Hex (tx hash)
```

## Spoke Dispatcher Pattern

`SpokeService` is a static-only class (private constructor) that routes to chain-specific implementations using type guards:

```typescript
// In SpokeService.ts
if (isEvmSpokeProviderType(spokeProvider)) return EvmSpokeService.method(...);
if (isSolanaSpokeProviderType(spokeProvider)) return SolanaSpokeService.method(...);
// ... for each chain
throw new Error('Invalid spoke provider');
```

Type guards are in `shared/guards.ts`.

## Chain-Specific Spoke Service Pattern

```typescript
export class XxxSpokeService {
  private constructor() {}  // Static only, no instances

  public static async estimateGas(rawTx, spokeProvider): Promise<GasType> { ... }
  public static async deposit<R extends boolean = false>(params, spokeProvider, hubProvider, raw?): Promise<TxReturnType<..., R>> { ... }
}
```

Each spoke service has its own deposit params type:
```typescript
export type EvmSpokeDepositParams = { from: Address; to?: HubAddress; token: Hex; amount: bigint; data: Hex; };
export type SolanaSpokeDepositParams = { from: SolanaBase58PublicKey; to?: HubAddress; token: SolanaBase58PublicKey; amount: bigint; data: Hex; };
```

## Raw Spoke Provider (`raw: true`)

When passing `raw: true` to service methods, they return **unsigned transaction data** instead of executing. Used for gas estimation, backend prep, or multi-step flows:

```typescript
const result = await sodax.swaps.createIntent(params, spokeProvider, true); // raw: true
// result.value = [rawTx, intent] instead of [txHash, hubTxHash]
const gas = await SwapService.estimateGas(rawTx, spokeProvider);
```

`constructRawSpokeProvider(config)` in `shared/utils/shared-utils.ts` dispatches on `chain.type` to build the correct raw provider. When adding a new chain, **add a case here too**.

## API Endpoints

- **Solver (swaps)**: `https://api.sodax.com/v1/intent` (prod), staging in `SOLVER_API_ENDPOINTS.md`
- **Relay (xcall)**: `https://xcall-relay.nw.iconblockchain.xyz/` (mainnet)
- **Backend**: configured via `BackendApiConfig` in Sodax constructor

## Detailed Docs

For usage examples and API details, see `docs/` directory:
- `SWAPS.md`, `MONEY_MARKET.md`, `BRIDGE.md`, `STAKING.md` — feature guides
- `HOW_TO_CREATE_A_SPOKE_PROVIDER.md` — spoke/raw provider setup
- `HOW_TO_MAKE_A_SWAP.md` — step-by-step swap tutorial

## Adding a New Feature Module

1. Create `src/[feature]/FeatureService.ts` following the Service Class Pattern
2. Add config type to `SodaxConfig` in `shared/entities/Sodax.ts`
3. Wire service in `Sodax` constructor (after hubProvider + configService)
4. Add public readonly field to `Sodax` class
5. Export from `src/index.ts`
6. If cross-chain: use `SpokeService.deposit()` + `IntentRelayApiService`

## Adding a New Spoke Chain

1. Create `shared/services/spoke/XxxSpokeService.ts` (static class, deposit + estimateGas)
2. Add type guard in `shared/guards.ts` (`isXxxSpokeProviderType`)
3. Add dispatch case in `SpokeService.ts` for each method
4. Add spoke provider type in `packages/types`
5. Add chain config in `packages/types/src/constants/`

## Build & Test

- Built with **tsup** (dual ESM/CJS)
- Tests: `pnpm test` (Vitest, excludes e2e)
- E2E: `pnpm test-e2e`
- Single file: `npx vitest run path/to/test.test.ts`
