'use client';

import type React from 'react';
import { useEffect } from 'react';
import type { SpokeChainId, XToken } from '@sodax/types';
import CurrencyLogo from '@/components/shared/currency-logo';
import { usePoolStore } from '@/app/(apps)/pool/_stores/pool-store-provider';

const sodaToken: XToken = {
  name: 'SODA',
  symbol: 'SODA',
  address: '0x0',
  decimals: 18,
  xChainId: 'sonic',
};

const xSodaToken: XToken = {
  name: 'xSODA',
  symbol: 'xSODA',
  address: '0x1',
  decimals: 18,
  xChainId: 'sonic',
};

type PairBalanceHeaderProps = {
  chainId: SpokeChainId;
  sodaBalanceText: string;
  xSodaBalanceText: string;
  apyPercent: number | null;
};

export function PairBalanceHeader({
  chainId,
  sodaBalanceText,
  xSodaBalanceText,
  apyPercent,
}: PairBalanceHeaderProps): React.JSX.Element {
  const poolApyPercent = usePoolStore(state => state.poolApyPercent);
  const fetchPoolApy = usePoolStore(state => state.fetchPoolApy);
  const xSodaTokenOnCurrentChain: XToken = {
    ...xSodaToken,
    xChainId: chainId,
  };
  useEffect((): void => {
    void fetchPoolApy();
  }, [fetchPoolApy]);
  const resolvedApyPercent = apyPercent ?? poolApyPercent;
  const apyText = resolvedApyPercent === null ? '--' : `${resolvedApyPercent.toFixed(2)}%`;

  return (
    <div className="self-stretch flex justify-between items-start">
      <div className="flex justify-start items-center gap-3">
        <div data-property-1="Pair" className="inline-flex flex-col justify-start items-center gap-2">
          <div className="inline-flex justify-start items-center">
            <CurrencyLogo
              currency={sodaToken}
              hideNetwork
              className="relative shadow-[0_8px_20px_0_rgba(175,145,145,0.20)] rounded-full"
            />
            <CurrencyLogo
              currency={xSodaTokenOnCurrentChain}
              className="relative -ml-4 shadow-[0_8px_20px_0_rgba(175,145,145,0.20)] rounded-full"
            />
          </div>
        </div>
        <div className="inline-flex flex-col justify-center items-start gap-0.5">
          <div className="inline-flex justify-start items-center gap-2">
            <div className="justify-center text-espresso text-(length:--body-super-comfortable) font-normal font-['Inter'] leading-5">
              SODA / xSODA
            </div>
          </div>
          <div className="inline-flex justify-start items-center gap-1">
            <div className="justify-center text-espresso text-(length:--body-small) font-bold font-['Inter'] leading-4">
              {sodaBalanceText}
            </div>
            <div className="justify-center text-clay text-(length:--body-small) font-normal font-['Inter'] leading-4">
              /
            </div>
            <div className="justify-center text-espresso text-(length:--body-small) font-bold font-['Inter'] leading-4">
              {xSodaBalanceText}
            </div>
          </div>
        </div>
      </div>
      <div className="hidden h-12 px-2 bg-blend-multiply bg-almost-white rounded-lg md:flex flex-col justify-center items-end">
        <div className="text-center justify-start text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">
          {' '}
          current APR
        </div>
        <div className="text-center justify-start text-espresso text-(length:--body-super-comfortable) font-bold font-['Inter'] leading-5">
          {apyText}
        </div>
      </div>
    </div>
  );
}
