'use client';

import type React from 'react';
import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { Loader2, ShieldAlertIcon } from 'lucide-react';
import { dexPools, spokeChainConfig } from '@sodax/sdk';
import { usePoolData } from '@sodax/dapp-kit';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { formatBalance, formatTokenAmount } from '@/lib/utils';
import type { SpokeChainId, XToken } from '@sodax/types';
import Image from 'next/image';
import Tip from '@/app/(apps)/stake/_components/icons/tip';
import { PairBalanceHeader } from '@/app/(apps)/pool/_components/manage-dialog/pair-balance-header';

const sodaToken: XToken = {
  name: 'SODA',
  symbol: 'SODA',
  address: '0x0',
  decimals: 18,
  xChainId: 'sonic',
};

type ClaimTabContentProps = {
  chainId: SpokeChainId;
  apyPercent: number | null;
  positionSodaBalanceText: string;
  positionXSodaBalanceText: string;
  hasUnclaimedFees: boolean;
  unclaimedFees0: bigint;
  unclaimedFees1: bigint;
  error?: string;
  isPending: boolean;
  isClaimPending: boolean;
  isClaimSuccess: boolean;
  onClaimFees: () => void;
  onClaimCompleted: () => void;
};

export function ClaimTabContent({
  chainId,
  apyPercent,
  positionSodaBalanceText,
  positionXSodaBalanceText,
  hasUnclaimedFees,
  unclaimedFees0,
  unclaimedFees1,
  error,
  isPending,
  isClaimPending,
  isClaimSuccess,
  onClaimFees,
  onClaimCompleted,
}: ClaimTabContentProps): React.JSX.Element {
  const fixedPoolKey = dexPools.ASODA_XSODA;
  const selectedSodaToken = useMemo((): XToken | undefined => {
    const selectedChainConfig = spokeChainConfig[chainId];
    if (!selectedChainConfig?.supportedTokens || !('SODA' in selectedChainConfig.supportedTokens)) {
      return undefined;
    }
    return selectedChainConfig.supportedTokens.SODA as XToken;
  }, [chainId]);
  const { data: sodaPrice } = useTokenPrice(selectedSodaToken ?? sodaToken);
  const { data: poolDataRaw } = usePoolData({ poolKey: fixedPoolKey });
  const sodaPerXSodaRate = useMemo((): number | null => {
    if (!poolDataRaw) {
      return null;
    }
    const parsedRate = Number(poolDataRaw.price.toSignificant(18));
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      return null;
    }
    return parsedRate;
  }, [poolDataRaw]);
  const xSodaPrice = useMemo((): number => {
    if (!sodaPrice || !sodaPerXSodaRate) {
      return 0;
    }
    // Keep xSODA USD valuation consistent with supply flow.
    return sodaPrice / sodaPerXSodaRate;
  }, [sodaPerXSodaRate, sodaPrice]);
  const unclaimedSodaText = formatTokenAmount(unclaimedFees0, selectedSodaToken?.decimals ?? 18, 2);
  const unclaimedXSodaText = formatTokenAmount(unclaimedFees1, 18, 2);
  const unclaimedSodaUsdText = useMemo((): string => {
    const usdValue = new BigNumber(unclaimedSodaText).multipliedBy(sodaPrice ?? 0);
    return `$${formatBalance(usdValue.toString(), sodaPrice ?? 0)}`;
  }, [unclaimedSodaText, sodaPrice]);
  const unclaimedXSodaUsdText = useMemo((): string => {
    const usdValue = new BigNumber(unclaimedXSodaText).multipliedBy(xSodaPrice ?? 0);
    return `$${formatBalance(usdValue.toString(), xSodaPrice ?? 0)}`;
  }, [unclaimedXSodaText, xSodaPrice]);

  return (
    <TabsContent value="claim">
      <div className="mt-4">
        <PairBalanceHeader
          chainId={chainId}
          sodaBalanceText={positionSodaBalanceText}
          xSodaBalanceText={positionXSodaBalanceText}
          apyPercent={apyPercent}
        />
      </div>
      <div className="relative self-stretch inline-flex flex-col justify-start items-start w-full mt-10">
        <div className="absolute -top-8 left-8 translate-y-full z-10 pointer-events-none rotate-180">
          <Tip fill="var(--color-almost-white)" />{' '}
        </div>
        <div className="self-stretch px-8 py-6 bg-blend-multiply bg-almost-white rounded-2xl flex flex-col justify-start items-start gap-4">
          <div className="flex-col flex gap-4">
            <div className="text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">
              {error ? (
                <span className="text-negative flex gap-2 items-center">
                  <ShieldAlertIcon className="w-4 h-4" /> {error}
                </span>
              ) : (
                'your fees'
              )}
            </div>
            <div className="flex gap-6">
              <div className="flex justify-start items-center gap-3">
                <div className="w-0 h-10 outline outline-cherry-grey" />
                <div className="inline-flex flex-col justify-start items-start">
                  <div className="inline-flex justify-center items-center gap-2">
                    <div className="bg-white rounded-[384px] shadow-[-4.5px_0px_6px_0px_rgba(175,145,145,0.20)] outline outline-[3px] outline-white inline-flex flex-col justify-center items-center overflow-hidden">
                      <Image
                        data-property-1="SODA"
                        className="w-3 h-3 rounded-[384px]"
                        src="/coin/soda.png"
                        alt="SODA"
                        width={12}
                        height={12}
                      />
                    </div>
                    <div className="justify-start text-espresso text-(length:--body-super-comfortable) font-bold font-['Inter'] leading-5">
                      {unclaimedSodaText}
                    </div>
                  </div>
                  <div className="justify-start text-clay text-(length:--body-small) font-normal font-['Inter'] leading-4">
                    {unclaimedSodaUsdText}
                  </div>
                </div>
              </div>
              <div className="flex justify-start items-center gap-3">
                <div className="w-0 h-10 outline outline-cherry-grey" />
                <div className="inline-flex flex-col justify-start items-start">
                  <div className="inline-flex justify-center items-center gap-2">
                    <div
                      data-property-1="Default"
                      className="bg-white rounded-[384px] shadow-[-4.5px_0px_6px_0px_rgba(175,145,145,0.20)] outline outline-[3px] outline-white inline-flex flex-col justify-center items-center overflow-hidden"
                    >
                      <Image
                        data-property-1="xSODA"
                        className="w-3 h-3 rounded-[384px]"
                        src="/coin/xsoda.png"
                        alt="xSODA"
                        width={12}
                        height={12}
                      />
                    </div>
                    <div className="justify-start text-espresso text-(length:--body-super-comfortable) font-bold font-['Inter'] leading-5">
                      {unclaimedXSodaText}
                    </div>
                  </div>
                  <div className="justify-start text-clay text-(length:--body-small) font-normal font-['Inter'] leading-4">
                    {unclaimedXSodaUsdText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Button
        variant="cherry"
        className="w-full mt-2 shadow-none!"
        onClick={isClaimSuccess ? onClaimCompleted : onClaimFees}
        disabled={isClaimSuccess ? false : isPending || !hasUnclaimedFees}
      >
        {isClaimSuccess ? 'Claim Completed' : hasUnclaimedFees ? 'Claim Fee' : 'No earnings yet'}
        {isClaimPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
      </Button>
    </TabsContent>
  );
}
