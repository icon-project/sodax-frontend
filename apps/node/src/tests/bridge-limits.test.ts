import 'dotenv/config';
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (): string {
  return String(this);
};

import {
  Sodax,
  supportedSpokeChains,
  spokeChainConfig,
  type XToken,
  type SpokeChainId,
  EvmVaultTokenService,
  vaultTokenAbi,
} from '@sodax/sdk';
import { erc20Abi } from 'viem';

/**
 * Check if a token is bridgeable to at least one other chain
 */
function isTokenBridgeable(sodax: Sodax, chainId: SpokeChainId, tokenAddress: string): boolean {
  for (const destChainId of supportedSpokeChains) {
    if (destChainId === chainId) continue;

    const bridgeableResult = sodax.bridge.getBridgeableTokens(chainId, destChainId, tokenAddress);
    if (bridgeableResult.ok && bridgeableResult.value.length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Collect tokens of a specific symbol from all supported chains
 * Only includes tokens that are bridgeable (have hub asset info)
 */
function collectTokens(sodax: Sodax, symbol: 'USDC' | 'bnUSD' | 'SODA'): XToken[] {
  const tokens: XToken[] = [];

  for (const chainId of supportedSpokeChains) {
    const chainConfig = spokeChainConfig[chainId];
    const supportedTokens = chainConfig.supportedTokens;

    if (symbol in supportedTokens) {
      const token = supportedTokens[symbol as keyof typeof supportedTokens] as XToken;

      if (isTokenBridgeable(sodax, chainId, token.address)) {
        tokens.push(token);
      }
    }
  }

  return tokens;
}

/**
 * Check if destination token is bridgeable from source token
 */
function isDestinationTokenBridgeable(sodax: Sodax, fromToken: XToken, toToken: XToken): boolean {
  const bridgeableResult = sodax.bridge.getBridgeableTokens(fromToken.xChainId, toToken.xChainId, fromToken.address);

  if (!bridgeableResult.ok) {
    return false;
  }

  return bridgeableResult.value.some(t => t.address.toLowerCase() === toToken.address.toLowerCase());
}

/**
 * Test bridgeable amount for a single token pair
 */
async function testBridgeableAmount(
  sodax: Sodax,
  fromToken: XToken,
  toToken: XToken,
  tokenSymbol: string,
): Promise<void> {
  const result = await sodax.bridge.getBridgeableAmount(fromToken, toToken);

  if (result.ok) {
    console.log(
      `${tokenSymbol} Bridgeable amount from ${fromToken.xChainId} to ${toToken.xChainId}: ${result.value.toString()}`,
    );
  } else {
    console.error(
      `Failed to get bridgeable amount for ${tokenSymbol} from ${fromToken.xChainId} to ${toToken.xChainId}:`,
      result.error,
    );
  }
}

/**
 * Test bridgeable amounts for a set of tokens
 * Only tests pairs where tokens are actually bridgeable between chains
 */
async function testBridgeableAmounts(sodax: Sodax, tokens: XToken[], tokenSymbol: string): Promise<void> {
  for (let i = 0; i < tokens.length; i++) {
    const fromToken = tokens[i];

    for (let j = 0; j < tokens.length; j++) {
      if (i === j) continue; // Skip same chain pairs

      const toToken = tokens[j];

      if (!isDestinationTokenBridgeable(sodax, fromToken, toToken)) {
        console.log(`Skipping ${tokenSymbol} from ${fromToken.xChainId} to ${toToken.xChainId}: not bridgeable`);
        continue;
      }

      await testBridgeableAmount(sodax, fromToken, toToken, tokenSymbol);
    }
  }
}

async function printBridgeableAmounts(from: XToken, to: XToken): Promise<void> {
  const tmpSodax = new Sodax();

  const fromHubAsset = tmpSodax.config.getHubAssetInfo(from.xChainId, from.address);
  const toHubAsset = tmpSodax.config.getHubAssetInfo(to.xChainId, to.address);

  if (!fromHubAsset || !toHubAsset) {
    throw new Error(
      `Hub asset not found for token ${from.address} on chain ${from.xChainId} or ${to.address} on chain ${to.xChainId}`,
    );
  }

  const [depositTokenInfo, reserves] = await Promise.all([
    EvmVaultTokenService.getTokenInfo(fromHubAsset.vault, fromHubAsset.asset, tmpSodax.hubProvider.publicClient),
    EvmVaultTokenService.getVaultReserves(toHubAsset.vault, tmpSodax.hubProvider.publicClient),
  ]);

  console.log(`Deposit token info for ${from.symbol} ${from.address} on chain ${from.xChainId}:`, depositTokenInfo);

  // const decimalsResults = await tmpSodax.hubProvider.publicClient.multicall({
  //   contracts: reserves.tokens.map(token => ({
  //     address: token,
  //     abi: erc20Abi,
  //     functionName: 'decimals',
  //   })),
  //   allowFailure: false,
  // });
  const infos = await tmpSodax.hubProvider.publicClient.multicall({
    contracts: reserves.tokens.map(token => {
      return {
        address: toHubAsset.vault,
        abi: vaultTokenAbi,
        functionName: 'tokenInfo',
        args: [token],
      } as const;
    }),
    allowFailure: false,
  });

  const mappedInfos = infos.map(info => {
    const [decimals, depositFee, withdrawalFee, maxDeposit, isSupported] = info;
    return { decimals, depositFee, withdrawalFee, maxDeposit, isSupported };
  });

  console.log(`Reserve info of to hub asset vault ${toHubAsset.vault}:`);
  for (let i = 0; i < reserves.tokens.length; i++) {
    console.log({
      token: reserves.tokens[i],
      balance: reserves.balances[i],
      availableDeposit: mappedInfos[i].maxDeposit - reserves.balances[i],
      depositInfo: mappedInfos[i],
    });

    if (reserves.balances[i] > mappedInfos[i].maxDeposit) {
      throw new Error(`Token ${reserves.tokens[i]} has more balance than the max deposit: ${reserves.balances[i]} > ${mappedInfos[i].maxDeposit}`);
    }
    // if (reserves.balances[i] > mappedInfos[i].maxDeposit - reserves.balances[i]) {
    //   console.log(
    //     `Token ${reserves.tokens[i]} has more balance than the available deposit: ${reserves.balances[i]} > ${mappedInfos[i].maxDeposit - reserves.balances[i]}`,
    //   );
    //   break;
    // }
  }
}

/**
 * Live test to retrieve bridgeable amounts for USDC and bnUSD tokens
 * across all supported chains using BridgeService.getBridgeableAmount
 */
const sodax = new Sodax();

// Collect USDC and bnUSD tokens from all supported chains (only bridgeable ones)
const usdcTokens = collectTokens(sodax, 'USDC');
const bnusdTokens = collectTokens(sodax, 'bnUSD');
const sodaTokens = collectTokens(sodax, 'SODA');

console.log(`Found ${usdcTokens.length} chains with USDC token`);
console.log(`Found ${bnusdTokens.length} chains with bnUSD token\n`);

// Test bridgeable amounts for USDC
// console.log('=== USDC Bridgeable Amounts ===');
// await testBridgeableAmounts(sodax, usdcTokens, 'USDC');

// console.log('\n=== bnUSD Bridgeable Amounts ===');
// Test bridgeable amounts for bnUSD
// await testBridgeableAmounts(sodax, bnusdTokens, 'bnUSD');

console.log('=== USDC Bridgeable Amounts ===');
await printBridgeableAmounts(usdcTokens[0], usdcTokens[1]);

console.log('=== bnUSD Bridgeable Amounts ===');
await printBridgeableAmounts(bnusdTokens[0], bnusdTokens[1]);

console.log('=== SODA Bridgeable Amounts ===');
await printBridgeableAmounts(sodaTokens[0], sodaTokens[1]);
