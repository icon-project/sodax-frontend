'use client';

import { useMemo } from 'react';
import { ChainGroup } from '@/components/shared/wallet-modal/chain-group';
import { availableChains, getChainName } from '@/constants/chains';
import { PartnerFeeToken } from './partner-fee-token';
import type { SetSwapPreferenceParams } from '@sodax/sdk';
import { ChainGroupSkeleton } from './chain-group-skeleton';
import type { FeeClaimAsset } from '../hooks/useFeeClaimAssets';
import { InfoIcon, Wallet2 } from 'lucide-react';
import { CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MIN_PARTNER_CLAIM_USD_AMOUNT } from '@/constants/partner-claim';

type PartnerFeeBalancesProps = {
  assets: FeeClaimAsset[];
  isLoading: boolean;
  onClaim: (asset: FeeClaimAsset) => void;
  prefs: SetSwapPreferenceParams | undefined;
};

export function PartnerFeeBalances({ assets, isLoading, onClaim, prefs }: PartnerFeeBalancesProps) {
  const assetsByChain = useMemo(() => {
    const map = new Map<string, FeeClaimAsset[]>();
    assets.forEach(asset => {
      const chainId = String(asset.currency.xChainId);
      const existing = map.get(chainId);
      if (existing) {
        existing.push(asset);
      } else {
        map.set(chainId, [asset]);
      }
    });

    return Array.from(map.entries())
      .map(([chainId, chainAssets]) => {
        const chainInfo = availableChains.find(c => String(c.id) === chainId);
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
    <main className="transition-all duration-500">
      <CardTitle className="text-md font-bold flex items-center gap-2 text-clay w-1/2">
        <Wallet2 className="w-4 h-4 text-clay-light" />
        Fees by network
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center">
              <InfoIcon className="w-4 h-4 text-clay-light cursor-default" />
            </span>
          </TooltipTrigger>

          <TooltipContent variant="soft" side="top" align="center" sideOffset={6} className="text-clay bg-white">
            Minimum claim amount is {MIN_PARTNER_CLAIM_USD_AMOUNT} USDC. Values in USD are estimates.
          </TooltipContent>
        </Tooltip>
      </CardTitle>
      <div className="my-3">
        {isLoading ? (
          <div className="space-y-3">
            <ChainGroupSkeleton />
          </div>
        ) : assets.length === 0 ? (
          <div className="mx-4 p-8 border-2 border-dashed border-clay-light/10 rounded-2xl flex flex-col items-center opacity-60">
            {/* Show different message based on setup status */}
            {prefs ? (
              <>
                <p className="text-sm text-clay mb-1">Destination set to {getChainName(prefs.dstChain)}</p>
                <p className="text-xs text-clay-medium">No claimable partner fees found yet.</p>
              </>
            ) : (
              <p className="text-xs text-clay-medium">Set your destination above to start tracking fees.</p>
            )}
          </div>
        ) : (
          // ALWAYS SHOW ASSETS IF THEY EXIST - buttons handle the disabled state
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
                    />
                  ))}
                </ChainGroup>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
