'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import type { XToken } from '@sodax/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CurrencyLogo from '@/components/shared/currency-logo';
import { CircularProgressIcon } from '@/components/icons';
import type BigNumber from 'bignumber.js';
import { Timer, XIcon, Check, ChevronsRight, ChevronDown, ChevronUp } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';
import { Separator } from '@radix-ui/react-separator';
import { useEvmSwitchChain, useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { chainIdToChainName } from '@/providers/constants';
import { useSwapApprove, useSpokeProvider, useSwapAllowance } from '@sodax/dapp-kit';
import { type CreateIntentParams, SolverIntentStatusCode } from '@sodax/sdk';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SwapConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceToken: XToken;
  destinationToken: XToken;
  finalDestinationAddress: string;
  sourceAmount: string;
  destinationAmount: string;
  exchangeRate: BigNumber | null;
  onConfirm: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  slippageTolerance?: number;
  error?: string;
  isSwapSuccessful?: boolean;
  swapFeesUsdValue?: {
    partner: BigNumber;
    solver: BigNumber;
    total: BigNumber;
  };
  minOutputAmount?: BigNumber;
  intentOrderPayload?: CreateIntentParams;
  swapStatus?: SolverIntentStatusCode;
}

const SwapConfirmDialog: React.FC<SwapConfirmDialogProps> = ({
  open,
  onOpenChange,
  sourceToken,
  destinationToken,
  finalDestinationAddress,
  sourceAmount,
  destinationAmount,
  exchangeRate,
  onConfirm,
  onClose,
  isLoading = false,
  slippageTolerance = 0.5,
  minOutputAmount,
  error,
  isSwapSuccessful = false,
  swapFeesUsdValue,
  intentOrderPayload,
  swapStatus,
}: SwapConfirmDialogProps) => {
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [allowanceConfirmed, setAllowanceConfirmed] = useState<boolean>(false);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceToken.xChainId);

  const walletProvider = useWalletProvider(sourceToken.xChainId);
  const spokeProvider = useSpokeProvider(sourceToken.xChainId, walletProvider);

  const sourceXAccount = useXAccount(sourceToken.xChainId);

  const paramsForApprove = intentOrderPayload
    ? JSON.parse(
        JSON.stringify(intentOrderPayload, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
      )
    : undefined;

  const { data: hasAllowed, isLoading: isAllowanceLoading } = useSwapAllowance(
    allowanceConfirmed ? undefined : paramsForApprove,
    spokeProvider,
  );

  console.log(intentOrderPayload);
  console.log(paramsForApprove);
  console.log('spokeProvider', spokeProvider);
  console.log('hasAllowed', hasAllowed);

  /* If failed previous swap by JSON rpc error, allowance is still valid. 
  but after started next swap progress, allowance will become false. 
  To avoid confusion of swaping progress, have to set allowanceConfirmed to true.
  */
  useEffect(() => {
    if (hasAllowed) setAllowanceConfirmed(true);
  }, [hasAllowed]);

  useEffect(() => {
    if (open) {
      setAllowanceConfirmed(false);
      setApprovalError(null);
    }
  }, [open]);

  const { approve, isLoading: isApproving } = useSwapApprove(intentOrderPayload, spokeProvider);

  useEffect(() => {
    if (isSwapSuccessful) {
      setIsCompleted(true);
    }
  }, [isSwapSuccessful]);

  const formatToSixDecimals = (value: string): string => {
    const num = Number.parseFloat(value);
    if (Number.isNaN(num)) return value;
    return num.toFixed(4);
  };

  const handleApprove = async (): Promise<void> => {
    if (!intentOrderPayload) {
      console.error('Intent params not available for approval');
      setApprovalError('Intent params not available for approval');
      return;
    }

    try {
      setApprovalError(null);
      const value = await approve({ params: intentOrderPayload });
      if (value) {
        setAllowanceConfirmed(true);
      }
    } catch (error) {
      console.error('Approval failed:', error);
      setApprovalError(error instanceof Error ? error.message : 'Approval failed. Please try again.');
    }
  };

  const handleConfirm = async (): Promise<void> => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Unexpected error during swap confirmation:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = (): void => {
    if (isCompleted) {
      setIsCompleted(false);
      onOpenChange(false);
      onClose?.();
    } else {
      onOpenChange(false);
      onClose?.();
    }
  };

  const handleDialogOpenChange = (open: boolean): void => {
    if (!open) {
      handleClose();
    } else {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isCompleted || isConfirming ? undefined : handleDialogOpenChange}>
      <DialogContent className="md:max-w-[480px] p-12 w-[90%] shadow-none bg-vibrant-white gap-4" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex w-full justify-end">
            {!isCompleted && (
              <DialogClose asChild>
                <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
              </DialogClose>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex w-full justify-center">
          <div className="w-60 pb-6 inline-flex justify-between items-center">
            <div className="w-10 inline-flex flex-col justify-start items-center gap-2">
              <div className={`${isCompleted ? 'grayscale opacity-50' : ''}`}>
                <CurrencyLogo currency={sourceToken} />
              </div>
              <div className="flex flex-col justify-start items-center gap-2">
                <div className="inline-flex justify-start items-center gap-1">
                  <div className="justify-start text-espresso text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-tight">
                    {sourceAmount}
                  </div>
                  <div className="justify-start text-clay-light text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-tight">
                    {sourceToken.symbol}
                  </div>
                </div>
                <div className="flex flex-col justify-start items-center">
                  <div
                    data-property-1="Default"
                    className="h-4 px-2 mix-blend-multiply bg-cream-white rounded-[256px] flex flex-col justify-center items-center gap-2"
                  >
                    <div className="text-center justify-center text-clay text-[9px] font-medium font-['InterRegular'] uppercase">
                      {sourceXAccount?.address ? shortenAddress(sourceXAccount?.address) : 'Not connected'}
                    </div>
                  </div>
                  <div className="justify-start text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4]">
                    on {chainIdToChainName(sourceToken.xChainId)}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-16 h-9 inline-flex flex-col justify-between items-center">
              {isCompleted ? (
                <>
                  <ChevronsRight className="w-4 h-4 text-clay-light" />
                  <div className="justify-start text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-none">
                    Done
                  </div>
                </>
              ) : (
                <>
                  <Timer className="w-4 h-4 text-clay" />
                  <div className="justify-start text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-none">
                    ~30s
                  </div>
                </>
              )}
            </div>
            <div className="w-10 inline-flex flex-col justify-start items-center gap-2">
              <CurrencyLogo currency={destinationToken} />
              <div className="flex flex-col justify-start items-center gap-2">
                <div className="inline-flex justify-start items-center gap-1">
                  <div className="justify-start text-espresso text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-tight">
                    {formatToSixDecimals(destinationAmount)}
                  </div>
                  <div className="justify-start text-clay-light text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-tight">
                    {destinationToken.symbol}
                  </div>
                </div>
                <div className="flex flex-col justify-start items-center">
                  <div
                    data-property-1="Default"
                    className="h-4 px-2 mix-blend-multiply bg-cream-white rounded-[256px] flex flex-col justify-center items-center gap-2"
                  >
                    <div className="text-center justify-center text-clay text-[9px] font-medium font-['InterRegular'] uppercase">
                      {finalDestinationAddress ? shortenAddress(finalDestinationAddress) : 'Not connected'}
                    </div>
                  </div>
                  <div className="justify-start text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4]">
                    on {chainIdToChainName(destinationToken.xChainId)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex w-full">
          {isCompleted ? (
            <div className="flex w-full flex-col gap-4">
              <Button
                variant="cherry"
                className="w-full text-white font-semibold font-['InterRegular']"
                onClick={handleClose}
              >
                <div className="flex items-center gap-2 text-white">
                  <span>Swap complete</span>
                  <Check className="w-4 h-4" />
                </div>
              </Button>

              <div className="text-clay-light text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight text-center">
                Enjoying SODAX? Follow updates on X
              </div>
            </div>
          ) : error ? (
            <div className="flex w-full flex-col gap-4">
              <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <XIcon className="w-4 h-4" />
                  <span className="font-semibold">Swap Failed</span>
                </div>
                <div className="text-red-700 text-sm">{error}</div>
              </div>
              <Button
                variant="cherry"
                className="w-full text-white font-semibold font-['InterRegular']"
                onClick={handleClose}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-4">
              {isWrongChain && (
                <Button
                  variant="cherry"
                  className="w-full text-white font-semibold font-['InterRegular']"
                  onClick={handleSwitchChain}
                >
                  Switch to {chainIdToChainName(sourceToken.xChainId)}
                </Button>
              )}

              {!isWrongChain && !allowanceConfirmed && !hasAllowed && !isAllowanceLoading && (
                <div className="w-full">
                  <Button
                    variant="cherry"
                    className="w-full text-white font-semibold font-['InterRegular']"
                    onClick={handleApprove}
                    disabled={isApproving}
                  >
                    {isApproving ? (
                      <div className="flex items-center gap-2 text-white">
                        <span>Approving...</span>
                        <CircularProgressIcon
                          width={16}
                          height={16}
                          stroke="white"
                          progress={100}
                          className="animate-spin"
                        />
                      </div>
                    ) : (
                      `Approve ${sourceToken.symbol}`
                    )}
                  </Button>

                  {approvalError && (
                    <div className="w-full mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <XIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Approval Failed</span>
                      </div>
                      <div className="text-red-700 text-xs mt-1">{approvalError}</div>
                    </div>
                  )}
                </div>
              )}

              {!isWrongChain && (allowanceConfirmed || hasAllowed) && (
                <Button
                  variant="cherry"
                  className="w-full text-white font-semibold font-['InterRegular']"
                  onClick={isLoading || isConfirming ? undefined : handleConfirm}
                >
                  {isLoading || isConfirming ? (
                    <div className="flex items-center gap-2 text-white">
                      <span>
                        {swapStatus === SolverIntentStatusCode.NOT_FOUND
                          ? 'Confirming Swap'
                          : swapStatus === SolverIntentStatusCode.NOT_STARTED_YET
                            ? 'Swap Created'
                            : swapStatus === SolverIntentStatusCode.STARTED_NOT_FINISHED
                              ? 'Swap in Progress'
                              : swapStatus === SolverIntentStatusCode.SOLVED
                                ? 'Transferring Assets'
                                : 'Confirming Swap'}
                      </span>
                      <CircularProgressIcon
                        width={16}
                        height={16}
                        stroke="white"
                        progress={100}
                        className="animate-spin"
                      />
                    </div>
                  ) : (
                    `Swap ${destinationToken.symbol} on ${chainIdToChainName(destinationToken.xChainId)}`
                  )}
                </Button>
              )}

              {!isWrongChain && isAllowanceLoading && (
                <Button
                  variant="cherry"
                  className="w-full text-white font-semibold font-['InterRegular']"
                  disabled={true}
                >
                  Checking approval...
                </Button>
              )}

              <Accordion type="single" collapsible className="p-0 swap-accordion">
                <AccordionItem value="item-1" className="!p-0">
                  <AccordionTrigger className="hover:no-underline !p-0 justify-center">
                    <div className="text-clay-light text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight">
                      Total fees: {swapFeesUsdValue?.total && ` $${swapFeesUsdValue?.total.toFixed(4)}`}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-transparent border-none">
                      <Separator className="bg-clay-light h-[1px] mt-4 mb-4 opacity-30" />
                      <div className="space-y-2 text-(length:--body-comfortable)">
                        <div className="flex justify-between">
                          <span className="text-clay-light">Receive at least</span>
                          <span className="text-espresso font-medium">
                            {formatToSixDecimals(minOutputAmount?.toString() || '0')} {destinationToken.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-clay-light">Swap Fee (0.20%)</span>
                          <span className="text-espresso font-medium">
                            {swapFeesUsdValue?.total && `$${swapFeesUsdValue?.total.toFixed(4)}`}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-clay-light">Network cost</span>
                          <span className="text-espresso font-medium">&lt; $0.01</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-clay-light">Max slippage</span>
                          <span className="text-espresso font-medium">{slippageTolerance}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-clay-light">Via</span>
                          <span className="text-espresso font-medium">SODAX SDK</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SwapConfirmDialog;
