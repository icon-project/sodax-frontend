import type React from 'react';
import { Button } from '@/components/ui/button';

const FULL_RANGE_MULTIPLIER = 100;
const WIDE_RANGE_FRACTION = 0.25;
const NARROW_RANGE_FRACTION = 0.1;
const PRICE_DECIMALS = 4;

type PriceRangePresetsProps = {
  currentPrice: number | null | undefined;
  onMinPriceChange: (price: number) => void;
  onMaxPriceChange: (price: number) => void;
};

const presetButtonClass =
  "outline-none border-none shadow-none text-(length:--body-fine-print) px-2 py-1 h-[22px] font-['InterRegular']";

export function PriceRangePresets({
  currentPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: PriceRangePresetsProps): React.JSX.Element {
  const isAvailable = typeof currentPrice === 'number' && Number.isFinite(currentPrice) && currentPrice > 0;

  const applyPreset = (minMultiplier: number, maxMultiplier: number): void => {
    if (!isAvailable || currentPrice === null || currentPrice === undefined) {
      return;
    }
    onMinPriceChange(+(currentPrice * minMultiplier).toFixed(PRICE_DECIMALS));
    onMaxPriceChange(+(currentPrice * maxMultiplier).toFixed(PRICE_DECIMALS));
  };

  return (
    <div className="inline-flex justify-start items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!isAvailable}
        onClick={(): void => applyPreset(1 / FULL_RANGE_MULTIPLIER, FULL_RANGE_MULTIPLIER)}
        className={presetButtonClass}
      >
        Full range
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!isAvailable}
        onClick={(): void => applyPreset(1 - WIDE_RANGE_FRACTION, 1 + WIDE_RANGE_FRACTION)}
        className={presetButtonClass}
      >
        Wide
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!isAvailable}
        onClick={(): void => applyPreset(1 - NARROW_RANGE_FRACTION, 1 + NARROW_RANGE_FRACTION)}
        className={presetButtonClass}
      >
        Narrow
      </Button>
    </div>
  );
}
