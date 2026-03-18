import type React from 'react';
import PoolChart from './pool-chart';

type PoolInfoCardProps = {
  pairPrice?: number | null;
  minPrice?: number;
  maxPrice?: number;
  onMinPriceChange?: (price: number) => void;
  onMaxPriceChange?: (price: number) => void;
};

export function PoolInfoCard({
  pairPrice,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: PoolInfoCardProps): React.JSX.Element {
  return (
    <div className="self-stretch flex flex-col justify-start items-start">
      <div
        className="h-75 self-stretch rounded-tl-3xl rounded-tr-3xl relative
  before:absolute before:inset-0 before:rounded-tl-3xl before:rounded-tr-3xl
  before:outline-4 before:-outline-offset-4 before:outline-almost-white
  before:mix-blend-multiply before:pointer-events-none"
      >
        <div className="h-full self-stretch px-(--layout-space-big) py-8 flex flex-col justify-start items-start gap-6">
          <div className="self-stretch inline-flex justify-end items-start">
            <div className="h-12 px-2 mix-blend-multiply bg-almost-white rounded-lg inline-flex flex-col justify-center items-end">
              <div className="text-center justify-start text-clay text-(length:--body-tiny) font-medium font-['InterRegular'] uppercase leading-3">
                EST. APR
              </div>
              <div className="text-center justify-start text-espresso text-(length:--body-super-comfortable) font-['InterBold'] leading-6">
                12.31%
              </div>
            </div>
          </div>
          <div className="self-stretch">
            <PoolChart
              pairPrice={pairPrice}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={onMinPriceChange}
              onMaxPriceChange={onMaxPriceChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
