'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DISCORD_ROUTE } from '@/constants/routes';
import { createWithdrawParamsProps, useDexWithdraw } from '@sodax/dapp-kit';
import type { PoolData, PoolSpokeAssets, SpokeProvider } from '@sodax/sdk';
import type { SpokeChainId } from '@sodax/types';
import { chainIdToChainName } from '@/providers/constants';
import { formatUnits, parseUnits } from 'viem';
import { Check, X } from 'lucide-react';
import { CircularProgressIcon } from '@/components/icons/circular-progress-icon';
import { ErrorDialog } from '@/components/shared/error-dialog';
import { SwitchChainDialog } from '@/components/shared/switch-chain-dialog';

type RecoveryDialogProps = {
  selectedChainId: SpokeChainId | null;
  isWalletConnected: boolean;
  isWrongChain: boolean;
  onSwitchChain: () => void;
  spokeProvider: SpokeProvider | null;
  poolData: PoolData | null;
  poolSpokeAssets: PoolSpokeAssets | null;
  waLocSodaBalance: bigint;
};

export function RecoveryDialog({
  selectedChainId,
  isWalletConnected,
  isWrongChain,
  onSwitchChain,
  spokeProvider,
  poolData,
  poolSpokeAssets,
  waLocSodaBalance,
}: RecoveryDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  // Guards against the modal reopening after a successful recovery due to stale balance data.
  // When the user completes a claim, we set this to `true` so the auto-open effect won't
  // re-trigger while React Query still reports the old (non-zero) balance.
  // It resets to `false` once the balance query catches up and `hasWithdrawableWaLocSoda` becomes false.
  const [hasCompletedRecovery, setHasCompletedRecovery] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [isSwitchChainDialogOpen, setIsSwitchChainDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const withdrawMutation = useDexWithdraw();

  const waLocSodaDecimals = poolData?.token0.decimals ?? 18;
  const waLocSodaMinBalance = parseUnits('1', waLocSodaDecimals);
  const waLocSodaReserveBalance = parseUnits('0.001', waLocSodaDecimals);
  const hasWithdrawableWaLocSoda = isWalletConnected && waLocSodaBalance > waLocSodaMinBalance;
  const waLocSodaWithdrawAmount =
    waLocSodaBalance > waLocSodaReserveBalance ? waLocSodaBalance - waLocSodaReserveBalance : 0n;

  const triggerShake = (): void => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Mirrors the swap dialog pattern: only allow actual dismissal after success, otherwise shake.
  const handleClose = (): void => {
    if (withdrawMutation.isSuccess) {
      // Mark recovery as done BEFORE closing + resetting, so the auto-open effect
      // won't see "modal closed + balance still there" and reopen it.
      setHasCompletedRecovery(true);
      setIsOpen(false);
      withdrawMutation.reset();
      return;
    }
    // Not yet recovered — shake to signal the user can't dismiss.
    triggerShake();
  };

  const handleWithdraw = async (): Promise<void> => {
    if (selectedChainId !== null && isWrongChain) {
      setIsSwitchChainDialogOpen(true);
      return;
    }
    if (!spokeProvider || !poolData || !poolSpokeAssets) {
      setErrorMessage('Withdraw is unavailable. Please ensure wallet and pool data are loaded.');
      setIsErrorDialogOpen(true);
      return;
    }
    if (waLocSodaWithdrawAmount <= 0n) {
      return;
    }
    try {
      await withdrawMutation.mutateAsync({
        params: createWithdrawParamsProps({
          tokenIndex: 0,
          amount: formatUnits(waLocSodaWithdrawAmount, waLocSodaDecimals),
          poolData,
          poolSpokeAssets,
        }),
        spokeProvider,
      });
    } catch (withdrawError) {
      const message = withdrawError instanceof Error ? withdrawError.message : 'Failed to withdraw waLocSODA.';
      setErrorMessage(message);
      setIsErrorDialogOpen(true);
    }
  };

  // Reset the "completed" guard when the balance actually drains.
  // After a successful recovery, the React Query balance will eventually refetch and show 0.
  // Once that happens, we clear the guard so a *future* stranding event can reopen the modal.
  useEffect((): void => {
    if (!hasWithdrawableWaLocSoda) {
      setHasCompletedRecovery(false);
    }
  }, [hasWithdrawableWaLocSoda]);

  // Auto-open the modal when stranded SODA is detected.
  // This is what makes the modal appear on page load / reload if funds are stranded.
  // The `hasCompletedRecovery` guard prevents the race condition:
  //   1. User claims successfully → handleClose sets hasCompletedRecovery=true, closes modal
  //   2. withdrawMutation.reset() clears isSuccess immediately
  //   3. Balance query is still stale (hasWithdrawableWaLocSoda === true)
  //   4. Without the guard, this effect would see "stranded SODA + modal closed" → reopen!
  //   5. With the guard, we skip the reopen. Once balance refetches, guard resets.
  useEffect((): void => {
    if (hasWithdrawableWaLocSoda && !hasCompletedRecovery) {
      setIsOpen(true);
    }
  }, [hasWithdrawableWaLocSoda, hasCompletedRecovery]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="w-[92vw] max-w-[480px] min-h-[317px] bg-vibrant-white px-8 py-10 rounded-[32px] gap-0"
          hideCloseButton
          enableMotion={true}
          shake={isShaking}
          onInteractOutside={e => {
            e.preventDefault();
            handleClose();
          }}
          onEscapeKeyDown={e => {
            e.preventDefault();
            handleClose();
          }}
        >
          <div className="flex flex-col gap-6 px-4">
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center text-cherry-grey/70 hover:text-cherry-grey focus-visible:outline-hidden"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Image
                className="w-4 h-4 -translate-y-px"
                src="/partners/sodax-symbol.svg"
                alt="SODAX"
                width={16}
                height={16}
              />
              <DialogTitle className="mix-blend-multiply text-espresso font-['InterBold'] text-base leading-[1.4]">
                {withdrawMutation.isSuccess ? 'Recovery complete' : 'Your SODA needs a quick recovery'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-clay text-sm leading-[1.4]">
              {withdrawMutation.isSuccess
                ? 'Your SODA has been successfully recovered.'
                : 'Part of your SODA didn\u2019t complete transfer. You can safely recover it now in one step.'}
            </DialogDescription>
            {withdrawMutation.isSuccess ? (
              <Button
                variant="cherry"
                onClick={handleClose}
                className="h-10 w-full rounded-[240px] text-sm font-['InterMedium']"
              >
                <div className="flex items-center gap-2 text-white">
                  <span>Recovery complete</span>
                  <Check className="w-4 h-4" />
                </div>
              </Button>
            ) : withdrawMutation.isPending ? (
              <div className="flex h-10 w-full items-center justify-center gap-2 rounded-[240px] bg-cherry-bright text-white text-sm font-['InterMedium']">
                <span>Recovering</span>
                <CircularProgressIcon width={16} height={16} stroke="white" progress={100} className="animate-spin" />
              </div>
            ) : isWrongChain ? (
              <Button
                variant="cherry"
                onClick={onSwitchChain}
                className="h-10 w-full rounded-[240px] text-sm font-['InterMedium']"
              >
                {`Switch to ${selectedChainId ? chainIdToChainName(selectedChainId) : 'the correct network'}`}
              </Button>
            ) : (
              <Button
                variant="cherry"
                onClick={handleWithdraw}
                className="h-10 w-full rounded-[240px] text-sm font-['InterMedium']"
              >
                Recover now
              </Button>
            )}
            <div className="h-[2px] w-full bg-cherry-grey opacity-30" />
            <div className="text-sm text-espresso">
              Need help?{' '}
              <Link
                href={DISCORD_ROUTE}
                target="_blank"
                rel="noreferrer"
                className="font-['InterBold'] text-espresso underline underline-offset-4 hover:opacity-80"
              >
                Get support here
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ErrorDialog
        open={isErrorDialogOpen}
        onOpenChange={setIsErrorDialogOpen}
        errorMessage={errorMessage}
        title="Your wallet needs a small reserve"
      />
      <SwitchChainDialog
        open={isSwitchChainDialogOpen}
        onOpenChange={setIsSwitchChainDialogOpen}
        chainName={selectedChainId ? chainIdToChainName(selectedChainId) : 'the selected network'}
        onSwitchChain={onSwitchChain}
        description="Please switch to the selected network to withdraw waLocSODA."
        titleAction="withdraw waLocSODA"
      />
    </>
  );
}
