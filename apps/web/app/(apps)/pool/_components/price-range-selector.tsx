// apps/web/app/(apps)/pool/_components/price-range-selector.tsx
import { useEffect, useState } from 'react';
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
  step = 0.01,
}: PriceRangeSelectorProps): React.JSX.Element {
  const [minInput, setMinInput] = useState<string>(minPrice.toFixed(2));
  const [maxInput, setMaxInput] = useState<string>(maxPrice.toFixed(2));

  useEffect((): void => {
    setMinInput(minPrice.toFixed(2));
  }, [minPrice]);

  useEffect((): void => {
    setMaxInput(maxPrice.toFixed(2));
  }, [maxPrice]);

  const parseAndRoundInput = (value: string): number | null => {
    if (value.trim().length === 0) {
      return null;
    }

    const parsedValue = Number.parseFloat(value);
    if (!Number.isFinite(parsedValue)) {
      return null;
    }

    return +parsedValue.toFixed(2);
  };

  const commitMinInput = (): void => {
    const parsedValue = parseAndRoundInput(minInput);
    if (parsedValue === null) {
      setMinInput(minPrice.toFixed(2));
      return;
    }

    const maxAllowedMin = Math.max(0, +(maxPrice - step).toFixed(2));
    const nextMinPrice = Math.min(Math.max(0, parsedValue), maxAllowedMin);
    onMinPriceChange(nextMinPrice);
    setMinInput(nextMinPrice.toFixed(2));
  };

  const commitMaxInput = (): void => {
    const parsedValue = parseAndRoundInput(maxInput);
    if (parsedValue === null) {
      setMaxInput(maxPrice.toFixed(2));
      return;
    }

    const minAllowedMax = +(minPrice + step).toFixed(2);
    const nextMaxPrice = Math.max(parsedValue, minAllowedMax);
    onMaxPriceChange(nextMaxPrice);
    setMaxInput(nextMaxPrice.toFixed(2));
  };

  const handleMinInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const nextValue = event.target.value;
    if (/^\d*\.?\d*$/.test(nextValue)) {
      setMinInput(nextValue);
    }
  };

  const handleMaxInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const nextValue = event.target.value;
    if (/^\d*\.?\d*$/.test(nextValue)) {
      setMaxInput(nextValue);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, commitInput: () => void): void => {
    if (event.key === 'Enter') {
      commitInput();
      event.currentTarget.blur();
    }
  };

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
              <input
                type="text"
                inputMode="decimal"
                value={minInput}
                aria-label="Min price input"
                onChange={handleMinInputChange}
                onBlur={commitMinInput}
                onKeyDown={(event): void => handleInputKeyDown(event, commitMinInput)}
                className="w-10 h-7 broder-none rounded justify-start text-espresso text-(length:--body-comfortable) font-['InterBold'] leading-5 tabular-nums bg-transparent focus-visible:outline-none focus-visible:ring-none focus-visible:ring-none"
              />
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
              <input
                type="text"
                inputMode="decimal"
                value={maxInput}
                aria-label="Max price input"
                onChange={handleMaxInputChange}
                onBlur={commitMaxInput}
                onKeyDown={(event): void => handleInputKeyDown(event, commitMaxInput)}
                className="w-10 h-7 border-none rounded justify-start text-espresso text-(length:--body-comfortable) font-['InterBold'] leading-5 tabular-nums bg-transparent focus-visible:outline-none focus-visible:ring-none focus-visible:ring-none"
              />
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
