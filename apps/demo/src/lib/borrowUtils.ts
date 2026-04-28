import type { MoneyMarketAsset, Sodax } from '@sodax/sdk';
import type { SpokeChainKey, XToken } from '@sodax/types';

/**
 * Find the MoneyMarketAsset for a borrowable asset by matching the vault address.
 */
export function findMoneyMarketAssetForBorrowable(
  vaultAddress: string,
  allMoneyMarketAssets: readonly MoneyMarketAsset[],
): MoneyMarketAsset | undefined {
  return allMoneyMarketAssets.find(
    asset => asset.reserveAddress.toLowerCase() === vaultAddress.toLowerCase(),
  );
}

export interface BorrowableAssetWithData {
  symbol: string;
  decimals: number;
  address: string;
  chainId: SpokeChainKey;
  vault: string;
  availableLiquidity?: string;
  token: XToken;
}

/**
 * Walks every supported money-market token across all chains and produces a row per (chain, vault).
 * In v2, vault and hubAsset live on `XToken`, so we no longer need to walk a global `hubAssets` map.
 */
export function getBorrowableAssetsWithMarketData(
  sodax: Sodax,
  allMoneyMarketAssets: readonly MoneyMarketAsset[],
): BorrowableAssetWithData[] {
  const assets: BorrowableAssetWithData[] = [];
  const seen = new Set<string>();

  const supported = sodax.moneyMarket.getSupportedTokens();
  for (const [chainKey, chainTokens] of Object.entries(supported) as readonly [SpokeChainKey, readonly XToken[]][]) {
    for (const token of chainTokens) {
      if (!token.vault) continue;

      const uniqueKey = `${chainKey}-${token.vault.toLowerCase()}`;
      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);

      const market = findMoneyMarketAssetForBorrowable(token.vault, allMoneyMarketAssets);

      assets.push({
        symbol: token.symbol,
        decimals: token.decimals,
        address: token.address,
        chainId: chainKey,
        vault: token.vault,
        availableLiquidity: market?.totalATokenBalance,
        token,
      });
    }
  }

  return assets.sort((a, b) => a.symbol.localeCompare(b.symbol));
}
