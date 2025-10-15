// packages/sdk/src/utils/concentratedLiquidity.utils.ts

import type { PublicClient, HttpTransport } from 'viem';
import type { Address } from '@sodax/types';
import { type PoolKey, getPoolId, encodePoolKey, type CLPoolParameter } from '@pancakeswap/infinity-sdk';
import { TickMath } from '@pancakeswap/v3-sdk';

// Re-export PancakeSwap types and utilities
export type { PoolKey, CLPoolParameter };
export { getPoolId, encodePoolKey, TickMath };

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
  // Use TickMath to get the tick from sqrt ratio
  const sqrtPriceX96 = BigInt(Math.floor(Math.sqrt(price) * 2 ** 96));
  return TickMath.getTickAtSqrtRatio(sqrtPriceX96);
}

/**
 * Converts a tick to the corresponding price (Uniswap V3/PancakeSwap Infinity math)
 * @param tick The tick
 * @returns The price (token1/token0)
 */
export function tickToPrice(tick: number): number {
  const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick);
  const sqrtPrice = Number(sqrtRatioX96) / 2 ** 96;
  return sqrtPrice ** 2;
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
 * Get tick spacing for a given fee tier
 * Extracts tickSpacing from the encoded parameters using PancakeSwap SDK
 * @param parameters The encoded pair parameters as bytes32 hex string
 * @returns The tickSpacing as a number
 */
export function getTickSpacing(
  parameters: `0x${string}` | CLPoolParameter | { tickSpacing?: number } | Record<string, unknown>,
): number {
  console.log('🔍 [getTickSpacing] Processing parameters:', parameters);

  // If parameters is already a CLPoolParameter object, use it directly
  if (typeof parameters === 'object' && parameters !== null && 'tickSpacing' in parameters) {
    const tickSpacing = (parameters as { tickSpacing?: number }).tickSpacing;
    if (tickSpacing !== undefined) {
      console.log('✅ [getTickSpacing] Using CLPoolParameter object:', tickSpacing);
      return tickSpacing;
    }
  }

  // Final fallback
  console.log('🔄 [getTickSpacing] Using fallback tick spacing');
  return 60;
}

/**
 * Convert tick to sqrtPriceX96
 * Uses PancakeSwap v3-sdk TickMath
 */
export function tickToSqrtPriceX96(tick: number): bigint {
  return TickMath.getSqrtRatioAtTick(tick);
}

/**
 * Encode a PoolKey to get its poolId hash
 * Uses PancakeSwap SDK's getPoolId
 * @param poolKey The pool key to encode
 * @returns The poolId as a bytes32 hash
 */
export function encodePoolId(poolKey: PoolKey): `0x${string}` {
  return getPoolId(poolKey);
}
