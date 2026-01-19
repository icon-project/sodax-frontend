'use client';

import type React from 'react';
import { useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CircularProgressIcon } from '@/components/icons';
import { Check } from 'lucide-react';
import { SolverIntentStatusCode, type CreateIntentParams } from '@sodax/sdk';
import { chainIdToChainName } from '@/providers/constants';
import { useSwapState, useSwapActions } from '../_stores/swap-store-provider';
import { useSwapAllowance } from '@sodax/dapp-kit';
import type { SpokeProvider } from '@sodax/sdk';

interface SwapButtonProps {
  intentOrderPayload: CreateIntentParams | undefined;
  spokeProvider: SpokeProvider | undefined;
  isSwapPending: boolean;
  onClose: () => void;
  onApprove: () => void | Promise<void>;
  onSwapConfirm: () => void | Promise<void>;
  isApproving: boolean;
  targetChainSolved: boolean;
}

const SwapButton: React.FC<SwapButtonProps> = ({
  intentOrderPayload,
  spokeProvider,
  isSwapPending,
  onClose,
  onApprove,
  onSwapConfirm,
  isApproving,
  targetChainSolved,
}: SwapButtonProps): React.JSX.Element => {
  const { inputToken, outputToken, swapError, allowanceConfirmed, swapStatus, dstTxHash } = useSwapState();
  const { setAllowanceConfirmed } = useSwapActions();

  const isWaitingForSolvedStatus = useMemo(() => {
    return !!dstTxHash && !swapError;
  }, [dstTxHash, swapError]);

  const paramsForApprove = useMemo(() => {
    if (!intentOrderPayload || allowanceConfirmed) {
      return undefined;
    }
    return JSON.parse(
      JSON.stringify(intentOrderPayload, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    );
  }, [intentOrderPayload, allowanceConfirmed]);

  // Use hooks directly
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useSwapAllowance(paramsForApprove, spokeProvider);

  /* If failed previous swap by JSON rpc error, allowance is still valid.
  but after started next swap progress, allowance will become false.
  To avoid confusion of swaping progress, have to set allowanceConfirmed to true.
  */
  useEffect(() => {
    if (hasAllowed) {
      setAllowanceConfirmed(true);
    }
  }, [hasAllowed, setAllowanceConfirmed]);

  if (targetChainSolved) {
    return (
      <div className="flex w-full flex-col gap-4">
        <Button variant="cherry" className="w-full text-white font-semibold font-['InterRegular']" onClick={onClose}>
          <div className="flex items-center gap-2 text-white">
            <span>Swap complete</span>
            <Check className="w-4 h-4" />
          </div>
        </Button>
      </div>
    );
  }

  if (swapError) {
    return (
      <div className="flex w-full flex-col gap-4">
        <Button variant="cherry" className="w-full text-white font-semibold font-['InterRegular']" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  const showApproveButton = !allowanceConfirmed && !hasAllowed && !isAllowanceLoading;
  const showSwapButton = allowanceConfirmed || hasAllowed;

  return (
    <div className="flex w-full flex-col gap-4">
      {showApproveButton && (
        <Button
          variant="cherry"
          className="w-full text-white font-semibold font-['InterRegular']"
          onClick={onApprove}
          disabled={isApproving}
        >
          {isApproving ? (
            <div className="flex items-center gap-2 text-white">
              <span>Approving...</span>
              <CircularProgressIcon width={16} height={16} stroke="white" progress={100} className="animate-spin" />
            </div>
          ) : (
            `Approve ${inputToken.symbol}`
          )}
        </Button>
      )}

      {showSwapButton && (
        <Button
          variant="cherry"
          className="w-full text-white font-semibold font-['InterRegular'] disabled:bg-cherry-bright"
          disabled={isWaitingForSolvedStatus || isSwapPending}
          onClick={onSwapConfirm}
        >
          {isWaitingForSolvedStatus || isSwapPending ? (
            <div className="flex items-center gap-2 text-white">
              <span>
                {isSwapPending
                  ? 'Confirming Swap'
                  : swapStatus === SolverIntentStatusCode.NOT_STARTED_YET
                    ? 'Swap Created'
                    : 'Swap in Progress'}
              </span>
              <CircularProgressIcon width={16} height={16} stroke="white" progress={100} className="animate-spin" />
            </div>
          ) : (
            `Swap to ${outputToken.symbol} on ${chainIdToChainName(outputToken.xChainId)}`
          )}
        </Button>
      )}

      {isAllowanceLoading && (
        <Button variant="cherry" className="w-full text-white font-semibold font-['InterRegular']" disabled={true}>
          Checking approval...
        </Button>
      )}
    </div>
  );
};

export default SwapButton;
