'use client';

import type React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePoolState } from '../../_stores/pool-store-provider';
import { MOCK_POOL_PAIR, MOCK_CURRENT_PRICE } from '../../_mocks';
import { chainIdToChainName } from '@/providers/constants';
import type { SpokeChainId } from '@sodax/types';

export function SupplyReviewStep(): React.JSX.Element {
  const { token0Amount, token1Amount, minPrice, maxPrice, selectedChainId } = usePoolState();

  const pair = MOCK_POOL_PAIR;
  const chainName = selectedChainId ? chainIdToChainName(selectedChainId as SpokeChainId) : '';

  const token0Usd = Number(token0Amount || 0) * MOCK_CURRENT_PRICE;
  const token1Usd = Number(token1Amount || 0) * MOCK_CURRENT_PRICE;
  const totalUsd = token0Usd + token1Usd;

  return (
    <div className="flex flex-col gap-4 px-2">
      <DialogHeader>
        <DialogTitle className="font-['InterRegular'] text-lg text-espresso">
          Create liquidity position
        </DialogTitle>
      </DialogHeader>

      {/* Amounts */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center p-3 rounded-lg bg-almost-white mix-blend-multiply">
          <span className="font-['InterRegular'] text-sm text-clay">{pair.token0.symbol}</span>
          <div className="flex flex-col items-end">
            <span className="font-['InterRegular'] text-sm text-espresso font-medium">
              {token0Amount || '0'}
            </span>
            <span className="font-['InterRegular'] text-[10px] text-clay">${token0Usd.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex justify-between items-center p-3 rounded-lg bg-almost-white mix-blend-multiply">
          <span className="font-['InterRegular'] text-sm text-clay">{pair.token1.symbol}</span>
          <div className="flex flex-col items-end">
            <span className="font-['InterRegular'] text-sm text-espresso font-medium">
              {token1Amount || '0'}
            </span>
            <span className="font-['InterRegular'] text-[10px] text-clay">${token1Usd.toFixed(2)}</span>
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

      {/* Total + chain */}
      <div className="flex justify-between items-center pt-2">
        <span className="font-['InterRegular'] text-sm text-clay">Total value</span>
        <span className="font-['InterRegular'] text-sm text-espresso font-semibold">${totalUsd.toFixed(2)}</span>
      </div>
      {chainName && (
        <div className="flex justify-between items-center">
          <span className="font-['InterRegular'] text-sm text-clay">Network</span>
          <span className="font-['InterRegular'] text-sm text-espresso">{chainName}</span>
        </div>
      )}
    </div>
  );
}
