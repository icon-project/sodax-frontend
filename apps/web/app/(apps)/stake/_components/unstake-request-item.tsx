import type React from 'react';
import { useMemo } from 'react';
import type { UnstakeRequestWithPenalty, StakingConfig, SpokeProvider } from '@sodax/sdk';
import { useClaim, useCancelUnstake } from '@sodax/dapp-kit';
import { formatTokenAmount, getTimeRemaining } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import LoadingThreeDotsJumping from '@/components/shared/loading-three-dots-jumping';
import { CircleCheck, MinusCircleIcon, XCircleIcon } from 'lucide-react';

interface UnstakeRequestItemProps {
  request: UnstakeRequestWithPenalty;
  stakingConfig: StakingConfig | undefined;
  spokeProvider: SpokeProvider | undefined;
}

export function UnstakeRequestItem({
  request,
  stakingConfig,
  spokeProvider,
}: UnstakeRequestItemProps): React.JSX.Element {
  const { mutateAsync: claim, isPending: isClaiming } = useClaim(spokeProvider);
  const { mutateAsync: cancelUnstake, isPending: isCancellingUnstake } = useCancelUnstake(spokeProvider);

  const timeRemaining = useMemo((): string => {
    if (!stakingConfig) {
      return 'Loading...';
    }
    return getTimeRemaining(request.request.startTime, stakingConfig.unstakingPeriod);
  }, [request.request.startTime, stakingConfig]);

  const isReadyToClaim = useMemo((): boolean => {
    return timeRemaining === 'Unstake complete';
  }, [timeRemaining]);

  const progressPercentage = useMemo((): number => {
    if (!request.request.amount || request.request.amount === 0n) {
      return 0;
    }
    // Calculate progress based on claimable amount vs total amount
    // This shows progress for the remaining value (starting from initial claimable amount, not 0)
    const totalAmount = Number(request.request.amount);
    const claimableAmount = Number(request.claimableAmount);
    const progress = Math.min(100, Math.max(0, (claimableAmount / totalAmount) * 100));
    return progress;
  }, [request.request.amount, request.claimableAmount]);

  const claimableAmountFormatted = formatTokenAmount(request.claimableAmount, 18, 4);
  const totalAmountFormatted = formatTokenAmount(request.request.amount, 18, 4);
  const penaltyPercentage = request.penaltyPercentage.toFixed(1);

  const completionDate = useMemo((): string => {
    if (!stakingConfig) {
      return '';
    }
    const start = Number(request.request.startTime);
    const period = Number(stakingConfig.unstakingPeriod);
    const completionTimestamp = (start + period) * 1000;
    return new Date(completionTimestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, [request.request.startTime, stakingConfig]);

  const handleClaim = async (): Promise<void> => {
    if (!spokeProvider) {
      return;
    }

    try {
      await claim({
        requestId: request.id,
        amount: request.claimableAmount,
      });
    } catch (error) {
      console.error('Claim error:', error);
    }
  };

  const handleCancel = async (): Promise<void> => {
    if (!spokeProvider) {
      return;
    }

    try {
      await cancelUnstake({
        requestId: request.id,
      });
    } catch (error) {
      console.error('Cancel unstake error:', error);
    }
  };

  return (
    <div className="w-full inline-flex flex-col justify-start items-start gap-4">
      <div className="w-full flex flex-col justify-start items-start gap-1">
        <div className="inline-flex justify-start items-center gap-2">
          <div className="justify-center text-clay text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-5">
            {timeRemaining}
          </div>
          {isReadyToClaim ? null : <LoadingThreeDotsJumping />}
        </div>

        <div className="w-full inline-flex justify-between items-center">
          <div className="justify-center">
            {isReadyToClaim ? (
              <>
                <span className="text-espresso text-(length:--body-small) font-['InterBold'] leading-4">
                  {totalAmountFormatted} SODA
                </span>
                <span className="text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
                  {' '}
                  SODA
                </span>
              </>
            ) : (
              <>
                <span className="text-espresso text-(length:--body-small) font-['InterBold'] leading-4">
                  {claimableAmountFormatted}
                </span>
                <span className="text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
                  {' '}
                  / {totalAmountFormatted} SODA
                </span>
              </>
            )}
          </div>
          <div className="justify-center text-clay text-(length:--body-fine-print) font-normal font-['InterRegular'] leading-3">
            {isReadyToClaim ? 'Ready to claim' : completionDate && <>{completionDate}</>}
          </div>
        </div>
      </div>

      <Progress value={progressPercentage} className="h-1 bg-almost-white rounded-[40px] [&>div]:bg-clay-light" />

      <div className="inline-flex justify-start items-center gap-4">
        {isReadyToClaim ? (
          <button
            type="button"
            onClick={handleClaim}
            disabled={isClaiming || isCancellingUnstake || !spokeProvider}
            className="rounded-2xl flex justify-center items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
          >
            <CircleCheck className="w-4 h-4" />
            <div className="justify-start text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
              Claim full value
            </div>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleClaim}
              disabled={isClaiming || isCancellingUnstake || !spokeProvider}
              className="rounded-2xl flex justify-center items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
            >
              <MinusCircleIcon className="w-4 h-4" />
              <div className="justify-start text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
                {isClaiming ? 'Claiming...' : `Claim early –${penaltyPercentage}%`}
              </div>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isClaiming || isCancellingUnstake || !spokeProvider}
              className="rounded-2xl flex justify-center items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
            >
              <XCircleIcon className="w-4 h-4" />
              <div className="justify-start text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
                {isCancellingUnstake ? 'Cancelling...' : 'Cancel'}
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
