<!-- packages/sdk/docs/DEX.md -->
# DEX (Concentrated Liquidity)

The DEX portion of the SDK provides helpers for asset wrapping/deposits and concentrated liquidity (CL) operations.
All DEX features are accessible through the `dex` property of a `Sodax` instance.

```typescript
import { Sodax } from "@sodax/sdk";

const sodax = new Sodax();

// Asset operations (deposit/withdraw/allowance)
const assetService = sodax.dex.assetService;

// Concentrated liquidity operations (positions/pools/rewards)
const clService = sodax.dex.clService;
```

## AssetService

### isAllowanceValid

Checks whether the asset manager has sufficient allowance for a deposit action.

**Parameters:**
- `params`: `CreateAssetDepositParams`
- `spokeProvider`: The source chain spoke provider

**Returns:** `Promise<Result<boolean, AssetServiceError<'ALLOWANCE_CHECK_FAILED'>>>`

**Note**: For Stellar-based operations, allowance works differently:
- **Source Chain (Stellar)**: `isAllowanceValid` checks trustlines automatically.
- **Destination Chain (Stellar)**: You must manually check trustlines before executing DEX operations. See [Stellar Trustline Requirements](./STELLAR_TRUSTLINE.md).

**Example:**
```typescript
const result = await sodax.dex.assetService.isAllowanceValid({
  params: {
    asset: "0x1234...",
    amount: 1000000000000000000n,
    poolToken: "0xabcd...",
  },
  spokeProvider,
});

if (result.ok && result.value) {
  console.log("Allowance is sufficient");
} else {
  console.log("Approval or trustline is required");
}
```

### approve

Approves token spending for a deposit action (or requests a trustline on Stellar).

**Parameters:**
- `params`: `CreateAssetDepositParams`
- `spokeProvider`: The source chain spoke provider
- `raw`: Whether to return raw transaction data (optional)

**Returns:** `Promise<Result<TxReturnType<S, R>, AssetServiceError<'APPROVAL_FAILED'>>>`

**Note**: For Stellar-based operations:
- **Source Chain (Stellar)**: `approve` requests trustlines automatically.
- **Destination Chain (Stellar)**: You must establish trustlines before receiving assets. See [Stellar Trustline Requirements](./STELLAR_TRUSTLINE.md).

**Example:**
```typescript
const result = await sodax.dex.assetService.approve({
  params: {
    asset: "0x1234...",
    amount: 1000000000000000000n,
    poolToken: "0xabcd...",
  },
  spokeProvider,
  raw: false,
});

if (result.ok) {
  console.log("Approval tx:", result.value);
}
```

### deposit

Wraps assets and creates a deposit intent, then relays it to the hub chain.

**Parameters:**
- `params`: `CreateAssetDepositParams`
- `spokeProvider`: The source chain spoke provider
- `timeout`: Optional relay timeout (default: 60 seconds)

**Returns:** `Promise<Result<[SpokeTxHash, HubTxHash], AssetServiceError<AssetServiceErrorCode>>>`

**Example:**
```typescript
const result = await sodax.dex.assetService.deposit({
  params: {
    asset: "0x1234...",
    amount: 1000000000000000000n,
    poolToken: "0xabcd...",
  },
  spokeProvider,
  timeout: 30000,
});

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log("Deposit complete:", { spokeTxHash, hubTxHash });
}
```

### withdraw

Withdraws assets from a pool and relays the action to the hub chain.

**Parameters:**
- `params`: `CreateAssetWithdrawParams`
- `spokeProvider`: The source chain spoke provider
- `timeout`: Optional relay timeout (default: 60 seconds)

**Returns:** `Promise<Result<[SpokeTxHash, HubTxHash], AssetServiceError<AssetServiceErrorCode>>>`

**Example:**
```typescript
const result = await sodax.dex.assetService.withdraw({
  params: {
    poolToken: "0xabcd...",
    asset: "0x1234...",
    amount: 500000000000000000n,
  },
  spokeProvider,
});

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log("Withdraw complete:", { spokeTxHash, hubTxHash });
}
```

### getDeposit

Fetches the deposited balance for a pool token on the hub wallet derived from the spoke address.

**Example:**
```typescript
const depositBalance = await sodax.dex.assetService.getDeposit(
  "0xabcd...", // poolToken
  spokeProvider,
);
```

### getWrappedAmount / getUnwrappedAmount

Convert between underlying assets and wrapped pool tokens (ERC4626).

**Example:**
```typescript
const wrappedAmount = await sodax.dex.assetService.getWrappedAmount(
  "0xpoolToken...", // dexToken (ERC4626)
  1000000000000000000n,
);

const unwrappedAmount = await sodax.dex.assetService.getUnwrappedAmount(
  "0xpoolToken...", // dexToken (ERC4626)
  1000000000000000000n,
);
```

### getTokenWrapAction / getTokenUnwrapAction

Builds contract calls for wrapping/unwrapping without executing them.

**Example:**
```typescript
const wrapCalls = await sodax.dex.assetService.getTokenWrapAction(
  "0xasset...", // original asset address
  spokeProvider.chainConfig.chain.id,
  1000000000000000000n,
  "0xpoolToken...",
  "0xrecipient...",
);

const unwrapCalls = await sodax.dex.assetService.getTokenUnwrapAction(
  spokeProvider.chainConfig.chain.id,
  "0xasset...",
  1000000000000000000n,
  "0xuser...",
  "0xrecipient...",
);
```

## Concentrated Liquidity (CL)

All CL operations are available through `sodax.dex.clService`.

### supplyLiquidity

Creates a new position and supplies liquidity using pool token balances.
In typical flows, you obtain pool tokens first via `assetService.deposit()` (or use existing pool token balances).

**Returns:** `Promise<Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>>`

**Example:**
```typescript
const result = await sodax.dex.clService.supplyLiquidity({
  params: {
    poolKey,
    tickLower: -60000n,
    tickUpper: 60000n,
    liquidity: 1000000n,
    amount0Max: 1000000000000000000n,
    amount1Max: 1000000000000000000n,
    sqrtPriceX96,
  },
  spokeProvider,
});
```

### increaseLiquidity / decreaseLiquidity

Increase or reduce liquidity for an existing position.

**Example:**
```typescript
await sodax.dex.clService.increaseLiquidity({
  params: {
    poolKey,
    tokenId: 1n,
    tickLower: -60000n,
    tickUpper: 60000n,
    liquidity: 500000n,
    amount0Max: 500000000000000000n,
    amount1Max: 500000000000000000n,
    sqrtPriceX96,
  },
  spokeProvider,
});

await sodax.dex.clService.decreaseLiquidity({
  params: {
    poolKey,
    tokenId: 1n,
    liquidity: 250000n,
    amount0Min: 0n,
    amount1Min: 0n,
  },
  spokeProvider,
});
```

### burnPosition

Burns a position NFT and collects the remaining amounts.

**Example:**
```typescript
const result = await sodax.dex.clService.burnPosition({
  params: {
    poolKey,
    tokenId: 1n,
    amount0Min: 0n,
    amount1Min: 0n,
  },
  spokeProvider,
});
```

### claimRewards

Claims rewards for a position.

**Example:**
```typescript
const result = await sodax.dex.clService.claimRewards({
  params: {
    poolKey,
    tokenId: 1n,
    tickLower: -60000n,
    tickUpper: 60000n,
  },
  spokeProvider,
});
```

### Pool and Position Data

- `getPools()` returns configured pool keys.
- `getAssetsForPool(spokeProvider, poolKey)` returns token metadata for a pool.
- `getPoolData(poolKey, publicClient)` fetches on-chain pool state.
- `getPositionInfo(tokenId, publicClient)` fetches position data and unclaimed fees.
- `getPoolRewardConfig(poolKey, publicClient)` fetches reward configuration from pool hooks.

**Example:**
```typescript
const pools = sodax.dex.clService.getPools();
const poolKey = pools[0];

const assets = sodax.dex.clService.getAssetsForPool(spokeProvider, poolKey);
const poolData = await sodax.dex.clService.getPoolData(poolKey, publicClient);
const positionInfo = await sodax.dex.clService.getPositionInfo(1n, publicClient);

const rewardConfig = await sodax.dex.clService.getPoolRewardConfig(poolKey, publicClient);
if (rewardConfig.ok) {
  console.log("Reward config:", rewardConfig.value);
}
```

### Utility Helpers

The CL service includes helpers for price/tick and liquidity math:
- `calculateLiquidityFromAmounts`
- `calculateAmount1FromAmount0`
- `calculateAmount0FromAmount1`
- `priceToTick`

## Types

### AssetService Types

```typescript
export type CreateAssetDepositParams = {
  asset: OriginalAssetAddress;
  amount: bigint;
  poolToken: Address;
  dst?: DestinationParamsType;
};

export type CreateAssetWithdrawParams = {
  poolToken: Address;
  asset: OriginalAssetAddress;
  amount: bigint;
  dst?: DestinationParamsType;
};
```

### Concentrated Liquidity Types

```typescript
export type ConcentratedLiquiditySupplyParams = {
  poolKey: PoolKey;
  tickLower: bigint;
  tickUpper: bigint;
  liquidity: bigint;
  amount0Max: bigint;
  amount1Max: bigint;
  sqrtPriceX96: bigint;
};

export type ConcentratedLiquidityIncreaseLiquidityParams = {
  poolKey: PoolKey;
  tokenId: bigint;
  tickLower: bigint;
  tickUpper: bigint;
  liquidity: bigint;
  amount0Max: bigint;
  amount1Max: bigint;
  sqrtPriceX96: bigint;
};

export type ConcentratedLiquidityDecreaseLiquidityParams = {
  poolKey: PoolKey;
  tokenId: bigint;
  liquidity: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
};

export type ConcentratedLiquidityBurnPositionParams = {
  poolKey: PoolKey;
  tokenId: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
};

export type ConcentratedLiquidityClaimRewardsParams = {
  poolKey: PoolKey;
  tokenId: bigint;
  tickLower: bigint;
  tickUpper: bigint;
};
```

## Error Handling

All methods return a `Result` type:

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Common AssetService error codes:
- `ALLOWANCE_CHECK_FAILED`
- `APPROVAL_FAILED`
- `CREATE_DEPOSIT_INTENT_FAILED`
- `CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED`
- `SUBMIT_TX_FAILED`
- `RELAY_TIMEOUT`

Common CL error codes:
- `CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED`
- `CREATE_INCREASE_LIQUIDITY_INTENT_FAILED`
- `CREATE_DECREASE_LIQUIDITY_INTENT_FAILED`
- `CREATE_BURN_POSITION_INTENT_FAILED`
- `CREATE_CLAIM_REWARDS_INTENT_FAILED`
- `GET_POOL_REWARD_CONFIG_FAILED`
- `SUBMIT_TX_FAILED`
- `RELAY_TIMEOUT`

## Usage Flow

1. **Check allowance** using `assetService.isAllowanceValid()`
2. **Approve** using `assetService.approve()` if needed (trustlines are handled automatically for Stellar as source)
3. **For Stellar destination chains**: check and establish trustlines manually (see [Stellar Trustline Requirements](./STELLAR_TRUSTLINE.md))
4. **Deposit** using `assetService.deposit()` to obtain pool token balances
5. **Supply liquidity** using `clService.supplyLiquidity()` (or increase an existing position)
6. **Manage position** using increase/decrease/burn/claim
7. **Withdraw** using `assetService.withdraw()` when needed
