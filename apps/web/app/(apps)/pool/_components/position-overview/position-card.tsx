'use client';

import type React from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EnrichedPosition } from '../../_mocks';
import { chainIdToChainName } from '@/providers/constants';
import type { SpokeChainId } from '@sodax/types';

interface PositionCardProps {
  position: EnrichedPosition;
  onManage: (position: EnrichedPosition) => void;
}

export function PositionCard({ position, onManage }: PositionCardProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const chainName = chainIdToChainName(position.chainId as SpokeChainId);

  const symbol0 = position.symbol0 ?? `${position.currency0.slice(0, 6)}...`;
  const symbol1 = position.symbol1 ?? `${position.currency1.slice(0, 6)}...`;

  const rangeWidth = position.priceUpper - position.priceLower;
  const currentInRange = position.inRange;

  return (
    <div
      className={cn(
        'w-full rounded-xl bg-almost-white mix-blend-multiply p-4 flex flex-col gap-3',
        'transition-all duration-200',
      )}
    >
      {/* Compact header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-['InterRegular'] text-sm text-espresso font-semibold">
                ${position.valueUsd.toFixed(2)}
              </span>
              <span className="font-['InterRegular'] text-[10px] text-green-600 font-medium">
                +${position.earnedFeesUsd.toFixed(4)}
              </span>
            </div>
            <span className="font-['InterRegular'] text-[10px] text-clay">
              {symbol0}/{symbol1} on {chainName} &middot; #{position.tokenId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-medium font-[\'InterRegular\']',
              currentInRange ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
            )}
          >
            {currentInRange ? 'In range' : 'Out of range'}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-clay transition-transform duration-200',
              isExpanded && 'rotate-180',
            )}
          />
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-2 border-t border-cream-white">
              {/* Range display */}
              <div className="flex justify-between items-center">
                <span className="font-['InterRegular'] text-xs text-clay">Range</span>
                <span className="font-['InterRegular'] text-xs text-espresso font-medium">
                  {position.priceLower.toFixed(4)} — {position.priceUpper.toFixed(4)}
                </span>
              </div>

              {/* Range bar */}
              <div className="w-full h-1.5 bg-cream-white rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', currentInRange ? 'bg-green-500' : 'bg-red-400')}
                  style={{ width: `${Math.min(100, rangeWidth * 200)}%` }}
                />
              </div>

              {/* Amounts */}
              <div className="flex justify-between items-center">
                <span className="font-['InterRegular'] text-xs text-clay">{symbol0}</span>
                <span className="font-['InterRegular'] text-xs text-espresso">{position.amount0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-['InterRegular'] text-xs text-clay">{symbol1}</span>
                <span className="font-['InterRegular'] text-xs text-espresso">{position.amount1}</span>
              </div>

              {/* Manage button */}
              <button
                type="button"
                onClick={() => onManage(position)}
                className="w-full py-2 text-center font-['InterRegular'] text-xs text-cherry-soda font-medium hover:underline cursor-pointer"
              >
                Manage position
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
