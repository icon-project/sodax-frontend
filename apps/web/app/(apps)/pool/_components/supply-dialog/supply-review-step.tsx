'use client';

import type React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePoolState } from '../../_stores/pool-store-provider';
import { usePoolContext } from '../../_hooks/usePoolContext';
import { getDisplayTokens } from '../../_utils/display-tokens';
import { chainIdToChainName } from '@/providers/constants';
import { formatTokenAmount } from '@/lib/utils';
import type { SpokeChainId } from '@sodax/types';

export function SupplyReviewStep(): React.JSX.Element {
  const { token0Amount, token1Amount, minPrice, maxPrice, selectedChainId } = usePoolState();
  const { poolData, token0Balance, token1Balance } = usePoolContext();

  const chainName = selectedChainId ? chainIdToChainName(selectedChainId as SpokeChainId) : '';
  const { token0Symbol, token1Symbol } = getDisplayTokens(poolData);

  const token0 = poolData?.token0;
  const token1 = poolData?.token1;
  const hub0Formatted = token0 ? formatTokenAmount(token0Balance, token0.decimals) : '0';
  const hub1Formatted = token1 ? formatTokenAmount(token1Balance, token1.decimals) : '0';
  const hub0Sufficient = token0Amount === '' || Number.parseFloat(hub0Formatted) >= Number.parseFloat(token0Amount);
  const hub1Sufficient = token1Amount === '' || Number.parseFloat(hub1Formatted) >= Number.parseFloat(token1Amount);

  return (
    <div className="flex flex-col gap-4 px-2">
      <DialogHeader>
        <DialogTitle className="font-['InterRegular'] text-lg text-espresso">Create liquidity position</DialogTitle>
      </DialogHeader>

      {/* Amounts */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center p-3 rounded-lg bg-almost-white mix-blend-multiply">
          <span className="font-['InterRegular'] text-sm text-clay">{token0Symbol}</span>
          <div className="flex flex-col items-end">
            <span className="font-['InterRegular'] text-sm text-espresso font-medium">{token0Amount || '0'}</span>
          </div>
        </div>
        <div className="flex justify-between items-center p-3 rounded-lg bg-almost-white mix-blend-multiply">
          <span className="font-['InterRegular'] text-sm text-clay">{token1Symbol}</span>
          <div className="flex flex-col items-end">
            <span className="font-['InterRegular'] text-sm text-espresso font-medium">{token1Amount || '0'}</span>
          </div>
        </div>
      </div>

      {/* HUB balance status */}
      <div className="flex flex-col gap-1.5">
        <span className="font-['InterRegular'] text-xs text-clay font-medium">HUB balance</span>
        <div className="flex items-center justify-between p-2 rounded-lg bg-almost-white mix-blend-multiply">
          <span className="font-['InterRegular'] text-xs text-clay">{token0Symbol}</span>
          <div className="flex items-center gap-1.5">
            <span className="font-['InterRegular'] text-xs text-espresso">{hub0Formatted}</span>
            {hub0Sufficient ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-almost-white mix-blend-multiply">
          <span className="font-['InterRegular'] text-xs text-clay">{token1Symbol}</span>
          <div className="flex items-center gap-1.5">
            <span className="font-['InterRegular'] text-xs text-espresso">{hub1Formatted}</span>
            {hub1Sufficient ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Range */}
      <div className="flex justify-between items-center p-3 rounded-lg bg-almost-white mix-blend-multiply">
        <span className="font-['InterRegular'] text-sm text-clay">Price range</span>
        <span className="font-['InterRegular'] text-sm text-espresso font-medium">
          {minPrice} — {maxPrice}
        </span>
      </div>

      {/* Chain */}
      {chainName && (
        <div className="flex justify-between items-center pt-2">
          <span className="font-['InterRegular'] text-sm text-clay">Network</span>
          <span className="font-['InterRegular'] text-sm text-espresso">{chainName}</span>
        </div>
      )}
    </div>
  );
}
