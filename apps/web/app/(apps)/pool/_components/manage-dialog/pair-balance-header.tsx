'use client';

import type React from 'react';
import { useMemo } from 'react';
import { spokeChainConfig } from '@sodax/sdk';
import type { SpokeChainId, XToken } from '@sodax/types';
import CurrencyLogo from '@/components/shared/currency-logo';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { useAllChainXSodaBalances } from '@/hooks/useAllChainXSodaBalances';
import { formatTokenAmount } from '@/lib/utils';

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
  sodaBalanceOverride?: string;
  xSodaBalanceOverride?: string;
  sodaBalanceDelta?: bigint;
  xSodaBalanceDelta?: bigint;
};

export function PairBalanceHeader({
  chainId,
  sodaBalanceOverride,
  xSodaBalanceOverride,
  sodaBalanceDelta = 0n,
  xSodaBalanceDelta = 0n,
}: PairBalanceHeaderProps): React.JSX.Element {
  const xSodaTokenOnCurrentChain: XToken = {
    ...xSodaToken,
    xChainId: chainId,
  };
  const allChainSodaBalances = useAllChainBalances({ onlySodaTokens: true });
  const allChainXSodaBalances = useAllChainXSodaBalances([chainId]);
  const selectedSodaToken = useMemo((): XToken | undefined => {
    const selectedChainConfig = spokeChainConfig[chainId];
    if (!selectedChainConfig?.supportedTokens || !('SODA' in selectedChainConfig.supportedTokens)) {
      return undefined;
    }
    return selectedChainConfig.supportedTokens.SODA as XToken;
  }, [chainId]);
  const selectedSodaBalance = useMemo((): bigint => {
    if (!selectedSodaToken) {
      return 0n;
    }
    const selectedSodaBalanceEntry = (allChainSodaBalances[selectedSodaToken.address] || []).find(
      balanceEntry => balanceEntry.chainId === chainId,
    );
    return selectedSodaBalanceEntry?.balance ?? 0n;
  }, [allChainSodaBalances, chainId, selectedSodaToken]);
  const selectedXSodaBalance = allChainXSodaBalances.get(chainId) ?? 0n;
  const projectedSodaBalance = BigInt(selectedSodaBalance) + sodaBalanceDelta;
  const projectedXSodaBalance = selectedXSodaBalance + xSodaBalanceDelta;
  const sodaBalanceText =
    sodaBalanceOverride ?? formatTokenAmount(projectedSodaBalance, selectedSodaToken?.decimals ?? 18, 2);
  const xSodaBalanceText = xSodaBalanceOverride ?? formatTokenAmount(projectedXSodaBalance, 18, 2);

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
          current APY
        </div>
        <div className="text-center justify-start text-espresso text-(length:--body-super-comfortable) font-bold font-['Inter'] leading-5">
          8.49%
        </div>
      </div>
    </div>
  );
}
