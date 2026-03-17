// apps/web/app/(apps)/pool/_components/manage-dialog/withdraw-tab-content.tsx
import type React from 'react';
import { Loader2 } from 'lucide-react';
import type { ClPositionInfo, PoolData } from '@sodax/sdk';
import type { SpokeChainId } from '@sodax/types';
import Image from 'next/image';
import { PairBalanceHeader } from '@/app/(apps)/pool/_components/manage-dialog/pair-balance-header';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { CustomSlider } from '@/components/ui/customer-slider';
import Tip from '@/app/(apps)/stake/_components/icons/tip';
import { formatTokenAmount } from '@/lib/utils';

const QUICK_WITHDRAW_OPTIONS: readonly number[] = [25, 50, 100];
const MAX_WITHDRAW_PERCENTAGE = 100;
const PERCENTAGE_BASIS_POINTS = 10000n;

function clampPercentage(value: number): number {
  return Math.min(Math.max(value, 0), MAX_WITHDRAW_PERCENTAGE);
}

function getDisplayPercentage(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(1);
}

function toBasisPoints(percentage: number): bigint {
  const clampedPercentage = clampPercentage(percentage);
  if (clampedPercentage === MAX_WITHDRAW_PERCENTAGE) {
    return PERCENTAGE_BASIS_POINTS;
  }
  return BigInt(Math.floor(clampedPercentage * 100));
}

function calculateProportionalAmount(amount: bigint, percentageBasisPoints: bigint): bigint {
  if (percentageBasisPoints >= PERCENTAGE_BASIS_POINTS) {
    return amount;
  }
  return (amount * percentageBasisPoints) / PERCENTAGE_BASIS_POINTS;
}

type WithdrawTabContentProps = {
  chainId: SpokeChainId;
  poolData: PoolData;
  positionInfo: ClPositionInfo;
  withdrawPercentage: string;
  isPending: boolean;
  isWithdrawPending: boolean;
  onWithdrawPercentageChange: (value: string) => void;
  onWithdrawLiquidity: () => void;
};

export function WithdrawTabContent({
  chainId,
  poolData,
  positionInfo,
  withdrawPercentage,
  isPending,
  isWithdrawPending,
  onWithdrawPercentageChange,
  onWithdrawLiquidity,
}: WithdrawTabContentProps): React.JSX.Element {
  const parsedWithdrawPercentage = Number.parseFloat(withdrawPercentage);
  const normalizedWithdrawPercentage = Number.isFinite(parsedWithdrawPercentage)
    ? clampPercentage(parsedWithdrawPercentage)
    : 0;
  const withdrawBasisPoints = toBasisPoints(normalizedWithdrawPercentage);
  const hasValidWithdrawSelection = withdrawBasisPoints > 0n;
  const withdrawPercentageText = getDisplayPercentage(normalizedWithdrawPercentage);
  const withdrawToken0FromLiquidity = calculateProportionalAmount(positionInfo.amount0, withdrawBasisPoints);
  const withdrawToken1FromLiquidity = calculateProportionalAmount(positionInfo.amount1, withdrawBasisPoints);
  // Any withdraw operation also claims all currently accrued fees.
  const withdrawToken0Total = withdrawToken0FromLiquidity + positionInfo.unclaimedFees0;
  const withdrawToken1Total = withdrawToken1FromLiquidity + positionInfo.unclaimedFees1;
  const withdrawToken0Text = formatTokenAmount(withdrawToken0Total, poolData.token0.decimals, 2);
  const withdrawToken1Text = formatTokenAmount(withdrawToken1Total, poolData.token1.decimals, 2);
  const earnedToken0Text = formatTokenAmount(positionInfo.unclaimedFees0, poolData.token0.decimals, 4);
  const earnedToken1Text = formatTokenAmount(positionInfo.unclaimedFees1, poolData.token1.decimals, 4);
  console.log('withdrawToken0Total', withdrawToken0Total);
  return (
    <TabsContent value="withdraw">
      <div className="self-stretch mt-4">
        <PairBalanceHeader
          chainId={chainId}
          sodaBalanceDelta={withdrawToken0Total}
          xSodaBalanceDelta={withdrawToken1Total}
        />
      </div>
      <div className="self-stretch p-6 bg-blend-multiply bg-almost-white rounded-2xl inline-flex flex-col justify-start items-start gap-4 w-full relative mt-10">
        <div className="absolute -top-8 left-8 translate-y-full z-10 pointer-events-none rotate-180">
          <Tip fill="var(--color-almost-white)" />
        </div>
        <div className="text-center justify-center text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">
          withdraw liquidity
        </div>
        <div className="self-stretch inline-flex justify-center items-center gap-2">
          <div className="flex justify-start items-center gap-1">
            {QUICK_WITHDRAW_OPTIONS.map(option => {
              const isActive = normalizedWithdrawPercentage === option;
              const buttonText = option === MAX_WITHDRAW_PERCENTAGE ? 'MAX' : `${option}%`;

              return (
                <button
                  key={option}
                  type="button"
                  className={`h-4 px-2 mix-blend-multiply rounded-[256px] flex justify-center items-center gap-1 transition-colors cursor-pointer ${
                    isActive ? 'bg-cherry-bright text-white' : 'bg-cream-white text-clay hover:bg-cherry-grey'
                  }`}
                  onClick={() => onWithdrawPercentageChange(option.toString())}
                >
                  <span className="text-center justify-center text-[9px] font-bold font-['Inter'] uppercase leading-3">
                    {buttonText}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 h-6 relative inline-flex flex-col justify-center items-start">
            <CustomSlider
              id="withdraw-percentage-slider"
              value={[normalizedWithdrawPercentage]}
              onValueChange={value => onWithdrawPercentageChange(value[0]?.toString() ?? '0')}
              className="w-full"
              min={0}
              max={100}
              step={0.1}
              trackClassName="bg-cream-white"
              rangeClassName="bg-cherry-bright"
              thumbClassName="cursor-pointer bg-white !border-white border-gray-400 w-6 h-6 [filter:drop-shadow(0_2px_24px_#EDE6E6)]"
            />
          </div>
          <div className="w-10 h-4 px-2 mix-blend-multiply bg-cream-white rounded-[256px] flex justify-center items-center gap-1">
            <div className="text-center justify-center text-espresso text-[9px] font-bold font-['Inter'] uppercase leading-3 tabular-nums">
              {withdrawPercentageText}%
            </div>
          </div>
        </div>
        <div className="inline-flex justify-start items-center gap-6">
          <div className="text-right justify-start text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">
            YOU GET
          </div>
          <div className="flex justify-start items-center gap-3">
            <div className="w-0 h-10 outline outline-cherry-grey" />
            <div className="w-24 inline-flex flex-col justify-start items-start">
              <div className="inline-flex justify-center items-center gap-2">
                <div className="bg-white rounded-[384px] shadow-[-4.5px_0px_6px_0px_rgba(175,145,145,0.20)] outline-[3px] outline-white inline-flex flex-col justify-center items-center overflow-hidden">
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
                  {withdrawToken0Text}
                </div>
              </div>
              <div className="justify-start text-clay text-(length:--body-small) font-normal font-['Inter'] leading-4">
                + {earnedToken0Text} earned
              </div>
            </div>
          </div>
          <div className="flex justify-start items-center gap-3">
            <div className="w-0 h-10 outline outline-cherry-grey" />
            <div className="w-24 inline-flex flex-col justify-start items-start">
              <div className="inline-flex justify-center items-center gap-2">
                <div className="bg-white rounded-[384px] shadow-[-4.5px_0px_6px_0px_rgba(175,145,145,0.20)] outline-[3px] outline-white inline-flex flex-col justify-center items-center overflow-hidden">
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
                  {withdrawToken1Text}
                </div>
              </div>
              <div className="justify-start text-clay text-(length:--body-small) font-normal font-['Inter'] leading-4">
                + {earnedToken1Text} earned
              </div>
            </div>
          </div>
        </div>
      </div>
      <Button
        className="w-full mt-2"
        variant="cherry"
        onClick={onWithdrawLiquidity}
        disabled={isPending || !hasValidWithdrawSelection}
      >
        {isWithdrawPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Withdraw
      </Button>
    </TabsContent>
  );
}
