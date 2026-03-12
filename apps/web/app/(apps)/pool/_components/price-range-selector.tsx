// apps/web/app/(apps)/pool/_components/price-range-selector.tsx
import type React from 'react';
import { PlusCircleIcon, MinusCircleIcon } from 'lucide-react';

type PriceRangeSelectorProps = {
  minPrice: number;
  maxPrice: number;
  onMinPriceChange: (price: number) => void;
  onMaxPriceChange: (price: number) => void;
  step?: number;
};

export function PriceRangeSelector({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  step = 10,
}: PriceRangeSelectorProps): React.JSX.Element {
  const handleDecreaseMin = (): void => {
    const newPrice = Math.max(0, +(minPrice - step).toFixed(2));
    onMinPriceChange(newPrice);
  };

  const handleIncreaseMin = (): void => {
    const newPrice = +(minPrice + step).toFixed(2);
    if (newPrice < maxPrice) {
      onMinPriceChange(newPrice);
    }
  };

  const handleDecreaseMax = (): void => {
    const newPrice = +(maxPrice - step).toFixed(2);
    if (newPrice > minPrice) {
      onMaxPriceChange(newPrice);
    }
  };

  const handleIncreaseMax = (): void => {
    const newPrice = +(maxPrice + step).toFixed(2);
    onMaxPriceChange(newPrice);
  };

  return (
    <>
      <div className="inline-flex justify-start items-center gap-(--layout-space-comfortable)">
        <div className="text-right justify-start text-clay text-(length:--body-tiny) font-medium font-['InterRegular'] uppercase leading-3 w-12">
          SELECTED range
        </div>
        <div className="flex justify-start items-center gap-(--layout-space-small)">
          <div className="w-0 h-10 outline outline-cherry-grey" />
          <div className="inline-flex flex-col justify-start items-start">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="justify-start text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
                Min. price
              </div>
            </div>
            <div className="inline-flex justify-center items-center gap-1">
              <div className="justify-start text-espresso text-(length:--body-comfortable) font-['InterBold'] leading-5 tabular-nums">
                {minPrice.toFixed(2)}
              </div>
              <button
                type="button"
                className="w-4 h-4 relative overflow-hidden"
                aria-label="Decrease min price"
                onClick={handleDecreaseMin}
              >
                <MinusCircleIcon className="w-4 h-4 text-clay-light hover:text-espresso cursor-pointer" />
              </button>
              <button
                type="button"
                className="w-4 h-4 relative overflow-hidden"
                aria-label="Increase min price"
                onClick={handleIncreaseMin}
              >
                <PlusCircleIcon className="w-4 h-4 text-clay-light hover:text-espresso cursor-pointer" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-start items-center gap-(--layout-space-small)">
          <div className="w-0 h-10 outline outline-cherry-grey" />
          <div className="inline-flex flex-col justify-start items-start">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="justify-start text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
                Max. price
              </div>
            </div>
            <div className="inline-flex justify-center items-center gap-1">
              <div className="justify-start text-espresso text-(length:--body-comfortable) font-['InterBold'] leading-5 tabular-nums">
                {maxPrice.toFixed(2)}
              </div>
              <button
                type="button"
                className="w-4 h-4 relative overflow-hidden"
                aria-label="Decrease max price"
                onClick={handleDecreaseMax}
              >
                <MinusCircleIcon className="w-4 h-4 text-clay-light hover:text-espresso cursor-pointer" />
              </button>
              <button
                type="button"
                className="w-4 h-4 relative overflow-hidden"
                aria-label="Increase max price"
                onClick={handleIncreaseMax}
              >
                <PlusCircleIcon className="w-4 h-4 text-clay-light hover:text-espresso cursor-pointer" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="w-4 h-20 left-[40px] top-[12px] absolute origin-top-left -rotate-90"></div>
    </>
  );
}
