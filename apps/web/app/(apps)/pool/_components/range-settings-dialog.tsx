'use client';

import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Diff, XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { usePoolStore } from '@/app/(apps)/pool/_stores/pool-store-provider';
import { getUserAPY } from '../_utils';

const WIDE_RANGE_FRACTION = 0.25;
const NARROW_RANGE_FRACTION = 0.1;
const PRICE_DECIMALS = 4;

type RangeType = 'wide' | 'narrow';

type RangeOption = {
  type: RangeType;
  label: string;
  description: string;
  fraction: number;
};

const RANGE_OPTIONS: readonly RangeOption[] = [
  {
    type: 'wide',
    label: 'Wide',
    description: 'Stays earning for longer. Low management.',
    fraction: WIDE_RANGE_FRACTION,
  },
  {
    type: 'narrow',
    label: 'Narrow',
    description: 'Earns while the price sits in your range.',
    fraction: NARROW_RANGE_FRACTION,
  },
];

type RangeSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrice: number | null | undefined;
  onMinPriceChange: (price: number) => void;
  onMaxPriceChange: (price: number) => void;
};

export function RangeSettingsDialog({
  open,
  onOpenChange,
  currentPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: RangeSettingsDialogProps): React.JSX.Element {
  const [selectedRange, setSelectedRange] = useState<RangeType>('wide');
  const poolApyPercent = usePoolStore(state => state.poolApyPercent);
  const fetchPoolApy = usePoolStore(state => state.fetchPoolApy);

  useEffect((): void => {
    if (open) {
      setSelectedRange('wide');
      void fetchPoolApy();
    }
  }, [open, fetchPoolApy]);

  const isPriceAvailable = typeof currentPrice === 'number' && Number.isFinite(currentPrice) && currentPrice > 0;

  const aprByRange = useMemo((): Record<RangeType, string> => {
    const formatApr = (fraction: number): string => {
      if (poolApyPercent === null || !isPriceAvailable || currentPrice === null || currentPrice === undefined) {
        return '—';
      }
      const lowerPrice = currentPrice * (1 - fraction);
      const upperPrice = currentPrice * (1 + fraction);
      const apr = getUserAPY(poolApyPercent, lowerPrice, upperPrice, currentPrice);
      return `${apr.toFixed(2)}%`;
    };

    return {
      wide: formatApr(WIDE_RANGE_FRACTION),
      narrow: formatApr(NARROW_RANGE_FRACTION),
    };
  }, [poolApyPercent, currentPrice, isPriceAvailable]);

  const handleApply = (): void => {
    if (!isPriceAvailable || currentPrice === null || currentPrice === undefined) {
      return;
    }
    const fraction = selectedRange === 'wide' ? WIDE_RANGE_FRACTION : NARROW_RANGE_FRACTION;
    onMinPriceChange(+(currentPrice * (1 - fraction)).toFixed(PRICE_DECIMALS));
    onMaxPriceChange(+(currentPrice * (1 + fraction)).toFixed(PRICE_DECIMALS));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full md:max-w-[480px]! py-8 px-12 gap-6 bg-vibrant-white block" hideCloseButton>
        <DialogTitle className="flex w-full justify-end h-4 relative p-0">
          <XIcon
            className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay absolute top-0"
            onClick={(): void => onOpenChange(false)}
          />
        </DialogTitle>
        <div className="self-stretch flex flex-col justify-start items-start gap-6 mt-6">
          <div className="self-stretch inline-flex justify-start items-center gap-2">
            <Image src="/soda-yellow-sm.png" alt="SODAX Symbol" width={16} height={16} className="mix-blend-multiply" />
            <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterBold'] leading-5">
              Choose your range
            </div>
          </div>
          <div className="self-stretch text-clay text-(length:--body-comfortable) font-normal font-['InterRegular'] leading-5">
            Pick how tightly to focus your liquidity.
          </div>
          <div className="self-stretch inline-flex justify-start items-start gap-2">
            {RANGE_OPTIONS.map((option): React.JSX.Element => {
              const isSelected = selectedRange === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={(): void => setSelectedRange(option.type)}
                  aria-pressed={isSelected}
                  className={`flex-1 self-stretch px-5 py-6 rounded-2xl outline outline-cream-white inline-flex flex-col justify-between items-start text-left cursor-pointer transition-all ${
                    isSelected ? 'outline-8 outline-offset-[-8px]' : 'outline-[3px] outline-offset-[-3px]'
                  }`}
                >
                  <div className="self-stretch flex flex-col justify-start items-start gap-2">
                    <div className="self-stretch inline-flex justify-between items-center">
                      <div className="text-espresso text-(length:--body-comfortable) font-normal font-['InterRegular'] leading-5 flex items-center">
                        {option.label} <Diff className="w-3 h-3 ml-1" /> {option.fraction * 100}%
                      </div>
                      <div className="w-4 h-4 relative overflow-hidden flex items-center justify-center">
                        <div className="w-3.5 h-3.5 rounded-full outline outline-[1.5px] outline-offset-[-0.75px] outline-clay-light flex items-center justify-center">
                          {isSelected && <div className="w-2 h-2 bg-clay-light rounded-full" />}
                        </div>
                      </div>
                    </div>
                    <div className="self-stretch text-clay text-(length:--body-fine-print) font-normal font-['InterRegular'] leading-3">
                      {option.description}
                    </div>
                  </div>
                  <div className="pt-2 inline-flex justify-start items-center gap-2">
                    <div>
                      <span className="text-espresso text-(length:--body-small) font-bold font-['InterBold'] leading-4">
                        {aprByRange[option.type]}
                      </span>
                      <span
                        className={`text-clay text-(length:--body-small) font-normal leading-4 ${isSelected ? `font-['InterBold'] text-espresso` : `font-['InterRegular'] text-clay`}`}
                      >
                        {' '}
                        APR
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <Button variant="cherry" onClick={handleApply} disabled={!isPriceAvailable} className="w-full">
            Apply range
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
