# Concentrated Liquidity Utilities Examples

This document provides examples of how to use the concentrated liquidity utilities for PancakeSwap Infinity integration.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Creating Pool Keys](#creating-pool-keys)
3. [Calculating Liquidity Parameters](#calculating-liquidity-parameters)
4. [Price and Tick Utilities](#price-and-tick-utilities)
5. [Complete Integration Example](#complete-integration-example)

## Basic Setup

```typescript
import { createPublicClient, http } from 'viem';
import { sonic } from 'viem/chains';
import {
  calculateLiquidityParams,
  createPoolKey,
  buildPoolKey,
  getParamsForPriceRange,
  getParamsForSpecificPriceRange,
  priceToTick,
  tickToPrice,
  getTickSpacing,
  type PoolKey,
} from '@sodax/sdk';

// Set up viem client
const publicClient = createPublicClient({
  chain: sonic,
  transport: http(),
});

// Contract addresses (replace with actual deployed addresses)
const POOL_MANAGER_ADDRESS = '0x...' as Address;
const DEFAULT_HOOK_ADDRESS = '0x...' as Address;
const TOKEN_A = '0x...' as Address;
const TOKEN_B = '0x...' as Address;
```

## Creating Pool Keys

### Method 1: Manual Pool Key Creation with Known Parameters

```typescript
// When you know the hook address and bitmap
const poolKey = buildPoolKey({
  currency0: TOKEN_A,
  currency1: TOKEN_B,
  hooks: DEFAULT_HOOK_ADDRESS,
  poolManager: POOL_MANAGER_ADDRESS,
  tickSpacing: 60, // For 0.3% fee tier
  hooksBitmap: 0n, // If using a simple hook with no special permissions
});
```

### Method 2: Smart Pool Key Creation with Automatic Hook Bitmap Fetching

```typescript
// Automatically fetch hook bitmap from contract
const poolKey = await createPoolKey({
  currency0: TOKEN_A,
  currency1: TOKEN_B,
  poolManager: POOL_MANAGER_ADDRESS,
  tickSpacing: 60, // For 0.3% fee tier
  defaultHookAddress: DEFAULT_HOOK_ADDRESS,
  publicClient,
});
```

### Method 3: Using Different Fee Tiers

```typescript
// Different fee tiers have different tick spacings
const lowFeePoolKey = await createPoolKey({
  currency0: TOKEN_A,
  currency1: TOKEN_B,
  poolManager: POOL_MANAGER_ADDRESS,
  tickSpacing: 1, // For 0.01% fee tier
  defaultHookAddress: DEFAULT_HOOK_ADDRESS,
  publicClient,
});

const highFeePoolKey = await createPoolKey({
  currency0: TOKEN_A,
  currency1: TOKEN_B,
  poolManager: POOL_MANAGER_ADDRESS,
  tickSpacing: 200, // For 1% fee tier
  defaultHookAddress: DEFAULT_HOOK_ADDRESS,
  publicClient,
});
```

## Calculating Liquidity Parameters

### Method 1: Calculate for a Percentage Price Range

```typescript
// Calculate parameters for a ±10% price range around current price
const amount0Desired = BigInt('1000000000000000000'); // 1 token (18 decimals)
const priceRangePercent = 10; // ±10%

const liquidityParams = await calculateLiquidityParams(
  poolKey,
  amount0Desired,
  priceRangePercent,
  publicClient,
);

console.log('Liquidity Parameters:', {
  amount0: amount0Desired.toString(),
  amount1: liquidityParams.amount1.toString(),
  liquidity: liquidityParams.liquidity.toString(),
  tickLower: liquidityParams.tickLower,
  tickUpper: liquidityParams.tickUpper,
  currentTick: liquidityParams.currentTick,
  currentPrice: liquidityParams.currentPrice,
  priceBA: liquidityParams.priceBA, // Token1/Token0 price
  priceAB: liquidityParams.priceAB, // Token0/Token1 price
});
```

### Method 2: Calculate for Specific Price Range

```typescript
// Calculate parameters for a specific price range
const minPrice = 0.0001; // Minimum price (Token1/Token0)
const maxPrice = 0.0005; // Maximum price (Token1/Token0)

const specificRangeParams = await getParamsForSpecificPriceRange(
  poolKey,
  amount0Desired,
  minPrice,
  maxPrice,
  publicClient,
);

console.log('Specific Range Parameters:', {
  amount0: amount0Desired.toString(),
  amount1: specificRangeParams.amount1.toString(),
  liquidity: specificRangeParams.liquidity.toString(),
  tickLower: specificRangeParams.tickLower,
  tickUpper: specificRangeParams.tickUpper,
  currentPriceBA: specificRangeParams.prices.current.BA,
  currentPriceAB: specificRangeParams.prices.current.AB,
});
```

### Method 3: Using the Wrapper Helper

```typescript
// Use the convenient wrapper that includes price information
const rangeParams = await getParamsForPriceRange(
  poolKey,
  amount0Desired,
  priceRangePercent,
  publicClient,
);

console.log('Price Range Information:', {
  currentPrices: rangeParams.prices.current,
  priceRange: rangeParams.prices.range,
  liquidityDistribution: {
    tickLower: rangeParams.tickLower,
    tickUpper: rangeParams.tickUpper,
    currentTick: rangeParams.currentTick,
  },
});
```

## Price and Tick Utilities

### Converting Between Prices and Ticks

```typescript
// Convert price to tick
const price = 0.0002; // Token1/Token0 price
const tick = priceToTick(price);
console.log(`Price ${price} = Tick ${tick}`);

// Convert tick back to price
const recoveredPrice = tickToPrice(tick);
console.log(`Tick ${tick} = Price ${recoveredPrice}`);

// Get tick spacing for different fee tiers
const spacing100 = getTickSpacing(100);   // 1 (for 0.01% fee)
const spacing500 = getTickSpacing(500);   // 10 (for 0.05% fee)
const spacing3000 = getTickSpacing(3000); // 60 (for 0.3% fee)
const spacing10000 = getTickSpacing(10000); // 200 (for 1% fee)
```

### Snapping Ticks to Valid Spacing

```typescript
import { snapTickToSpacing, priceRangeToTicks } from '@sodax/sdk';

// Snap individual tick to valid spacing
const rawTick = 12345;
const tickSpacing = 60;
const validTick = snapTickToSpacing(rawTick, tickSpacing);
console.log(`Raw tick ${rawTick} snapped to ${validTick}`);

// Convert price range to valid ticks
const minPrice = 0.0001;
const maxPrice = 0.0003;
const { tickLower, tickUpper } = priceRangeToTicks(minPrice, maxPrice, tickSpacing);
console.log(`Price range [${minPrice}, ${maxPrice}] = Ticks [${tickLower}, ${tickUpper}]`);
```

## Complete Integration Example

```typescript
import { 
  ConcentratedLiquidityService,
  calculateLiquidityParams,
  createPoolKey,
  type PoolKey,
} from '@sodax/sdk';
import { createPublicClient, http, parseUnits } from 'viem';
import { sonic } from 'viem/chains';

async function addLiquidityExample() {
  // Setup
  const publicClient = createPublicClient({
    chain: sonic,
    transport: http(),
  });

  // Token and contract addresses
  const TOKEN_A = '0x...' as Address;
  const TOKEN_B = '0x...' as Address;
  const POOL_MANAGER = '0x...' as Address;
  const DEFAULT_HOOK = '0x...' as Address;
  const POSITION_MANAGER = '0x...' as Address;

  try {
    // Step 1: Create pool key
    console.log('Creating pool key...');
    const poolKey: PoolKey = await createPoolKey({
      currency0: TOKEN_A,
      currency1: TOKEN_B,
      poolManager: POOL_MANAGER,
      tickSpacing: 60, // 0.3% fee tier
      defaultHookAddress: DEFAULT_HOOK,
      publicClient,
    });

    // Step 2: Calculate liquidity parameters
    console.log('Calculating liquidity parameters...');
    const amount0Desired = parseUnits('1', 18); // 1 token with 18 decimals
    const priceRangePercent = 5; // ±5% around current price

    const liquidityParams = await calculateLiquidityParams(
      poolKey,
      amount0Desired,
      priceRangePercent,
      publicClient,
    );

    console.log('Liquidity calculation results:', {
      amount0: amount0Desired.toString(),
      amount1Required: liquidityParams.amount1.toString(),
      liquidity: liquidityParams.liquidity.toString(),
      tickRange: [liquidityParams.tickLower, liquidityParams.tickUpper],
      currentTick: liquidityParams.currentTick,
      currentPrice: liquidityParams.currentPrice,
    });

    // Step 3: Use ConcentratedLiquidityService for encoding
    const supplyLiquidityCall = ConcentratedLiquidityService.encodeSupplyLiquidity(
      {
        token0: TOKEN_A,
        token1: TOKEN_B,
        fee: BigInt(poolKey.fee),
        tickLower: BigInt(liquidityParams.tickLower),
        tickUpper: BigInt(liquidityParams.tickUpper),
        amount0Desired: amount0Desired,
        amount1Desired: liquidityParams.amount1,
        amount0Min: (amount0Desired * 95n) / 100n, // 5% slippage
        amount1Min: (liquidityParams.amount1 * 95n) / 100n, // 5% slippage
        recipient: '0x...' as Address, // Your address
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
      },
      POSITION_MANAGER,
    );

    console.log('Encoded supply liquidity call:', supplyLiquidityCall);

    // Step 4: Alternative - using planner pattern for complex operations
    const plannerCall = ConcentratedLiquidityService.encodeSupplyLiquidityWithPlanner(
      poolKey,
      BigInt(liquidityParams.tickLower),
      BigInt(liquidityParams.tickUpper),
      liquidityParams.liquidity,
      amount0Desired,
      liquidityParams.amount1,
      '0x...' as Address, // recipient
      POSITION_MANAGER,
    );

    console.log('Planner-encoded call:', plannerCall);

    return {
      poolKey,
      liquidityParams,
      contractCalls: {
        simple: supplyLiquidityCall,
        planner: plannerCall,
      },
    };

  } catch (error) {
    console.error('Error in liquidity calculation:', error);
    throw error;
  }
}

// Usage
addLiquidityExample()
  .then(result => {
    console.log('Success:', result);
  })
  .catch(error => {
    console.error('Failed:', error);
  });
```

## Error Handling

```typescript
import { ConcentratedLiquidityService } from '@sodax/sdk';

// Initialize service
const clService = new ConcentratedLiquidityService(
  undefined, // Use default config
  hubProvider, // Your hub provider
  'https://api.sodax.com' // Relayer endpoint
);

// Handle results with proper error checking
const result = await clService.supplyLiquidity(liquidityParams, spokeProvider);

if (!result.ok) {
  console.error('Supply liquidity failed:', result.error);
  
  switch (result.error.code) {
    case 'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED':
      console.error('Failed to create intent:', result.error.data);
      break;
    case 'SUPPLY_LIQUIDITY_UNKNOWN_ERROR':
      console.error('Unknown error:', result.error.data);
      break;
    case 'SUBMIT_TX_FAILED':
      console.error('Transaction submission failed:', result.error.data);
      break;
    default:
      console.error('Other error:', result.error);
  }
} else {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log('Success!', { spokeTxHash, hubTxHash });
}
```

## Advanced Usage

### Custom Hook Integration

```typescript
// For pools with custom hooks that require special parameters
const customPoolKey = buildPoolKey({
  currency0: TOKEN_A,
  currency1: TOKEN_B,
  hooks: '0x...' as Address, // Your custom hook
  poolManager: POOL_MANAGER,
  tickSpacing: 60,
  hooksBitmap: 0x1000n, // Custom hook permissions bitmap
});
```

### Price Impact Analysis

```typescript
// Analyze price impact for different position sizes
const sizes = [
  parseUnits('0.1', 18),
  parseUnits('1', 18),
  parseUnits('10', 18),
];

for (const size of sizes) {
  const params = await calculateLiquidityParams(poolKey, size, 10, publicClient);
  const ratio = Number(params.amount1) / Number(size);
  console.log(`Size: ${size.toString()}, Ratio: ${ratio.toFixed(6)}, Current Price: ${params.currentPrice}`);
}
```

This documentation provides comprehensive examples for using the concentrated liquidity utilities. The utilities handle all the complex mathematics and provide clean, type-safe interfaces for working with PancakeSwap Infinity concentrated liquidity pools. 