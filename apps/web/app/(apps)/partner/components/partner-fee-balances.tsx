'use client';

import { useMemo } from 'react';
import { ChainGroup } from '@/components/shared/wallet-modal/chain-group';
import { availableChains } from '@/constants/chains';
import { PartnerFeeToken } from './partner-fee-token';
import type { FeeClaimAsset } from '../utils/useFeeClaimAssets';

type PartnerFeeBalancesProps = {
  assets: FeeClaimAsset[];
  isLoading: boolean;
  onClaim: (asset: FeeClaimAsset) => void;
  hasPreferences: boolean;
};

export function PartnerFeeBalances({ assets, isLoading, onClaim }: PartnerFeeBalancesProps) {
  const assetsByChain = useMemo(() => {
    const map = new Map<string, FeeClaimAsset[]>();

    // 1. Group assets by chain as before
    assets.forEach(asset => {
      const chainId = String(asset.currency.xChainId);
      const existing = map.get(chainId);

      if (existing) {
        existing.push(asset);
      } else {
        map.set(chainId, [asset]);
      }
    });

    // 2. Convert to array and sort EVERYTHING
    return Array.from(map.entries())
      .map(([chainId, chainAssets]) => {
        // Find chain info once for sorting
        const chainInfo = availableChains.find(c => String(c.id) === chainId);

        // Sort ASSETS inside the chain alphabetically by symbol
        const sortedAssets = [...chainAssets].sort((a, b) => a.currency.symbol.localeCompare(b.currency.symbol));

        return {
          chainId,
          chainName: chainInfo?.name ?? `Unknown (${chainId})`,
          chainInfo,
          assets: sortedAssets,
        };
      })
      .sort((a, b) => a.chainName.localeCompare(b.chainName));
  }, [assets]);

  return (
    <main>
      <div className="text-lg font-semibold text-clay mb-6">Your fee balances</div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-6 w-1/2 rounded bg-clay-light/20 animate-pulse" />
          <div className="h-6 w-1/2 rounded bg-clay-light/20 animate-pulse" />
          <div className="h-6 w-1/2 rounded bg-clay-light/20 animate-pulse" />
          <div className="h-6 w-1/2 rounded bg-clay-light/20 animate-pulse" />
          <div className="h-6 w-1/2 rounded bg-clay-light/20 animate-pulse" />
        </div>
      ) : assets.length === 0 ? (
        <p className="text-sm text-clay-light px-4">No fee tokens found for this address.</p>
      ) : (
        <div className="space-y-3">
          {assetsByChain.map(({ chainId, chainName, chainInfo, assets: chainAssets }) => {
            if (!chainInfo) return null;

            return (
              <ChainGroup key={chainId} chainName={chainName} chainIcon={chainInfo.icon} balances={chainAssets}>
                {chainAssets.map(asset => (
                  <PartnerFeeToken
                    key={`${asset.currency.symbol}-${asset.currency.xChainId}`}
                    asset={asset}
                    onClaim={onClaim}
                    hasPreferences={true}
                  />
                ))}
              </ChainGroup>
            );
          })}
        </div>
      )}
    </main>
  );
}
