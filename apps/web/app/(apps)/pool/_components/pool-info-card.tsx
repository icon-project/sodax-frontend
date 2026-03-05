// apps/web/app/(apps)/pool/_components/pool-info-card.tsx
import type React from 'react';
import CurrencyLogo from '@/components/shared/currency-logo';
import PoolChart from './pool-chart';
import type { XToken } from '@sodax/types';
import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';

const mockToken1: XToken = {
  name: 'SODA',
  symbol: 'SODA',
  address: '0x0',
  decimals: 18,
  xChainId: 'sonic',
};

const mockToken2: XToken = {
  name: 'xSODA',
  symbol: 'xSODA',
  address: '0x1',
  decimals: 18,
  xChainId: 'sonic',
};

export function PoolInfoCard(): React.JSX.Element {
  const [range, setRange] = useState({
    min: 2500,
    max: 3500,
  })

  const mockData = Array.from({ length: 100 }).map((_, i) => ({
    timestamp: Date.now() - (100 - i) * 3600000,
    price: 3000 + Math.sin(i / 10) * 400,
  }))

  return (
    <div className="self-stretch flex flex-col justify-start items-start">
      <div
        className="h-75 self-stretch px-(--layout-space-big) py-8 rounded-tl-3xl rounded-tr-3xl flex flex-col justify-start items-start gap-6 relative
  before:absolute before:inset-0 before:rounded-tl-3xl before:rounded-tr-3xl 
  before:outline before:outline-4 before:outline-offset-[-4px] before:outline-almost-white 
  before:mix-blend-multiply before:pointer-events-none"
      >
        <div className="self-stretch inline-flex justify-between items-start">
          <div className="flex justify-start items-center gap-4">
            <div data-property-1="Pair" className="inline-flex flex-col justify-start items-center gap-2">
              <div className="inline-flex justify-start items-center">
                <CurrencyLogo currency={mockToken1} hideNetwork className="relative" />
                <CurrencyLogo currency={mockToken2} hideNetwork className="relative -ml-4" tokenCount={16} isGroup />
              </div>
            </div>
            <div className="inline-flex flex-col justify-center items-start gap-1">
              <div className="inline-flex justify-start items-center gap-2">
                <div className="justify-center text-espresso text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-6">
                  SODA / xSODA
                </div>
                <ChevronDownIcon className="w-4 h-4 text-clay-light" />
              </div>
              <div className="inline-flex justify-start items-center gap-2">
                <div className="justify-center text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
                  Choose a network
                </div>
              </div>
            </div>
          </div>
          <div className="h-12 px-2 mix-blend-multiply bg-almost-white rounded-lg inline-flex flex-col justify-center items-end">
            <div className="text-center justify-start text-clay text-(length:--body-tiny) font-medium font-['InterRegular'] uppercase leading-3">
              EST. APR
            </div>
            <div className="text-center justify-start text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] leading-6">
              12.31%
            </div>
          </div>
        </div>
        <PoolChart />
      </div>
    </div>
  );
}
