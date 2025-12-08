import { hubAssets, baseChainInfo, SodaTokens } from '@sodax/sdk';
import type { MoneyMarketAsset } from '@sodax/sdk';
import type { ChainId, SpokeChainId, XToken } from '@sodax/types';
import { getSpokeTokenAddressByVault } from './utils';

/**
 * Find the MoneyMarketAsset for a borrowable asset
 *
 * @param vaultAddress The vault address to find
 * @param allMoneyMarketAssets All assets from backend
 * @returns The corresponding MoneyMarketAsset or undefined
 */
export function findMoneyMarketAssetForBorrowable(
  vaultAddress: string,
  allMoneyMarketAssets: MoneyMarketAsset[],
): MoneyMarketAsset | undefined {
  return allMoneyMarketAssets.find(asset => {
    // Sometimes hubAsset.vault refers to the reserve address, not an actual vault contract
    return asset.reserveAddress.toLowerCase() === vaultAddress.toLowerCase();
  });
}

export interface BorrowableAssetWithData {
  symbol: string;
  decimals: number;
  address: string;
  chainId: ChainId;
  vault: string;
  // Market data from backend
  availableLiquidity?: string;
  borrowAPY?: string;
  token: XToken;
}

export function getBorrowableAssetsWithMarketData(
  allMoneyMarketAssets: MoneyMarketAsset[],
  tokens: XToken[],
): BorrowableAssetWithData[] {
  const tokenMap = new Map(tokens.map(t => [t.address.toLowerCase(), t]));

  const assets: BorrowableAssetWithData[] = [];
  const seen = new Set<string>();

  const validVaults = new Set(Object.values(SodaTokens).map(v => v.address.toLowerCase()));

  for (const chainId in hubAssets) {
    const chainAssets = hubAssets[chainId as ChainId];
    if (!chainAssets) continue;

    for (const assetKey in chainAssets) {
      const hubAsset = chainAssets[assetKey];
      if (!hubAsset) continue;

      // filter out unsupported or incomplete entries
      if (
        !validVaults.has(hubAsset.vault.toLowerCase()) ||
        hubAsset.symbol.includes('.') ||
        hubAsset.symbol.toLowerCase().startsWith('soda')
      ) {
        continue;
      }

      const market = findMoneyMarketAssetForBorrowable(hubAsset.vault, allMoneyMarketAssets);
      const spokeTokenAddress = getSpokeTokenAddressByVault(chainId as SpokeChainId, hubAsset.vault);

      if (!spokeTokenAddress) continue;

      // Find the XToken that belongs to this vault on this chain
      const token = tokens.find(t => t.address.toLowerCase() === spokeTokenAddress.toLowerCase());

      if (!token) continue;

      const uniqueKey = hubAsset.vault.toLowerCase();
      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);

      assets.push({
        symbol: hubAsset.symbol,
        decimals: hubAsset.decimal,
        address: hubAsset.asset,
        chainId: chainId as ChainId,
        vault: hubAsset.vault,
        availableLiquidity: market?.totalATokenBalance,
        borrowAPY: market?.variableBorrowRate,
        token,
      });
    }
  }

  return assets.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export function getChainLabel(chainId: string) {
  return baseChainInfo[chainId]?.name ?? chainId;
}
