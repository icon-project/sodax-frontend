// apps/web/app/(apps)/stake/_components/unstake-request-item.tsx
import type React from 'react';
import { useMemo, useState, useEffect } from 'react';
import type { UnstakeRequestWithPenalty, StakingConfig, SpokeProvider } from '@sodax/sdk';
import { useClaim, useCancelUnstake } from '@sodax/dapp-kit';
import { formatTokenAmount, getTimeRemaining } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import LoadingThreeDotsJumping from '@/components/shared/loading-three-dots-jumping';
import { CircleCheck, MinusCircleIcon, XCircleIcon, XIcon } from 'lucide-react';
import { useStakeState } from '../_stores/stake-store-provider';
import { useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { chainIdToChainName } from '@/providers/constants';
import type { ChainId } from '@sodax/types';
import Image from 'next/image';
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
  const { selectedToken } = useStakeState();
  const { mutateAsync: cancelUnstake, isPending: isCancellingUnstake } = useCancelUnstake(spokeProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedToken?.xChainId || 'sonic');
  const [isSwitchChainDialogOpen, setIsSwitchChainDialogOpen] = useState<boolean>(false);
  const timeRemaining = useMemo((): string => {
    if (!stakingConfig) {
      return 'Loading...';
    }
    return getTimeRemaining(request.request.startTime, stakingConfig.unstakingPeriod);
  }, [request.request.startTime, stakingConfig]);

  const isReadyToClaim = useMemo((): boolean => {
    return request.penalty === 0n;
  }, [request.penalty]);

  const [nowSeconds, setNowSeconds] = useState((): number => Math.floor(Date.now() / 1000));
  useEffect((): (() => void) => {
    const interval = setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  const progressPercentage = useMemo((): number => {
    if (!stakingConfig || isReadyToClaim) {
      return isReadyToClaim ? 100 : 0;
    }
    const start = Number(request.request.startTime);
    const period = Number(stakingConfig.unstakingPeriod);
    const elapsed = nowSeconds - start;
    const progress = Math.min(100, Math.max(0, (elapsed / period) * 100));
    return progress;
  }, [request.request.startTime, stakingConfig, isReadyToClaim, nowSeconds]);

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

  const chainName = useMemo((): string => {
    return chainIdToChainName((selectedToken?.xChainId || 'sonic') as ChainId);
  }, [selectedToken]);

  const handleClaim = async (): Promise<void> => {
    if (!spokeProvider) {
      return;
    }

    if (isWrongChain) {
      setIsSwitchChainDialogOpen(true);
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

    if (isWrongChain) {
      setIsSwitchChainDialogOpen(true);
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

  const handleSwitchChainClick = (): void => {
    handleSwitchChain();
    setIsSwitchChainDialogOpen(false);
  };

  return (
    <div className="w-full inline-flex flex-col justify-start items-start gap-4">
      <div className="w-full flex flex-col justify-start items-start gap-1">
        <div className="inline-flex justify-start items-center gap-2">
          <div className="justify-center text-clay text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-5">
            {isReadyToClaim ? 'Unstake complete' : timeRemaining}
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

      <Dialog open={isSwitchChainDialogOpen} onOpenChange={setIsSwitchChainDialogOpen}>
        <DialogContent className="w-full md:!max-w-[480px] p-8 md:p-12 gap-6 bg-vibrant-white" hideCloseButton>
          <div className="inline-flex justify-start items-center gap-2 w-full">
            <Image src="/symbol_dark.png" alt="SODAX Symbol" width={16} height={16} className="mix-blend-multiply" />
            <DialogTitle className="mix-blend-multiply text-espresso font-['InterBold'] leading-snug text-(size:--body-super-comfortable) flex justify-between items-center w-full">
              Switch to {chainName} to claim
              <DialogClose asChild>
                <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
              </DialogClose>
            </DialogTitle>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-clay text-(length:--body-comfortable) font-normal font-['InterRegular'] leading-5">
              Your SODA is ready to claim on {chainName}.
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="cherry" onClick={handleSwitchChainClick}>
              Switch to {chainName}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
