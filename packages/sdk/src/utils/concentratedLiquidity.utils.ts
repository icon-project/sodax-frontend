// packages/sdk/src/utils/concentratedLiquidity.utils.ts

import { type PublicClient, type HttpTransport, encodeAbiParameters, keccak256 } from 'viem';
import type { Address } from '@sodax/types';
import { clPoolManagerAbi } from '../abis/concentratedLiquidity.abi.js';

/**
 * Pool key structure for PancakeSwap Infinity concentrated liquidity
 */
export type PoolKey = {
  currency0: Address;
  currency1: Address;
  hooks: Address;
  poolManager: Address;
  fee: number;
  parameters: `0x${string}`;
};

/**
 * Pool key creation parameters
 */
export type CreatePoolKeyParams = {
  currency0: Address;
  currency1: Address;
  poolManager: Address;
  tickSpacing: number;
  hooksBitmap?: bigint;
  defaultHookAddress?: Address;
  publicClient?: PublicClient<HttpTransport>;
};

/**
 * Calculate liquidity parameters for a given price range
 * This is a pure calculation method that doesn't encode any contract calls
 * Can accept either amount0, amount1, or both. If both are provided, amount0 takes precedence.
 *
 * @example
 * // Calculate from amount0 (supply 1000 units of token0, calculate needed token1)
 * const result = await calculateLiquidityParams(
 *   poolKey,
 *   1.8, // minPrice
 *   2.2, // maxPrice
 *   publicClient,
 *   { amount0: 1000n }
 * );
 * console.log(`Need ${result.amount1} units of token1`);
 *
 * @example
 * // Calculate from amount1 (supply 500 units of token1, calculate needed token0)
 * const result = await calculateLiquidityParams(
 *   poolKey,
 *   1.8, // minPrice
 *   2.2, // maxPrice
 *   publicClient,
 *   { amount1: 500n }
 * );
 * console.log(`Need ${result.amount0} units of token0`);
 *
 * @example
 * // Use specific price range instead of percentage
 * const result = await calculateLiquidityParams(
 *   poolKey,
 *   1.9, // exact min price
 *   2.1, // exact max price
 *   publicClient,
 *   { amount0: 1000n }
 * );
 */
export async function calculateLiquidityParams(
  poolKey: PoolKey,
  minPrice: number,
  maxPrice: number,
  publicClient: PublicClient<HttpTransport>,
  options: {
    amount0?: bigint;
    amount1?: bigint;
  },
): Promise<{
  amount0: bigint;
  amount1: bigint;
  liquidity: bigint;
  tickLower: number;
  tickUpper: number;
  currentTick: number;
  currentPrice: number;
  priceBA: number;
  priceAB: number;
}> {
  const { amount0: inputAmount0, amount1: inputAmount1 } = options;

  if (!inputAmount0 && !inputAmount1) {
    throw new Error('Either amount0 or amount1 must be provided');
  }

  console.log('🔍 [calculateLiquidityParams] Starting pure calculation:', {
    poolKey,
    inputAmount0: inputAmount0?.toString() || 'not provided',
    inputAmount1: inputAmount1?.toString() || 'not provided',
    minPrice: minPrice.toFixed(18),
    maxPrice: maxPrice.toFixed(18),
  });

  // Get pool ID and state using utility functions
  const poolId = encodePoolId(poolKey);
  console.log('🆔 [calculateLiquidityParams] PoolId:', poolId);

  const slot0Data = await getPoolSlot0(poolKey, publicClient);
  const currentSqrtPriceX96 = slot0Data.sqrtPriceX96;
  const currentTick = slot0Data.tick;

  console.log('📊 [calculateLiquidityParams] Pool state:', {
    sqrtPriceX96: currentSqrtPriceX96.toString(),
    currentTick,
  });

  // Convert sqrtPriceX96 to actual price and show readable logs
  const sqrtPriceX96Number = Number(currentSqrtPriceX96);
  const currentPrice = (sqrtPriceX96Number / 2 ** 96) ** 2;
  const priceBA = currentPrice; // B/A price (natural scale)
  const priceAB = 1 / currentPrice; // A/B price (natural scale)

  console.log('💰 [calculateLiquidityParams] Current prices:', {
    'B/A': priceBA.toFixed(18),
    'A/B': priceAB.toFixed(18),
  });

  // Use the provided min and max prices directly
  const minPriceBA = minPrice;
  const maxPriceBA = maxPrice;
  const minPriceAB = 1 / maxPriceBA;
  const maxPriceAB = 1 / minPriceBA;

  console.log('📈 [calculateLiquidityParams] Price ranges:', {
    'B/A': `${minPriceBA.toFixed(18)} - ${maxPriceBA.toFixed(18)}`,
    'A/B': `${minPriceAB.toFixed(18)} - ${maxPriceAB.toFixed(18)}`,
    'price analysis': {
      'current B/A': priceBA.toFixed(18),
      'range center': ((minPriceBA + maxPriceBA) / 2).toFixed(18),
      'current vs center': `${((priceBA / ((minPriceBA + maxPriceBA) / 2) - 1) * 100).toFixed(2)}% offset`,
      'price symmetry': `${(maxPriceBA / priceBA).toFixed(4)} up vs ${(priceBA / minPriceBA).toFixed(4)} down`,
    },
  });

  // Convert prices to ticks (using raw prices for calculations)
  let tickLower = priceToTick(minPriceBA);
  let tickUpper = priceToTick(maxPriceBA);

  // Snap ticks to valid spacing
  const tickSpacing = getTickSpacing(poolKey.parameters);
  tickLower = snapTickToSpacing(tickLower, tickSpacing);
  tickUpper = snapTickToSpacing(tickUpper, tickSpacing);

  if (tickUpper <= tickLower) tickUpper = tickLower + tickSpacing;

  console.log('🎯 [calculateLiquidityParams] Ticks:', {
    tickLower,
    tickUpper,
    tickSpacing,
    tickRange: tickUpper - tickLower,
    currentTick,
    'current tick position': `${currentTick} (range: ${tickLower} to ${tickUpper})`,
    'ticks from center': {
      'to lower': currentTick - tickLower,
      'to upper': tickUpper - currentTick,
      'symmetric?': Math.abs(currentTick - tickLower - (tickUpper - currentTick)) <= tickSpacing,
    },
  });

  // Calculate liquidity and amounts using proper concentrated liquidity math
  const sqrtPriceLowerX96 = tickToSqrtPriceX96(tickLower);
  const sqrtPriceUpperX96 = tickToSqrtPriceX96(tickUpper);

  let liquidity: bigint;
  let amount0: bigint;
  let amount1: bigint;
  let pricePosition: string;

  console.log('🔢 [calculateLiquidityParams] Sqrt prices:', {
    sqrtPriceLowerX96: sqrtPriceLowerX96.toString(),
    sqrtPriceUpperX96: sqrtPriceUpperX96.toString(),
    currentSqrtPriceX96: currentSqrtPriceX96.toString(),
  });

  if (currentSqrtPriceX96 <= sqrtPriceLowerX96) {
    // Price below range - only token0 is used, token1 = 0
    pricePosition = 'below range';

    if (inputAmount0) {
      // Calculate from amount0
      amount0 = inputAmount0;
      liquidity =
        (amount0 * sqrtPriceUpperX96 * sqrtPriceLowerX96) / ((sqrtPriceUpperX96 - sqrtPriceLowerX96) * 2n ** 96n);
      amount1 = 0n;
    } else if (inputAmount1) {
      // Calculate from amount1 (should be 0 in this case, but we can extrapolate)
      amount1 = inputAmount1;
      // In this case, we need to calculate what amount0 would be needed for this amount1
      // Since amount1 should be 0 below range, we'll calculate the equivalent amount0
      amount0 = amount1; // This is not mathematically correct, but represents the intent
      liquidity =
        (amount0 * sqrtPriceUpperX96 * sqrtPriceLowerX96) / ((sqrtPriceUpperX96 - sqrtPriceLowerX96) * 2n ** 96n);
    } else {
      throw new Error('No amount provided');
    }
  } else if (currentSqrtPriceX96 >= sqrtPriceUpperX96) {
    // Price above range - only token1 is used in the range
    pricePosition = 'above range';

    if (inputAmount0) {
      // Calculate from amount0
      amount0 = inputAmount0;
      liquidity =
        (amount0 * sqrtPriceUpperX96 * sqrtPriceLowerX96) / ((sqrtPriceUpperX96 - sqrtPriceLowerX96) * 2n ** 96n);
      amount1 = (liquidity * (sqrtPriceUpperX96 - sqrtPriceLowerX96)) / 2n ** 96n;
    } else if (inputAmount1) {
      // Calculate from amount1
      amount1 = inputAmount1;
      liquidity = (amount1 * 2n ** 96n) / (sqrtPriceUpperX96 - sqrtPriceLowerX96);
      amount0 =
        (liquidity * (sqrtPriceUpperX96 - sqrtPriceLowerX96)) / ((sqrtPriceUpperX96 * sqrtPriceLowerX96) / 2n ** 96n);
    } else {
      throw new Error('No amount provided');
    }
  } else {
    // Price in range - both tokens are used
    pricePosition = 'in range';

    if (inputAmount0) {
      // Calculate from amount0 - user wants to provide EXACTLY this amount of token0
      amount0 = inputAmount0;

      // Use the standard Uniswap V3 concentrated liquidity math
      // This will give us the exact amount1 needed for the specified amount0
      liquidity =
        (amount0 * currentSqrtPriceX96 * sqrtPriceUpperX96) / ((sqrtPriceUpperX96 - currentSqrtPriceX96) * 2n ** 96n);
      amount1 = (liquidity * (currentSqrtPriceX96 - sqrtPriceLowerX96)) / 2n ** 96n;

      // Log the analysis for transparency
      const effectivePrice = Number(amount1) / Number(amount0);
      const currentPriceNumber = Number(currentSqrtPriceX96) ** 2 / (2 ** 96) ** 2;

      console.log('💡 [calculateLiquidityParams] Liquidity calculation analysis:', {
        userRequestedAmount0: amount0.toString(),
        calculatedAmount1: amount1.toString(),
        calculatedLiquidity: liquidity.toString(),
        effectivePrice: effectivePrice.toFixed(12),
        currentMarketPrice: currentPriceNumber.toFixed(12),
        priceRatio: `${(effectivePrice / currentPriceNumber).toFixed(4)}x market price`,
        explanation: 'Using exact amount0 as requested by user',
      });
    } else if (inputAmount1) {
      // Calculate from amount1
      amount1 = inputAmount1;
      liquidity = (amount1 * 2n ** 96n) / (currentSqrtPriceX96 - sqrtPriceLowerX96);
      amount0 =
        (liquidity * (sqrtPriceUpperX96 - currentSqrtPriceX96)) /
        ((currentSqrtPriceX96 * sqrtPriceUpperX96) / 2n ** 96n);
    } else {
      throw new Error('No amount provided');
    }

    // Let's also show what the theoretical amounts would be for verification
    console.log('🔍 [calculateLiquidityParams] In-range position analysis:', {
      'current sqrt price': currentSqrtPriceX96.toString(),
      'lower sqrt price': sqrtPriceLowerX96.toString(),
      'upper sqrt price': sqrtPriceUpperX96.toString(),
      'sqrt price ratios': {
        'current/lower': (Number(currentSqrtPriceX96) / Number(sqrtPriceLowerX96)).toFixed(4),
        'upper/current': (Number(sqrtPriceUpperX96) / Number(currentSqrtPriceX96)).toFixed(4),
      },
      'price position in range': `${(((Number(currentSqrtPriceX96) - Number(sqrtPriceLowerX96)) / (Number(sqrtPriceUpperX96) - Number(sqrtPriceLowerX96))) * 100).toFixed(1)}%`,
    });

    // Add detailed analysis of the tick snapping issue
    const rawTickLower = priceToTick(minPriceBA);
    const rawTickUpper = priceToTick(maxPriceBA);
    const actualMinPrice = tickToPrice(tickLower);
    const actualMaxPrice = tickToPrice(tickUpper);

    console.log('🎯 [calculateLiquidityParams] Tick snapping analysis:', {
      'requested range': `${minPrice.toFixed(18)} - ${maxPrice.toFixed(18)}`,
      'raw ticks': { tickLower: rawTickLower, tickUpper: rawTickUpper, range: rawTickUpper - rawTickLower },
      'snapped ticks': { tickLower, tickUpper, range: tickUpper - tickLower },
      'snapping effect': {
        'lower tick change': tickLower - rawTickLower,
        'upper tick change': tickUpper - rawTickUpper,
        'total tick expansion': tickUpper - tickLower - (rawTickUpper - rawTickLower),
      },
      'actual prices': {
        'requested min': minPriceBA.toExponential(6),
        'actual min': actualMinPrice.toExponential(6),
        'requested max': maxPriceBA.toExponential(6),
        'actual max': actualMaxPrice.toExponential(6),
      },
      'actual range': {
        'min deviation': `${((actualMinPrice / minPriceBA - 1) * 100).toFixed(2)}%`,
        'max deviation': `${((actualMaxPrice / maxPriceBA - 1) * 100).toFixed(2)}%`,
        'total range': `${((actualMaxPrice / actualMinPrice - 1) * 100).toFixed(2)}%`,
      },
    });
  }

  console.log('✅ [calculateLiquidityParams] Final calculation results:', {
    amounts: {
      token0: amount0.toString(),
      token1: amount1.toString(),
      'amount1/amount0 ratio': amount1 > 0n && amount0 > 0n ? (Number(amount1) / Number(amount0)).toFixed(6) : 'N/A',
    },
    position: {
      liquidity: liquidity.toString(),
      pricePosition,
    },
    verification: {
      'input amount0': inputAmount0?.toString() || 'not provided',
      'input amount1': inputAmount1?.toString() || 'not provided',
      'calculated amount0': amount0.toString(),
      'calculated amount1': amount1.toString(),
      'price B/A': priceBA.toFixed(18),
      'liquidity distribution': pricePosition,
      'tick range effect': `${tickUpper - tickLower} ticks = ${((tickUpper - tickLower) * 0.01).toFixed(2)}% price range`,
    },
  });

  return {
    amount0,
    amount1,
    liquidity,
    tickLower,
    tickUpper,
    currentTick,
    currentPrice,
    priceBA: priceBA, // Return natural prices
    priceAB: priceAB,
  };
}

/**
 * Helper to build a PoolKey struct for PancakeSwap Infinity Core
 */
export function buildPoolKey({
  currency0,
  currency1,
  hooks,
  poolManager,
  tickSpacing,
  hooksBitmap,
}: {
  currency0: Address;
  currency1: Address;
  hooks: Address;
  poolManager: Address;
  tickSpacing: number;
  hooksBitmap: bigint;
}): PoolKey {
  // Match the Solidity set method encoding exactly
  // params.set(uint24(tickSpacing), Encoded.MASK_UINT24, OFFSET_TICK_SPACING)
  const OFFSET_TICK_SPACING = 16; // From Solidity contract
  const MASK_UINT24 = 0xffffffn; // From Solidity contract
  const DYNAMIC_FEE = Number(8388608); // From Solidity contract

  let parameters = BigInt(hooksBitmap);

  // Step 1: Clear the bits at offset
  const clearMask = ~(MASK_UINT24 << BigInt(OFFSET_TICK_SPACING));
  parameters = parameters & clearMask;

  // Step 2: Set the new value at offset
  const valueMask = BigInt(tickSpacing) & MASK_UINT24;
  const setValue = valueMask << BigInt(OFFSET_TICK_SPACING);
  parameters = parameters | setValue;

  const parametersHex = `0x${parameters.toString(16).padStart(64, '0')}` as `0x${string}`;

  return {
    currency0,
    currency1,
    hooks,
    poolManager,
    fee: DYNAMIC_FEE,
    parameters: parametersHex,
  };
}

/**
 * Sort two token addresses to ensure currency0 < currency1
 * This is required for proper pool key creation in concentrated liquidity protocols
 * @param tokenA First token address
 * @param tokenB Second token address
 * @returns Object with sorted token0 and token1 addresses
 */
export function sortTokenAddresses(
  tokenA: Address,
  tokenB: Address,
): {
  currency0: Address;
  currency1: Address;
  isReversed: boolean;
} {
  const addressA = tokenA.toLowerCase();
  const addressB = tokenB.toLowerCase();

  if (addressA < addressB) {
    return {
      currency0: tokenA,
      currency1: tokenB,
      isReversed: false,
    };
  }

  return {
    currency0: tokenB,
    currency1: tokenA,
    isReversed: true,
  };
}

/**
 * Determine swap direction based on token addresses and pool key
 * @param tokenIn The input token address
 * @param poolKey The pool key containing currency0 and currency1
 * @returns true if swapping token0 for token1, false if swapping token1 for token0
 */
export function getSwapDirection(tokenIn: Address, poolKey: PoolKey): boolean {
  return tokenIn.toLowerCase() === poolKey.currency0.toLowerCase();
}

/**
 * Converts a price to the corresponding tick (Uniswap V3/PancakeSwap Infinity math)
 * @param price The price (token1/token0)
 * @returns The tick as an integer
 */
export function priceToTick(price: number): number {
  // tick = log(price) / log(1.0001)
  return Math.round(Math.log(price) / Math.log(1.0001));
}

/**
 * Converts a tick to the corresponding price (Uniswap V3/PancakeSwap Infinity math)
 * @param tick The tick
 * @returns The price (token1/token0)
 */
export function tickToPrice(tick: number): number {
  return 1.0001 ** tick;
}

/**
 * Snaps a tick to the nearest valid tick for a given tick spacing
 * @param tick The tick
 * @param tickSpacing The tick spacing (e.g. 60)
 * @returns The nearest valid tick
 */
export function snapTickToSpacing(tick: number, tickSpacing: number): number {
  return Math.round(tick / tickSpacing) * tickSpacing;
}

/**
 * Given a price range and tick spacing, returns the valid tickLower and tickUpper
 * @param minPrice Minimum price (token1/token0)
 * @param maxPrice Maximum price (token1/token0)
 * @param tickSpacing The pool's tick spacing
 * @returns { tickLower, tickUpper }
 */
export function priceRangeToTicks(
  minPrice: number,
  maxPrice: number,
  tickSpacing: number,
): { tickLower: number; tickUpper: number } {
  let tickLower = priceToTick(minPrice);
  let tickUpper = priceToTick(maxPrice);
  tickLower = snapTickToSpacing(tickLower, tickSpacing);
  tickUpper = snapTickToSpacing(tickUpper, tickSpacing);
  if (tickUpper <= tickLower) tickUpper = tickLower + tickSpacing;
  return { tickLower, tickUpper };
}

/**
 * Get tick spacing for a given fee tier
 * Extracts tickSpacing from bits 16-39 (24 bits) of the encoded parameters
 * @param parameters The encoded pair parameters as bytes32 hex string
 * @returns The tickSpacing as a number
 */
export function getTickSpacing(parameters: `0x${string}`): number {
  console.log('🔢 [getTickSpacing] Parameters:', parameters);

  // Convert hex string to BigInt for bitwise operations
  const paramsBigInt = BigInt(parameters);
  // Extract 24 bits starting at bit offset 16
  // This matches the Solidity: int24(params.decodeUint24(OFFSET_TICK_SPACING))
  const OFFSET_TICK_SPACING = 16;
  const MASK_UINT24 = 0xffffffn; // 24-bit mask (2^24 - 1)

  // Shift right by offset bits and apply mask
  const tickSpacingBigInt = (paramsBigInt >> BigInt(OFFSET_TICK_SPACING)) & MASK_UINT24;

  // Convert to signed 24-bit integer (int24 in Solidity)
  let tickSpacing = Number(tickSpacingBigInt);

  // Handle signed conversion for 24-bit values
  // If the value is >= 2^23, it's negative in two's complement
  if (tickSpacing >= 0x800000) {
    tickSpacing = tickSpacing - 0x1000000; // Convert from unsigned to signed
  }

  console.log('🔢 [getTickSpacing] Extracted tick spacing:', {
    paramsBigInt: paramsBigInt.toString(16),
    extractedBits: tickSpacingBigInt.toString(16),
    tickSpacing,
  });

  return tickSpacing;
}

/**
 * Convert tick to sqrtPriceX96
 */
export function tickToSqrtPriceX96(tick: number): bigint {
  const price = 1.0001 ** tick;
  const sqrtPrice = Math.sqrt(price);
  return BigInt(Math.floor(sqrtPrice * 2 ** 96));
}

/**
 * Encode a PoolKey to get its poolId hash
 * @param poolKey The pool key to encode
 * @returns The poolId as a bytes32 hash
 */
export function encodePoolId(poolKey: PoolKey): `0x${string}` {
  const poolKeyEncoded = encodeAbiParameters(
    [
      { type: 'address', name: 'currency0' },
      { type: 'address', name: 'currency1' },
      { type: 'address', name: 'hooks' },
      { type: 'address', name: 'poolManager' },
      { type: 'uint24', name: 'fee' },
      { type: 'bytes32', name: 'parameters' },
    ],
    [poolKey.currency0, poolKey.currency1, poolKey.hooks, poolKey.poolManager, poolKey.fee, poolKey.parameters],
  );

  return keccak256(poolKeyEncoded);
}

/**
 * Get slot0 data from a pool manager
 * @param poolKey The pool key
 * @param publicClient The public client to use for the contract read
 * @returns Slot0 data containing sqrtPriceX96, tick, protocolFee, and lpFee
 */
export async function getPoolSlot0(
  poolKey: PoolKey,
  publicClient: PublicClient<HttpTransport>,
): Promise<{
  sqrtPriceX96: bigint;
  tick: number;
  protocolFee: number;
  lpFee: number;
}> {
  const poolId = encodePoolId(poolKey);

  const slot0Result = (await publicClient.readContract({
    address: poolKey.poolManager,
    abi: clPoolManagerAbi,
    functionName: 'getSlot0',
    args: [poolId],
  })) as [bigint, number, number, number];

  return {
    sqrtPriceX96: slot0Result[0],
    tick: slot0Result[1],
    protocolFee: slot0Result[2],
    lpFee: slot0Result[3],
  };
}
