'use client';

import type React from 'react';
import { cn } from '@/lib/utils';
import { PlusCircle, MinusCircle } from 'lucide-react';
import type { EnrichedPosition } from '../../_mocks';
import { chainIdToChainName } from '@/providers/constants';
import type { SpokeChainId } from '@sodax/types';

interface PositionCardProps {
  position: EnrichedPosition;
  onManage: (position: EnrichedPosition) => void;
  onClaim?: (position: EnrichedPosition) => void;
  currentPrice?: number;
}

export function PositionCard({ position, onManage, onClaim, currentPrice }: PositionCardProps): React.JSX.Element {
  const chainName = chainIdToChainName(position.chainId as SpokeChainId);
  const symbol0 = position.symbol0 ?? `${position.currency0.slice(0, 6)}...`;
  const symbol1 = position.symbol1 ?? `${position.currency1.slice(0, 6)}...`;

  // Range indicator: where is current price within the range?
  const rangeMin = position.priceLower;
  const rangeMax = position.priceUpper;
  const price = currentPrice ?? (rangeMin + rangeMax) / 2;
  const rangePosition = Math.max(0, Math.min(1, (price - rangeMin) / (rangeMax - rangeMin)));
  const inRange = price >= rangeMin && price <= rangeMax;

  return (
    <div className="w-full rounded-2xl bg-almost-white mix-blend-multiply p-4 flex flex-col gap-3">
      {/* Top: icons + value */}
      <div className="flex items-start gap-3">
        {/* Token icons */}
        <div className="relative w-10 h-8 shrink-0">
          <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-cream-white border-2 border-white overflow-hidden flex items-center justify-center">
            <span className="font-['InterRegular'] text-[8px] text-espresso font-semibold">{symbol0.slice(0, 2)}</span>
          </div>
          <div className="absolute left-4 top-1 w-6 h-6 rounded-full bg-cream-white border-2 border-white overflow-hidden flex items-center justify-center">
            <span className="font-['InterRegular'] text-[7px] text-espresso font-semibold">{symbol1.slice(0, 2)}</span>
          </div>
        </div>

        {/* Value + earnings */}
        <div className="flex flex-col">
          <span className="font-['InterRegular'] text-lg text-espresso font-semibold leading-tight">
            ${position.valueUsd.toFixed(2)}
          </span>
          <span
            className={cn(
              "font-['InterRegular'] text-xs font-medium leading-tight",
              position.earnedFeesUsd > 0 ? 'text-green-600' : 'text-clay',
            )}
          >
            +{position.earnedFeesUsd.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Chain + range bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <div className={cn('w-2 h-2 rounded-sm shrink-0', inRange ? 'bg-green-500' : 'bg-red-400')} />
          <span className="font-['InterRegular'] text-xs text-clay">{chainName}</span>
        </div>
        {/* Range bar with current price indicator */}
        <div className="relative w-full h-1 bg-cream-white rounded-full">
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-espresso shadow-sm"
            style={{ left: `${rangePosition * 100}%` }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-4">
        {position.earnedFeesUsd > 0 && (
          <button
            type="button"
            onClick={() => onClaim?.(position)}
            className="flex items-center gap-1 font-['InterRegular'] text-xs text-cherry-soda hover:opacity-80 transition-opacity cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Claim ${position.earnedFeesUsd.toFixed(4)}
          </button>
        )}
        <button
          type="button"
          onClick={() => onManage(position)}
          className="flex items-center gap-1 font-['InterRegular'] text-xs text-clay hover:text-espresso transition-colors cursor-pointer"
        >
          <MinusCircle className="w-3.5 h-3.5" />
          Manage
        </button>
      </div>
    </div>
  );
}
