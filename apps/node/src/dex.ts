import 'dotenv/config';
import type { Address, Hex } from 'viem';
import {
  EvmHubProvider,
  SonicSpokeProvider,
  getHubChainConfig,
  SONIC_MAINNET_CHAIN_ID,
  type HubChainId,
  getConcentratedLiquidityConfig,
  type EvmHubProviderConfig,
  type SodaxConfig,
  Sodax,
  spokeChainConfig,
  ConcentratedLiquidityService,
  type SpokeChainId,
  calculateLiquidityParams,
  getPoolSlot0,
  getSwapDirection,
} from '@sodax/sdk';
import { EvmWalletProvider } from './wallet-providers/EvmWalletProvider.js';
import { encodeAbiParameters, erc20Abi, keccak256 } from 'viem';

const privateKey = process.env.PRIVATE_KEY;
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = 'https://rpc.soniclabs.com';

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const hubEvmWallet = new EvmWalletProvider(privateKey as Hex, HUB_CHAIN_ID, HUB_RPC_URL);
const spokeEvmWallet = new EvmWalletProvider(privateKey as Hex, HUB_CHAIN_ID, HUB_RPC_URL);

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(HUB_CHAIN_ID),
} satisfies EvmHubProviderConfig;

const hubProvider = new EvmHubProvider(hubConfig);
const spokeProvider = new SonicSpokeProvider(spokeEvmWallet, spokeChainConfig[HUB_CHAIN_ID]);

const clConfig = getConcentratedLiquidityConfig(HUB_CHAIN_ID);
const clService = new ConcentratedLiquidityService(clConfig, hubProvider);

async function supplyLiquidity(
  token0: Address,
  token1: Address,
  tickLower: bigint,
  tickUpper: bigint,
  liquidity: bigint,
  amount0Desired: bigint,
  amount1Desired: bigint,
) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  // add buffer
  amount0Desired = (amount0Desired * 101n) / 100n;
  amount1Desired = (amount1Desired * 101n) / 100n;
  // Build pool key for PancakeSwap Infinity
  const poolKey = await clService.getPoolKey({
    token0,
    token1,
  });

  // Use the planner-based approach for PancakeSwap Infinity
  // Calculate liquidity based on amounts (this is a simplified calculation)
  // In production, you'd want to use proper liquidity calculation
  console.log(amount0Desired, amount1Desired);

  const call = ConcentratedLiquidityService.encodeSupplyLiquidity(
    poolKey,
    tickLower,
    tickUpper,
    liquidity,
    amount0Desired,
    amount1Desired,
    wallet,
    clConfig.clPositionManager,
  );

  const txHash = await spokeProvider.walletProvider.sendTransaction({
    to: call.address,
    from: wallet,
    data: call.data,
    value: 0n,
  });
  console.log('[supplyLiquidity] txHash', txHash);
}

async function increaseLiquidity(
  token0: Address,
  token1: Address,
  tokenId: bigint,
  liquidity: bigint,
  amount0Max: bigint,
  amount1Max: bigint,
) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  // add buffer for maximum amounts
  amount0Max = (amount0Max * 101n) / 100n;
  amount1Max = (amount1Max * 101n) / 100n;

  console.log('[increaseLiquidity] Parameters:', {
    tokenId: tokenId.toString(),
    liquidity: liquidity.toString(),
    amount0Max: amount0Max.toString(),
    amount1Max: amount1Max.toString(),
  });

  const call = clService.encodeIncreaseLiquidity(
    token0,
    token1,
    tokenId,
    liquidity,
    amount0Max,
    amount1Max,
    clConfig.clPositionManager,
  );

  const txHash = await spokeProvider.walletProvider.sendTransaction({
    to: call.address,
    from: wallet,
    data: call.data,
    value: 0n,
  });
  console.log('[increaseLiquidity] txHash', txHash);
}

async function decreaseLiquidity(
  token0: Address,
  token1: Address,
  tokenId: bigint,
  liquidity: bigint,
  amount0Min: bigint,
  amount1Min: bigint,
) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();

  console.log('[decreaseLiquidity] Parameters:', {
    tokenId: tokenId.toString(),
    liquidity: liquidity.toString(),
    amount0Min: amount0Min.toString(),
    amount1Min: amount1Min.toString(),
  });

  const call = clService.encodeDecreaseLiquidity(
    token0,
    token1,
    tokenId,
    liquidity,
    amount0Min,
    amount1Min,
    clConfig.clPositionManager,
  );

  const txHash = await spokeProvider.walletProvider.sendTransaction({
    to: call.address,
    from: wallet,
    data: call.data,
    value: 0n,
  });
  console.log('[decreaseLiquidity] txHash', txHash);
}

async function burnPosition(token0: Address, token1: Address, tokenId: bigint, amount0Min: bigint, amount1Min: bigint) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();

  console.log('[burnPosition] Parameters:', {
    tokenId: tokenId.toString(),
    amount0Min: amount0Min.toString(),
    amount1Min: amount1Min.toString(),
  });

  const call = clService.encodeBurnPosition(
    token0,
    token1,
    tokenId,
    amount0Min,
    amount1Min,
    clConfig.clPositionManager,
  );

  const txHash = await spokeProvider.walletProvider.sendTransaction({
    to: call.address,
    from: wallet,
    data: call.data,
    value: 0n,
  });
  console.log('[burnPosition] txHash', txHash);
}

async function swap(tokenIn: Address, tokenOut: Address, amountIn: bigint, amountOutMinimum: bigint) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();

  // Build pool key for the swap
  const poolKey = await clService.getPoolKey({
    token0: tokenIn,
    token1: tokenOut,
  });

  // Determine swap direction (zeroForOne)
  const zeroForOne = getSwapDirection(tokenIn, poolKey);

  const estimation = await clService.estimateSwap(poolKey, zeroForOne, amountIn, spokeProvider.publicClient);
  console.log('[swap] estimation', estimation);
  const call = ConcentratedLiquidityService.encodeSwapInfinity(
    poolKey,
    zeroForOne,
    amountIn,
    0n, // No minimum for estimation
    clConfig.router,
  );

  const txHash = await spokeProvider.walletProvider.sendTransaction({
    to: call.address,
    from: wallet,
    data: call.data,
    value: 0n,
  });
  console.log('[swap] txHash', txHash);
}

/**
 * Get supply parameters for a specific price range
 */
async function getSupplyParamsRange(
  token0: Address,
  token1: Address,
  amount0: bigint,
  minPrice: number,
  maxPrice: number,
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
  const poolKey = await clService.getPoolKey({
    token0,
    token1,
  });

  const result = await calculateLiquidityParams(poolKey, minPrice, maxPrice, spokeProvider.publicClient, { amount0 });

  console.log('✅ [getSupplyParamsRange] Parameters calculated:', {
    inputAmount0: amount0.toString(),
    calculatedAmount1: result.amount1.toString(),
    liquidity: result.liquidity.toString(),
    tickLower: result.tickLower,
    tickUpper: result.tickUpper,
    currentTick: result.currentTick,
    currentPrice: result.currentPrice,
    priceBA: result.priceBA.toFixed(8),
    priceAB: result.priceAB.toFixed(8),
    priceRange: {
      min: minPrice.toFixed(8),
      max: maxPrice.toFixed(8),
    },
  });

  return result;
}

/**
 * Get current price from the pool
 */
async function getCurrentPrice(
  token0: Address,
  token1: Address,
): Promise<{
  currentPrice: number;
  priceBA: number;
  priceAB: number;
  currentTick: number;
  sqrtPriceX96: bigint;
}> {
  console.log('📊 [getCurrentPrice] Fetching current price from pool...');

  const poolKey = await clService.getPoolKey({
    token0,
    token1,
  });

  // Get pool slot0 data
  const slot0Data = await getPoolSlot0(poolKey, spokeProvider.publicClient);

  // Convert sqrtPriceX96 to actual price
  const sqrtPriceX96Number = Number(slot0Data.sqrtPriceX96);
  const currentPrice = (sqrtPriceX96Number / 2 ** 96) ** 2;
  const priceBA = currentPrice; // B/A price (token1/token0)
  const priceAB = 1 / currentPrice; // A/B price (token0/token1)

  console.log('✅ [getCurrentPrice] Current pool state:', {
    currentTick: slot0Data.tick,
    sqrtPriceX96: slot0Data.sqrtPriceX96.toString(),
    priceBA: priceBA.toFixed(12),
    priceAB: priceAB.toFixed(2),
    protocolFee: slot0Data.protocolFee,
    lpFee: slot0Data.lpFee,
  });

  return {
    currentPrice,
    priceBA,
    priceAB,
    currentTick: slot0Data.tick,
    sqrtPriceX96: slot0Data.sqrtPriceX96,
  };
}

/**
 * Estimate swap output and gas cost using the service
 */
async function estimateSwap(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
): Promise<{
  amountOut: bigint;
  gasEstimate: bigint;
  gasCostInWei: bigint;
  effectivePrice: number;
  priceImpact: number;
  currentPrice: number;
  zeroForOne: boolean;
  poolKey: {
    currency0: Address;
    currency1: Address;
    hooks: Address;
    poolManager: Address;
    fee: number;
    parameters: `0x${string}`;
  };
}> {
  console.log('📊 [estimateSwap] Estimating swap using service...');

  // Build pool key
  const poolKey = await clService.getPoolKey({
    token0: tokenIn,
    token1: tokenOut,
  });

  // Determine swap direction using utility
  const zeroForOne = getSwapDirection(tokenIn, poolKey);

  // Use the service to estimate the swap
  const estimation = await clService.estimateSwap(poolKey, zeroForOne, amountIn, spokeProvider.publicClient);

  return {
    ...estimation,
    zeroForOne,
    poolKey,
  };
}

/**
 * Get detailed position information for a given token ID
 */
async function getPositions(tokenId: bigint): Promise<void> {
  console.log('🔍 [getPositions] Fetching position info for tokenId:', tokenId.toString());

  try {
    const positionInfo = await clService.getPositionInfo(tokenId, spokeProvider.publicClient);

    console.log('✅ [getPositions] Position retrieved successfully!');
    console.log('');
    console.log('📊 Position Analysis Report:');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('🆔 Position Basics:');
    console.log(`   Token ID: ${tokenId.toString()}`);
    console.log(`   Token Pair: ${positionInfo.poolKey.currency0} / ${positionInfo.poolKey.currency1}`);
    console.log(`   Pool ID: ${positionInfo.metadata.poolId}`);
    console.log('');
    console.log('💰 Price Information:');
    console.log(`   Current Price: ${positionInfo.priceRange.currentPrice.toFixed(8)}`);
    console.log(
      `   Position Range: ${positionInfo.priceRange.minPrice.toFixed(8)} - ${positionInfo.priceRange.maxPrice.toFixed(8)}`,
    );
    console.log(`   Range Width: ${positionInfo.metadata.priceRangePercent.toFixed(2)}%`);
    console.log(`   Position Status: ${positionInfo.priceRange.pricePosition.toUpperCase()}`);
    console.log(`   In Range: ${positionInfo.priceRange.isInRange ? '✅ YES' : '❌ NO'}`);
    console.log('');
    console.log('🎯 Position Details:');
    console.log(`   Tick Range: ${positionInfo.tickLower} to ${positionInfo.tickUpper}`);
    console.log(`   Tick Spacing: ${positionInfo.metadata.tickSpacing}`);
    console.log(`   Position Width: ${positionInfo.metadata.positionWidth} ticks`);
    console.log(`   Liquidity: ${positionInfo.liquidity.toString()}`);
    console.log('');
    console.log('🪙 Token Amounts:');
    console.log(`   Token0 (${positionInfo.poolKey.currency0}):`);
    console.log(`     Amount: ${positionInfo.tokenAmounts.amount0.toString()}`);
    console.log(`   Token1 (${positionInfo.poolKey.currency1}):`);
    console.log(`     Amount: ${positionInfo.tokenAmounts.amount1.toString()}`);
    console.log('');
    console.log('💎 Position Value:');
    console.log(`   Total Value (in token0): ${positionInfo.tokenAmounts.value0AtCurrentPrice.toString()}`);
    console.log(`   Total Value (in token1): ${positionInfo.tokenAmounts.value1AtCurrentPrice.toString()}`);
    console.log('');
    console.log('📈 Fee Information:');
    console.log(`   Fee Growth Inside 0: ${positionInfo.feeGrowthInside0LastX128.toString()}`);
    console.log(`   Fee Growth Inside 1: ${positionInfo.feeGrowthInside1LastX128.toString()}`);
    console.log('');
    console.log('🎨 Liquidity Status:');
    if (positionInfo.priceRange.isInRange) {
      console.log('   🟢 Position is ACTIVE - Earning fees and participating in swaps');
      console.log('   💧 Liquidity is being utilized');
    } else if (positionInfo.priceRange.pricePosition === 'below') {
      console.log('   🔴 Position is INACTIVE - Price is BELOW range');
      console.log('   🪙 Only Token0 is held, no Token1');
      console.log('   💡 Price needs to move UP to activate position');
    } else {
      console.log('   🔴 Position is INACTIVE - Price is ABOVE range');
      console.log('   🪙 Only Token1 is held, no Token0');
      console.log('   💡 Price needs to move DOWN to activate position');
    }
    console.log('');
    console.log('══════════════════════════════════════════════════════════════');

    // Also output as JSON for programmatic access
    console.log('');
    console.log('📄 JSON Output (for programmatic access):');
    console.log(
      JSON.stringify(
        {
          tokenId: tokenId.toString(),
          position: {
            poolKey: positionInfo.poolKey,
            liquidity: positionInfo.liquidity.toString(),
            tickRange: {
              lower: positionInfo.tickLower,
              upper: positionInfo.tickUpper,
            },
            priceRange: {
              min: positionInfo.priceRange.minPrice,
              max: positionInfo.priceRange.maxPrice,
              current: positionInfo.priceRange.currentPrice,
              status: positionInfo.priceRange.pricePosition,
              inRange: positionInfo.priceRange.isInRange,
            },
            tokenAmounts: {
              token0: positionInfo.tokenAmounts.amount0.toString(),
              token1: positionInfo.tokenAmounts.amount1.toString(),
              value0: positionInfo.tokenAmounts.value0AtCurrentPrice.toString(),
              value1: positionInfo.tokenAmounts.value1AtCurrentPrice.toString(),
            },
            metadata: {
              poolId: positionInfo.metadata.poolId,
              tickSpacing: positionInfo.metadata.tickSpacing,
              rangeWidth: positionInfo.metadata.priceRangePercent,
            },
          },
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error('❌ [getPositions] Error fetching position:', error);
    throw error;
  }
}

// Main function to decide which function to call
async function main() {
  const functionName = process.argv[2];

  if (functionName === 'supplyLiquidity') {
    console.log('supplyLiquidity');
    console.log(process.argv);
    const token0 = process.argv[3] as Address;
    const token1 = process.argv[4] as Address;
    const tickLower = BigInt(process.argv[5]);
    const tickUpper = BigInt(process.argv[6]);
    const liquidity = BigInt(process.argv[7]);
    const amount0Desired = BigInt(process.argv[8]);
    const amount1Desired = BigInt(process.argv[9]);
    await supplyLiquidity(token0, token1, tickLower, tickUpper, liquidity, amount0Desired, amount1Desired);
  } else if (functionName === 'increaseLiquidity') {
    const token0 = process.argv[3] as Address;
    const token1 = process.argv[4] as Address;
    const tokenId = BigInt(process.argv[5]);
    const liquidity = BigInt(process.argv[6]);
    const amount0Max = BigInt(process.argv[7]);
    const amount1Max = BigInt(process.argv[8]);
    await increaseLiquidity(token0, token1, tokenId, liquidity, amount0Max, amount1Max);
  } else if (functionName === 'decreaseLiquidity') {
    const token0 = process.argv[3] as Address;
    const token1 = process.argv[4] as Address;
    const tokenId = BigInt(process.argv[5]);
    const liquidity = BigInt(process.argv[6]);
    const amount0Min = BigInt(process.argv[7]);
    const amount1Min = BigInt(process.argv[8]);
    await decreaseLiquidity(token0, token1, tokenId, liquidity, amount0Min, amount1Min);
  } else if (functionName === 'burnPosition') {
    const token0 = process.argv[3] as Address;
    const token1 = process.argv[4] as Address;
    const tokenId = BigInt(process.argv[5]);
    const amount0Min = BigInt(process.argv[6]);
    const amount1Min = BigInt(process.argv[7]);
    await burnPosition(token0, token1, tokenId, amount0Min, amount1Min);
  } else if (functionName === 'getSupplyParamsRange') {
    const token0 = process.argv[3] as Address;
    const token1 = process.argv[4] as Address;
    const amount0 = BigInt(process.argv[5]);
    const minPrice = Number(process.argv[6]);
    const maxPrice = Number(process.argv[7]);
    const result = await getSupplyParamsRange(token0, token1, amount0, minPrice, maxPrice);
    console.log(
      '📊 Supply parameters:',
      JSON.stringify(
        {
          inputAmount0: result.amount0.toString(),
          calculatedAmount1: result.amount1.toString(),
          liquidity: result.liquidity.toString(),
          tickLower: result.tickLower,
          tickUpper: result.tickUpper,
          currentTick: result.currentTick,
          prices: {
            current: result.currentPrice,
            BA: result.priceBA,
            AB: result.priceAB,
          },
        },
        null,
        2,
      ),
    );
  } else if (functionName === 'getCurrentPrice') {
    const token0 = process.argv[3] as Address;
    const token1 = process.argv[4] as Address;
    const result = await getCurrentPrice(token0, token1);
    console.log(
      '💰 Current Price:',
      JSON.stringify(
        {
          currentTick: result.currentTick,
          sqrtPriceX96: result.sqrtPriceX96.toString(),
          prices: {
            'token1/token0 (B/A)': result.priceBA.toFixed(12),
            'token0/token1 (A/B)': result.priceAB.toFixed(2),
          },
        },
        null,
        2,
      ),
    );
  } else if (functionName === 'estimateSwap') {
    const tokenIn = process.argv[3] as Address;
    const tokenOut = process.argv[4] as Address;
    const amountIn = BigInt(process.argv[5]);
    const result = await estimateSwap(tokenIn, tokenOut, amountIn);
    console.log(
      '📊 Swap Estimation:',
      JSON.stringify(
        {
          input: {
            tokenIn,
            tokenOut,
            amountIn: amountIn.toString(),
          },
          output: {
            amountOut: result.amountOut.toString(),
            effectivePrice: result.effectivePrice.toFixed(12),
            priceImpact: `${result.priceImpact.toFixed(4)}%`,
          },
          costs: {
            gasEstimate: result.gasEstimate.toString(),
            gasCostInEth: (Number(result.gasCostInWei) / 1e18).toFixed(8),
          },
          details: {
            zeroForOne: result.zeroForOne,
            swapDirection: result.zeroForOne ? 'token0 → token1' : 'token1 → token0',
          },
        },
        null,
        2,
      ),
    );
  } else if (functionName === 'swap') {
    const tokenIn = process.argv[3] as Address;
    const tokenOut = process.argv[4] as Address;
    const amountIn = BigInt(process.argv[5]);
    const amountOutMinimum = BigInt(process.argv[6]);
    await swap(tokenIn, tokenOut, amountIn, amountOutMinimum);
  } else if (functionName === 'getPositions') {
    const tokenId = BigInt(process.argv[3]);
    await getPositions(tokenId);
  } else {
    console.log('❌ Function not recognized.');
    console.log('📚 Available functions:');
    console.log('');
    console.log('💧 Liquidity Operations:');
    console.log('  🔍 Read Functions (Calculate Parameters):');
    console.log('    getSupplyPercentage <token0> <token1> <amount0> <priceRange%>');
    console.log('      - Calculate params for percentage-based price range (±10%)');
    console.log('      - Example: getSupplyPercentage 0x123... 0x456... 1000000000000000000 10');
    console.log('    getSupplyParamsRange <token0> <token1> <amount0> <minPrice> <maxPrice>');
    console.log('      - Calculate params for specific price range (scaled to 10^8)');
    console.log('      - Example: getSupplyParamsRange 0x123... 0x456... 1000000000000000000 87092681 95801949');
    console.log('');
    console.log('  🔧 Encode Functions (Generate Contract Calls):');
    console.log(
      '    encodeSupply <token0> <token1> <tickLower> <tickUpper> <liquidity> <amount0> <amount1> <recipient>',
    );
    console.log('      - Generate planner-based contract call with calculated parameters');
    console.log('');
    console.log('  🚀 All-in-One Functions:');
    console.log('    supplyLiquidity <token0> <token1> <tickLower> <tickUpper> <amount0> <amount1>');
    console.log('      - Direct supply with manual tick specification');
    console.log('  📤 Position Management:');
    console.log('    increaseLiquidity <token0> <token1> <tokenId> <liquidity> <amount0Max> <amount1Max>');
    console.log('      - Add liquidity to an existing position');
    console.log('    decreaseLiquidity <token0> <token1> <tokenId> <liquidity> <amount0Min> <amount1Min>');
    console.log('      - Remove liquidity from an existing position');
    console.log('    burnPosition <token0> <token1> <tokenId> <amount0Min> <amount1Min>');
    console.log('      - Burn a position NFT (removes all remaining liquidity)');
    console.log('    getPositions <tokenId>');
    console.log('      - Get detailed position information for a given token ID');
    console.log('🔄 Trading:');
    console.log('  estimateSwap <tokenIn> <tokenOut> <amountIn>');
    console.log('    - Estimate swap output, price impact, and gas costs');
    console.log('  swap <tokenIn> <tokenOut> <amountIn> <amountOutMinimum>');
    console.log('    - Execute a swap between two tokens');
    console.log('📊 Price Information:');
    console.log('  getCurrentPrice <token0> <token1>');
    console.log('    - Get current pool price and tick information');
    console.log('');
  }
}

main();
