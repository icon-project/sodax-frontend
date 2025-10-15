// apps/demo/src/lib/token-utils.ts
import { createPublicClient, http, type Address, type PublicClient } from 'viem';
import { erc20Abi } from 'viem';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: Address;
}

export interface PoolData {
  // Pool identification
  poolId: string;
  poolKey: {
    currency0: Address;
    currency1: Address;
    hooks: Address;
    poolManager: Address;
    fee: number;
    parameters: string;
  };

  // Current pool state (from slot0)
  sqrtPriceX96: bigint;
  currentTick: number;
  protocolFee: number;
  lpFee: number;

  // Calculated prices
  currentPriceBA: number; // token1/token0
  currentPriceAB: number; // token0/token1
  currentPriceBAFormatted: string;
  currentPriceABFormatted: string;

  // Pool liquidity
  totalLiquidity: bigint;
  totalLiquidityFormatted: string;

  // Pool fees
  feeTier: number;
  tickSpacing: number;

  // Token information
  token0: TokenInfo;
  token1: TokenInfo;

  // Additional pool metrics
  isActive: boolean;
  createdAt?: number; // Block number when pool was created
}

export interface PositionAmounts {
  amount0: bigint;
  amount1: bigint;
  amount0Formatted: string;
  amount1Formatted: string;
  totalValueUSD?: number; // Optional USD value if we have price data
}

export interface PriceRange {
  minPrice: number;
  maxPrice: number;
  minPriceFormatted: string;
  maxPriceFormatted: string;
  currentPrice: number;
  currentPriceFormatted: string;
  // Add both A/B and B/A price formats
  minPriceAB: number;
  maxPriceAB: number;
  minPriceABFormatted: string;
  maxPriceABFormatted: string;
  currentPriceAB: number;
  currentPriceABFormatted: string;
  minPriceBA: number;
  maxPriceBA: number;
  minPriceBAFormatted: string;
  maxPriceBAFormatted: string;
  currentPriceBA: number;
  currentPriceBAFormatted: string;
}

/**
 * Fetch token information (symbol, name, decimals) from ERC20 contract
 */
export async function getTokenInfo(tokenAddress: Address, publicClient: PublicClient): Promise<TokenInfo> {
  try {
    const [symbol, name, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'name',
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
    ]);

    return {
      symbol: symbol as string,
      name: name as string,
      decimals: decimals as number,
      address: tokenAddress,
    };
  } catch (error) {
    console.error(`Failed to fetch token info for ${tokenAddress}:`, error);
    // Return fallback info if contract calls fail
    return {
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
      address: tokenAddress,
    };
  }
}

/**
 * Convert tick to price using Uniswap V3/PancakeSwap Infinity math
 * tick = log(price) / log(1.0001)
 * price = 1.0001^tick
 */
export function tickToPrice(tick: number): number {
  return 1.0001 ** tick;
}

/**
 * Convert price to tick using Uniswap V3/PancakeSwap Infinity math
 * tick = log(price) / log(1.0001)
 */
export function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: number, decimals = 6): string {
  if (price === 0) return '0';
  if (price < 0.000001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(8);
  if (price < 1) return price.toFixed(6);
  if (price < 100) return price.toFixed(4);
  if (price < 10000) return price.toFixed(2);
  return price.toFixed(0);
}

/**
 * Calculate position amounts from liquidity and tick range
 * This uses Uniswap V3/PancakeSwap Infinity math to calculate token amounts
 */
export function calculatePositionAmounts(
  liquidity: bigint,
  tickLower: number,
  tickUpper: number,
  currentTick: number,
  token0Decimals: number,
  token1Decimals: number,
): PositionAmounts {
  // Convert liquidity to number for calculations
  const L = Number(liquidity);

  // Calculate sqrt prices
  const sqrtPriceLower = Math.sqrt(tickToPrice(tickLower));
  const sqrtPriceUpper = Math.sqrt(tickToPrice(tickUpper));
  const sqrtPriceCurrent = Math.sqrt(tickToPrice(currentTick));

  // Calculate amounts based on current price position
  let amount0: bigint;
  let amount1: bigint;

  if (currentTick < tickLower) {
    // Price is below range - only token0
    amount0 = BigInt(Math.floor((L * (sqrtPriceUpper - sqrtPriceLower)) / (sqrtPriceLower * sqrtPriceUpper)));
    amount1 = 0n;
  } else if (currentTick >= tickUpper) {
    // Price is above range - only token1
    amount0 = 0n;
    amount1 = BigInt(Math.floor(L * (sqrtPriceUpper - sqrtPriceLower)));
  } else {
    // Price is in range - both tokens
    amount0 = BigInt(Math.floor((L * (sqrtPriceUpper - sqrtPriceCurrent)) / (sqrtPriceCurrent * sqrtPriceUpper)));
    amount1 = BigInt(Math.floor(L * (sqrtPriceCurrent - sqrtPriceLower)));
  }

  // Format amounts with proper decimals
  const amount0Formatted = formatTokenAmount(amount0, token0Decimals);
  const amount1Formatted = formatTokenAmount(amount1, token1Decimals);

  return {
    amount0,
    amount1,
    amount0Formatted,
    amount1Formatted,
  };
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  if (amount === 0n) return '0';

  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;

  if (remainder === 0n) {
    return whole.toString();
  }

  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmedRemainder = remainderStr.replace(/0+$/, '');

  if (trimmedRemainder === '') {
    return whole.toString();
  }

  return `${whole}.${trimmedRemainder}`;
}

/**
 * Debug function to understand tick and price relationships
 */
export function debugPriceCalculation(tickLower: number, tickUpper: number, currentTick?: number): void {
  console.log('🔍 Debug Price Calculation:');
  console.log('Ticks:', { tickLower, tickUpper, currentTick });

  const minPriceBA = tickToPrice(tickLower);
  const maxPriceBA = tickToPrice(tickUpper);
  const currentPriceBA = currentTick ? tickToPrice(currentTick) : (minPriceBA + maxPriceBA) / 2;

  console.log('B/A Prices (token1/token0):', {
    min: minPriceBA,
    max: maxPriceBA,
    current: currentPriceBA,
  });

  const minPriceAB = 1 / maxPriceBA;
  const maxPriceAB = 1 / minPriceBA;
  const currentPriceAB = 1 / currentPriceBA;

  console.log('A/B Prices (token0/token1):', {
    min: minPriceAB,
    max: maxPriceAB,
    current: currentPriceAB,
  });

  console.log('Verification:');
  console.log('minPriceAB * maxPriceBA =', minPriceAB * maxPriceBA, '(should be 1)');
  console.log('maxPriceAB * minPriceBA =', maxPriceAB * minPriceBA, '(should be 1)');
  console.log('currentPriceAB * currentPriceBA =', currentPriceAB * currentPriceBA, '(should be 1)');

  // Additional analysis
  console.log('📊 Price Range Analysis:');
  console.log('Range width (B/A):', maxPriceBA - minPriceBA);
  console.log('Range width (A/B):', maxPriceAB - minPriceAB);
  console.log(
    'Is current price in range?',
    currentTick ? currentTick >= tickLower && currentTick <= tickUpper : 'Unknown',
  );

  if (currentTick) {
    if (currentTick < tickLower) {
      console.log('📍 Current price is BELOW the position range');
    } else if (currentTick > tickUpper) {
      console.log('📍 Current price is ABOVE the position range');
    } else {
      console.log('📍 Current price is WITHIN the position range');
    }
  }
}

/**
 * Fetch comprehensive pool data including real-time state
 */
export async function getPoolData(
  poolKey: {
    currency0: Address;
    currency1: Address;
    hooks: Address;
    poolManager: Address;
    fee: number;
    parameters: string;
  },
  publicClient: PublicClient,
): Promise<PoolData> {
  try {
    // Import the utility functions from the SDK
    const { encodePoolId, getPoolSlot0 } = await import('@sodax/sdk');

    // Use the SDK's improved getTickSpacing function directly
    const { getTickSpacing } = await import('@sodax/sdk');

    // Get pool ID
    const poolId = encodePoolId(poolKey);

    // Get slot0 data (current pool state)
    const slot0Data = await getPoolSlot0(poolKey, publicClient);

    // Debug the pool key parameters
    console.log('🔍 Pool Key Debug:', {
      parameters: poolKey.parameters,
      parametersType: typeof poolKey.parameters,
      fee: poolKey.fee,
    });

    // Calculate current prices from sqrtPriceX96
    const sqrtPriceX96Number = Number(slot0Data.sqrtPriceX96);
    const currentPriceBA = (sqrtPriceX96Number / 2 ** 96) ** 2;
    const currentPriceAB = 1 / currentPriceBA;

    // Fetch token information
    const [token0, token1] = await Promise.all([
      getTokenInfo(poolKey.currency0, publicClient),
      getTokenInfo(poolKey.currency1, publicClient),
    ]);

    // Get total liquidity from the pool
    let totalLiquidity = 0n;
    try {
      // Try to get liquidity from the pool manager
      const liquidityResult = await publicClient.readContract({
        address: poolKey.poolManager,
        abi: [
          {
            inputs: [{ name: 'poolId', type: 'bytes32' }],
            name: 'getLiquidity',
            outputs: [{ name: 'liquidity', type: 'uint128' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'getLiquidity',
        args: [poolId],
      });
      totalLiquidity = liquidityResult as bigint;
      console.log('✅ [getPoolData] Fetched total liquidity:', totalLiquidity.toString());
    } catch (liquidityError) {
      console.warn('⚠️ [getPoolData] Failed to fetch liquidity, using fallback:', liquidityError);
      // Fallback: estimate liquidity based on slot0 data
      const sqrtPriceX96Number = Number(slot0Data.sqrtPriceX96);
      if (sqrtPriceX96Number > 0) {
        // Rough estimation based on sqrtPriceX96
        totalLiquidity = BigInt(Math.floor(sqrtPriceX96Number / 1e12));
      }
    }

    // Extract fee tier and tick spacing
    const feeTier = poolKey.fee;

    // Extract tick spacing using SDK's improved function
    let tickSpacing = 60; // Default fallback
    try {
      if (typeof poolKey.parameters === 'string') {
        console.log('📏 Attempting to extract tick spacing from hex string:', poolKey.parameters);
        tickSpacing = getTickSpacing(poolKey.parameters as `0x${string}`);
        console.log('✅ Final tick spacing:', tickSpacing);
      } else if (poolKey.parameters && typeof poolKey.parameters === 'object') {
        console.log('📏 Parameters is an object:', poolKey.parameters);
        tickSpacing = (poolKey.parameters as { tickSpacing?: number }).tickSpacing || 60;
      }
    } catch (error) {
      console.warn('❌ Failed to extract tick spacing, using default:', error);
      console.log('🔧 Error details:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        parameters: poolKey.parameters,
        parametersType: typeof poolKey.parameters,
      });
      tickSpacing = 60; // Default fallback
    }

    return {
      poolId,
      poolKey: {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        hooks: poolKey.hooks,
        poolManager: poolKey.poolManager,
        fee: poolKey.fee,
        parameters: poolKey.parameters,
      },
      sqrtPriceX96: slot0Data.sqrtPriceX96,
      currentTick: slot0Data.tick,
      protocolFee: slot0Data.protocolFee,
      lpFee: slot0Data.lpFee,
      currentPriceBA,
      currentPriceAB,
      currentPriceBAFormatted: formatPrice(currentPriceBA),
      currentPriceABFormatted: formatPrice(currentPriceAB),
      totalLiquidity,
      totalLiquidityFormatted: formatTokenAmount(totalLiquidity, 18),
      feeTier,
      tickSpacing,
      token0,
      token1,
      isActive: slot0Data.sqrtPriceX96 > 0n,
    };
  } catch (error) {
    console.error('Failed to fetch pool data:', error);
    throw new Error(`Failed to fetch pool data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the current market price from pool state
 * This requires the pool manager contract and pool ID
 */
export async function getCurrentMarketPrice(
  poolManager: Address,
  poolId: string,
  publicClient: PublicClient,
): Promise<number | null> {
  try {
    // This would need the actual pool manager ABI
    // For now, we'll return null to indicate we don't have real-time data
    console.log('⚠️ Real-time price fetching not implemented yet');
    console.log('Pool Manager:', poolManager);
    console.log('Pool ID:', poolId);
    return null;
  } catch (error) {
    console.error('Failed to get current market price:', error);
    return null;
  }
}

/**
 * Calculate price range from ticks
 */
export function calculatePriceRange(tickLower: number, tickUpper: number, currentTick?: number): PriceRange {
  console.log('🔍 [calculatePriceRange] Input ticks:', { tickLower, tickUpper, currentTick });

  // Check if ticks are in correct order
  if (tickLower > tickUpper) {
    console.warn('⚠️ [calculatePriceRange] tickLower > tickUpper, swapping values');
    [tickLower, tickUpper] = [tickUpper, tickLower];
  }

  // Calculate B/A prices (token1/token0) - this is the standard Uniswap V3 format
  const minPriceBA = tickToPrice(tickLower);
  const maxPriceBA = tickToPrice(tickUpper);
  const currentPriceBA = currentTick ? tickToPrice(currentTick) : (minPriceBA + maxPriceBA) / 2;

  console.log('📊 [calculatePriceRange] B/A prices:', { minPriceBA, maxPriceBA, currentPriceBA });

  // Calculate A/B prices (token0/token1) - inverse of B/A
  // Note: For A/B, we need to invert the relationship correctly
  const minPriceAB = 1 / maxPriceBA; // A/B min = 1 / (B/A max)
  const maxPriceAB = 1 / minPriceBA; // A/B max = 1 / (B/A min)
  const currentPriceAB = 1 / currentPriceBA;

  console.log('📊 [calculatePriceRange] A/B prices:', { minPriceAB, maxPriceAB, currentPriceAB });

  // Verify the relationship
  console.log('✅ [calculatePriceRange] Verification:');
  console.log('  minPriceAB * maxPriceBA =', minPriceAB * maxPriceBA, '(should be 1)');
  console.log('  maxPriceAB * minPriceBA =', maxPriceAB * minPriceBA, '(should be 1)');
  console.log('  currentPriceAB * currentPriceBA =', currentPriceAB * currentPriceBA, '(should be 1)');

  return {
    // Legacy fields (keeping for backward compatibility)
    minPrice: minPriceBA,
    maxPrice: maxPriceBA,
    minPriceFormatted: formatPrice(minPriceBA),
    maxPriceFormatted: formatPrice(maxPriceBA),
    currentPrice: currentPriceBA,
    currentPriceFormatted: formatPrice(currentPriceBA),

    // A/B prices (token0/token1)
    minPriceAB,
    maxPriceAB,
    minPriceABFormatted: formatPrice(minPriceAB),
    maxPriceABFormatted: formatPrice(maxPriceAB),
    currentPriceAB,
    currentPriceABFormatted: formatPrice(currentPriceAB),

    // B/A prices (token1/token0) - standard Uniswap format
    minPriceBA,
    maxPriceBA,
    minPriceBAFormatted: formatPrice(minPriceBA),
    maxPriceBAFormatted: formatPrice(maxPriceBA),
    currentPriceBA,
    currentPriceBAFormatted: formatPrice(currentPriceBA),
  };
}

/**
 * Get current pool price from pool slot0 data
 */
export async function getCurrentPoolPrice(
  poolManager: Address,
  poolId: string,
  publicClient: PublicClient,
): Promise<number> {
  try {
    // This would need the actual pool manager ABI and slot0 function
    // For now, we'll return a placeholder
    console.log('Getting current pool price for pool:', poolId);
    return 1.0; // Placeholder
  } catch (error) {
    console.error('Failed to get current pool price:', error);
    return 1.0; // Fallback
  }
}

/**
 * Create a public client for Sonic mainnet
 */
export function createSonicPublicClient(): PublicClient {
  return createPublicClient({
    chain: {
      id: SONIC_MAINNET_CHAIN_ID,
      name: 'Sonic',
      network: 'sonic',
      nativeCurrency: {
        decimals: 18,
        name: 'Sonic',
        symbol: 'S',
      },
      rpcUrls: {
        default: {
          http: ['https://rpc.soniclabs.com'],
        },
        public: {
          http: ['https://rpc.soniclabs.com'],
        },
      },
      blockExplorers: {
        default: {
          name: 'Sonic Explorer',
          url: 'https://explorer.soniclabs.com',
        },
      },
    },
    transport: http('https://rpc.soniclabs.com'),
  });
}

/**
 * Fetch liquidity at a specific tick from the pool manager
 */
export async function getLiquidityAtTick(
  poolKey: {
    currency0: Address;
    currency1: Address;
    hooks: Address;
    poolManager: Address;
    fee: number;
    parameters: string;
  },
  tick: number,
  publicClient: PublicClient,
): Promise<bigint> {
  try {
    // Import encodePoolId from SDK
    const { encodePoolId } = await import('@sodax/sdk');
    const poolId = encodePoolId(poolKey);

    console.log('🔍 [getLiquidityAtTick] Fetching liquidity for tick:', {
      tick,
      poolId,
      poolManager: poolKey.poolManager,
    });

    // Try to get liquidity at specific tick
    const liquidityResult = await publicClient.readContract({
      address: poolKey.poolManager,
      abi: [
        {
          inputs: [
            { name: 'poolId', type: 'bytes32' },
            { name: 'tick', type: 'int24' },
          ],
          name: 'getLiquidityAtTick',
          outputs: [{ name: 'liquidity', type: 'uint128' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'getLiquidityAtTick',
      args: [poolId, tick],
    });

    const liquidity = liquidityResult as bigint;
    console.log('✅ [getLiquidityAtTick] Successfully fetched liquidity:', {
      tick,
      liquidity: liquidity.toString(),
    });
    return liquidity;
  } catch (error) {
    console.warn('⚠️ [getLiquidityAtTick] Failed to fetch liquidity at tick:', tick, error);
    return 0n;
  }
}

/**
 * Fetch multiple liquidity values for depth chart
 */
export async function getLiquidityBins(
  poolKey: {
    currency0: Address;
    currency1: Address;
    hooks: Address;
    poolManager: Address;
    fee: number;
    parameters: string;
  },
  currentTick: number,
  tickSpacing: number,
  range: number,
  publicClient: PublicClient,
): Promise<Array<{ tick: number; liquidity: bigint; price: number }>> {
  const bins: Array<{ tick: number; liquidity: bigint; price: number }> = [];

  // Helper function to convert tick to price
  const tickToPrice = (tick: number): number => {
    return 1.0001 ** tick; // Uniswap V3 math
  };

  const startTick = Math.floor(currentTick / tickSpacing) * tickSpacing - range * tickSpacing;
  const endTick = Math.ceil(currentTick / tickSpacing) * tickSpacing + range * tickSpacing;

  console.log('🔍 [getLiquidityBins] Fetching liquidity for ticks:', {
    startTick,
    endTick,
    tickSpacing,
    range,
  });

  // Fetch liquidity for each tick
  for (let tick = startTick; tick <= endTick; tick += tickSpacing) {
    try {
      const liquidity = await getLiquidityAtTick(poolKey, tick, publicClient);
      const price = tickToPrice(tick);

      bins.push({
        tick,
        liquidity,
        price,
      });

      console.log(`📊 [getLiquidityBins] Tick ${tick}: liquidity=${liquidity.toString()}, price=${price}`);
    } catch (error) {
      console.warn(`⚠️ [getLiquidityBins] Failed to fetch liquidity for tick ${tick}:`, error);
      bins.push({
        tick,
        liquidity: 0n,
        price: tickToPrice(tick),
      });
    }
  }

  return bins;
}

/**
 * Get current dynamic fee rates from the default hook
 */
export async function getCurrentDynamicFees(
  poolKey: {
    currency0: Address;
    currency1: Address;
    hooks: Address;
    poolManager: Address;
    fee: number;
    parameters: string;
  },
  publicClient: PublicClient,
): Promise<{
  lpFee: number;
  protocolFee: number;
  lpFeePercentage: string;
  protocolFeePercentage: string;
  totalFeePercentage: string;
}> {
  try {
    // Import encodePoolId from SDK
    const { encodePoolId } = await import('@sodax/sdk');
    const poolId = encodePoolId(poolKey);

    console.log('🔍 [getCurrentDynamicFees] Fetching dynamic fees for pool:', poolId);

    // Get current fee rates from the hook
    const feeRates = await publicClient.readContract({
      address: poolKey.hooks,
      abi: [
        {
          inputs: [],
          name: 'lpFee',
          outputs: [{ name: '', type: 'uint24' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'protocolFee',
          outputs: [{ name: '', type: 'uint24' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'lpFee',
      args: [],
    });

    const protocolFee = await publicClient.readContract({
      address: poolKey.hooks,
      abi: [
        {
          inputs: [],
          name: 'protocolFee',
          outputs: [{ name: '', type: 'uint24' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'protocolFee',
      args: [],
    });

    const lpFee = feeRates as number;
    const protocolFeeValue = protocolFee as number;

    // Convert to percentages (fee rates are in basis points)
    const lpFeePercentage = (lpFee / 10000).toFixed(4);
    const protocolFeePercentage = (protocolFeeValue / 10000).toFixed(4);
    const totalFeePercentage = ((lpFee + protocolFeeValue) / 10000).toFixed(4);

    console.log('✅ [getCurrentDynamicFees] Current fee rates:', {
      lpFee,
      protocolFee: protocolFeeValue,
      lpFeePercentage: `${lpFeePercentage}%`,
      protocolFeePercentage: `${protocolFeePercentage}%`,
      totalFeePercentage: `${totalFeePercentage}%`,
    });

    return {
      lpFee,
      protocolFee: protocolFeeValue,
      lpFeePercentage: `${lpFeePercentage}%`,
      protocolFeePercentage: `${protocolFeePercentage}%`,
      totalFeePercentage: `${totalFeePercentage}%`,
    };
  } catch (error) {
    console.error('❌ [getCurrentDynamicFees] Error fetching dynamic fees:', error);
    return {
      lpFee: 0,
      protocolFee: 0,
      lpFeePercentage: '0%',
      protocolFeePercentage: '0%',
      totalFeePercentage: '0%',
    };
  }
}

/**
 * Calculate current unclaimed fees for a position
 */
export async function getUnclaimedFees(
  positionData: {
    poolKey: {
      currency0: Address;
      currency1: Address;
      hooks: Address;
      poolManager: Address;
      fee: number;
      parameters: string;
    };
    tickLower: number;
    tickUpper: number;
    liquidity: bigint;
    feeGrowthInside0LastX128: bigint;
    feeGrowthInside1LastX128: bigint;
  },
  publicClient: PublicClient,
): Promise<{
  unclaimedFees0: bigint;
  unclaimedFees1: bigint;
  unclaimedFees0Formatted: string;
  unclaimedFees1Formatted: string;
}> {
  try {
    // Import encodePoolId from SDK
    const { encodePoolId } = await import('@sodax/sdk');
    const poolId = encodePoolId(positionData.poolKey);

    // Get current global fee growth from the pool
    const slot0Data = await publicClient.readContract({
      address: positionData.poolKey.poolManager,
      abi: [
        {
          inputs: [{ name: 'poolId', type: 'bytes32' }],
          name: 'getSlot0',
          outputs: [
            { name: 'sqrtPriceX96', type: 'uint160' },
            { name: 'tick', type: 'int24' },
            { name: 'protocolFee', type: 'uint24' },
            { name: 'lpFee', type: 'uint24' },
            { name: 'unlocked', type: 'bool' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'getSlot0',
      args: [poolId],
    });

    // Get current global fee growth
    const globalFeeGrowthData = await publicClient.readContract({
      address: positionData.poolKey.poolManager,
      abi: [
        {
          inputs: [{ name: 'poolId', type: 'bytes32' }],
          name: 'getGlobalFeeGrowth',
          outputs: [
            { name: 'feeGrowthGlobal0X128', type: 'uint256' },
            { name: 'feeGrowthGlobal1X128', type: 'uint256' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'getGlobalFeeGrowth',
      args: [poolId],
    });

    const [feeGrowthGlobal0X128, feeGrowthGlobal1X128] = globalFeeGrowthData as [bigint, bigint];

    // Calculate fee growth inside the position's tick range
    const currentTick = slot0Data[1] as number;

    // Get fee growth at tick boundaries
    const feeGrowthAtTickLower = await publicClient.readContract({
      address: positionData.poolKey.poolManager,
      abi: [
        {
          inputs: [
            { name: 'poolId', type: 'bytes32' },
            { name: 'tick', type: 'int24' },
          ],
          name: 'getFeeGrowthAtTick',
          outputs: [
            { name: 'feeGrowthOutside0X128', type: 'uint256' },
            { name: 'feeGrowthOutside1X128', type: 'uint256' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'getFeeGrowthAtTick',
      args: [poolId, positionData.tickLower],
    });

    const feeGrowthAtTickUpper = await publicClient.readContract({
      address: positionData.poolKey.poolManager,
      abi: [
        {
          inputs: [
            { name: 'poolId', type: 'bytes32' },
            { name: 'tick', type: 'int24' },
          ],
          name: 'getFeeGrowthAtTick',
          outputs: [
            { name: 'feeGrowthOutside0X128', type: 'uint256' },
            { name: 'feeGrowthOutside1X128', type: 'uint256' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'getFeeGrowthAtTick',
      args: [poolId, positionData.tickUpper],
    });

    const [feeGrowthOutside0Lower, feeGrowthOutside1Lower] = feeGrowthAtTickLower as [bigint, bigint];
    const [feeGrowthOutside0Upper, feeGrowthOutside1Upper] = feeGrowthAtTickUpper as [bigint, bigint];

    // Calculate fee growth inside the position range
    let feeGrowthInside0X128: bigint;
    let feeGrowthInside1X128: bigint;

    if (currentTick >= positionData.tickLower && currentTick < positionData.tickUpper) {
      // Current tick is inside the position range
      feeGrowthInside0X128 = feeGrowthGlobal0X128 - feeGrowthOutside0Lower - feeGrowthOutside0Upper;
      feeGrowthInside1X128 = feeGrowthGlobal1X128 - feeGrowthOutside1Lower - feeGrowthOutside1Upper;
    } else if (currentTick < positionData.tickLower) {
      // Current tick is below the position range
      feeGrowthInside0X128 = feeGrowthOutside0Lower - feeGrowthOutside0Upper;
      feeGrowthInside1X128 = feeGrowthOutside1Lower - feeGrowthOutside1Upper;
    } else {
      // Current tick is above the position range
      feeGrowthInside0X128 = feeGrowthOutside0Upper - feeGrowthOutside0Lower;
      feeGrowthInside1X128 = feeGrowthOutside1Upper - feeGrowthOutside1Lower;
    }

    // Calculate unclaimed fees
    const unclaimedFees0 =
      ((feeGrowthInside0X128 - positionData.feeGrowthInside0LastX128) * positionData.liquidity) / 2n ** 128n;
    const unclaimedFees1 =
      ((feeGrowthInside1X128 - positionData.feeGrowthInside1LastX128) * positionData.liquidity) / 2n ** 128n;

    return {
      unclaimedFees0,
      unclaimedFees1,
      unclaimedFees0Formatted: formatTokenAmount(unclaimedFees0, 18),
      unclaimedFees1Formatted: formatTokenAmount(unclaimedFees1, 18),
    };
  } catch (error) {
    console.error('❌ [getUnclaimedFees] Error calculating unclaimed fees:', error);
    return {
      unclaimedFees0: 0n,
      unclaimedFees1: 0n,
      unclaimedFees0Formatted: '0',
      unclaimedFees1Formatted: '0',
    };
  }
}
