'use client';

import type React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { XToken } from '@sodax/types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CurrencyLogo from '@/components/shared/currency-logo';
import { CircularProgressIcon } from '@/components/icons';
import type BigNumber from 'bignumber.js';
import { Timer, XIcon, Check, ChevronsRight, ShieldAlertIcon, ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';
import { shortenAddress } from '@/lib/utils';
import { Separator } from '@radix-ui/react-separator';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { chainIdToChainName } from '@/providers/constants';
import { useSwapApprove, useSpokeProvider, useSwapAllowance, useSwap, useStatus } from '@sodax/dapp-kit';
import { type CreateIntentParams, SolverIntentStatusCode } from '@sodax/sdk';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useSwapActions, useSwapState } from '../_stores/swap-store-provider';
import { parseUnits } from 'viem';
import type { SpokeChainId } from '@sodax/types';
import { getSwapErrorMessage, formatBalance } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface SwapStatusMonitorProps {
  dstTxHash: string;
  onSwapSuccessful: () => void;
  onSwapFailed: () => void;
  onUpdateSwapStatus: (statusCode: SolverIntentStatusCode) => void;
}

function SwapStatusMonitor({
  dstTxHash,
  onSwapSuccessful,
  onSwapFailed,
  onUpdateSwapStatus,
}: SwapStatusMonitorProps): React.JSX.Element | null {
  const { data: status } = useStatus(dstTxHash as `0x${string}`);
  const hasCalledSuccess = useRef<boolean>(false);
  const hasCalledFailed = useRef<boolean>(false);

  useEffect(() => {
    if (status?.ok && !hasCalledSuccess.current && !hasCalledFailed.current) {
      const statusCode = status.value.status;
      onUpdateSwapStatus(statusCode);
      if (statusCode === SolverIntentStatusCode.SOLVED) {
        hasCalledSuccess.current = true;
        onSwapSuccessful();
      } else if (statusCode === SolverIntentStatusCode.FAILED) {
        hasCalledFailed.current = true;
        onSwapFailed();
      }
    }
  }, [status, onSwapSuccessful, onSwapFailed, onUpdateSwapStatus]);

  return null;
}

interface SwapConfirmDialogProps {
  open: boolean;
  inputToken: XToken;
  outputToken: XToken;
  sourceAddress: string;
  finalDestinationAddress: string;
  outputAmount: string;
  onClose?: () => void;
  swapFeesUsdValue?: {
    partner: BigNumber;
    solver: BigNumber;
    total: BigNumber;
  };
  minOutputAmount?: BigNumber;
  usdPrice?: number;
}

const SwapConfirmDialog: React.FC<SwapConfirmDialogProps> = ({
  open,
  inputToken,
  outputToken,
  sourceAddress,
  finalDestinationAddress,
  outputAmount,
  onClose,
  minOutputAmount,
  swapFeesUsdValue,
  usdPrice = 0,
}: SwapConfirmDialogProps) => {
  const queryClient = useQueryClient();
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [allowanceConfirmed, setAllowanceConfirmed] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const walletProvider = useWalletProvider(inputToken.xChainId);
  const spokeProvider = useSpokeProvider(inputToken.xChainId, walletProvider);
  const sourceXAccount = useXAccount(inputToken.xChainId);
  const { inputAmount } = useSwapState();
  const sourceWalletProvider = useWalletProvider(inputToken.xChainId);
  const sourceSpokeProvider = useSpokeProvider(inputToken.xChainId, sourceWalletProvider);
  const [dstTxHash, setDstTxHash] = useState<string>('');
  const { mutateAsync: executeSwap, isPending: isSwapPending } = useSwap(sourceSpokeProvider);
  const { setInputAmount } = useSwapActions();
  // const [swapResetCounter, setSwapResetCounter] = useState<number>(0);
  const [isSwapSuccessful, setIsSwapSuccessful] = useState<boolean>(false);
  const [isSwapFailed, setIsSwapFailed] = useState<boolean>(false);
  const [swapError, setSwapError] = useState<{ title: string; message: string } | null>(null);
  const [swapStatus, setSwapStatus] = useState<SolverIntentStatusCode>(SolverIntentStatusCode.NOT_FOUND);
  const [frozenPayload, setFrozenPayload] = useState<CreateIntentParams | undefined>(undefined);

  useEffect(() => {
    if (open && !frozenPayload) {
      setFrozenPayload({
        inputToken: inputToken.address,
        outputToken: outputToken.address,
        inputAmount: parseUnits(inputAmount, inputToken.decimals),
        minOutputAmount: BigInt(Number(minOutputAmount?.toFixed(0))),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5),
        allowPartialFill: false,
        srcChain: inputToken.xChainId as SpokeChainId,
        dstChain: outputToken.xChainId as SpokeChainId,
        srcAddress: sourceAddress,
        dstAddress: finalDestinationAddress,
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      } satisfies CreateIntentParams);
    } else if (!open) {
      setFrozenPayload(undefined);
    }
  }, [
    open,
    frozenPayload,
    inputToken.address,
    inputToken.decimals,
    inputToken.xChainId,
    outputToken.address,
    outputToken.xChainId,
    inputAmount,
    minOutputAmount,
    sourceAddress,
    finalDestinationAddress,
  ]);

  const intentOrderPayload = frozenPayload;

  const isWaitingForSolvedStatus = useMemo(() => {
    return !!dstTxHash && !isSwapFailed;
  }, [dstTxHash, isSwapFailed]);

  const handleSwapSuccessful = useCallback(() => {
    setIsSwapSuccessful(true);
    setIsSwapFailed(false);
  }, []);

  const handleSwapFailed = useCallback(() => {
    setIsSwapFailed(true);
    setIsSwapSuccessful(false);
    setSwapError({ title: 'Swap failed', message: 'Please try again.' });
  }, []);

  const paramsForApprove = intentOrderPayload
    ? JSON.parse(
        JSON.stringify(intentOrderPayload, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
      )
    : undefined;

  const { data: hasAllowed, isLoading: isAllowanceLoading } = useSwapAllowance(
    allowanceConfirmed ? undefined : paramsForApprove,
    spokeProvider,
  );

  useEffect(() => {
    if (intentOrderPayload) {
      queryClient.invalidateQueries({ queryKey: ['allowance', paramsForApprove] });
    }
  }, [intentOrderPayload, queryClient, paramsForApprove]);

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

  const handleApprove = async (): Promise<void> => {
    if (!intentOrderPayload) {
      setApprovalError('Intent params not available for approval');
      return;
    }

    try {
      setApprovalError(null);
      const value = await approve({ params: intentOrderPayload });
      if (value) {
        setAllowanceConfirmed(true);
      } else {
        setApprovalError('Failed to approve tokens');
      }
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : 'Approval failed. Please try again.');
    }
  };

  const handleClose = (): void => {
    setSwapError(null);
    if (isSwapSuccessful) {
      onClose?.();
      setAllowanceConfirmed(false);
      setSwapStatus(SolverIntentStatusCode.NOT_FOUND);
      setDstTxHash('');
      setIsSwapSuccessful(false);
      setInputAmount('0');
      return;
    }

    if (isWaitingForSolvedStatus || isSwapPending) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    onClose?.();
    setIsShaking(false);
  };

  const handleSwapConfirm = async (): Promise<void> => {
    if (!intentOrderPayload) {
      setSwapError({ title: 'Swap Error', message: 'Intent params not available' });
      return;
    }

    const result = await executeSwap(intentOrderPayload);

    if (!result.ok) {
      const errorMessage = getSwapErrorMessage(result.error?.code || 'UNKNOWN');
      setSwapError(errorMessage);
      setDstTxHash('');
      return;
    }

    const [, , intentDeliveryInfo] = result.value;
    setDstTxHash(intentDeliveryInfo.dstTxHash);
    setSwapStatus(SolverIntentStatusCode.NOT_STARTED_YET);
  };

  return (
    <>
      {dstTxHash && (
        <SwapStatusMonitor
          dstTxHash={dstTxHash}
          onSwapSuccessful={handleSwapSuccessful}
          onSwapFailed={handleSwapFailed}
          onUpdateSwapStatus={setSwapStatus}
        />
      )}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          enableMotion={true}
          shake={isShaking}
          className="shadow-none md:max-w-[480px] w-[90%] p-12 bg-vibrant-white"
          hideCloseButton={true}
        >
          <DialogTitle className="flex w-full justify-end h-4 relative p-0 mb-4">
            <XIcon
              className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay absolute top-0 "
              onClick={handleClose}
            />
          </DialogTitle>
          {(swapError || approvalError) && (
            <div className="w-full flex-col flex gap-1 mb-4">
              <div className="flex justify-center gap-1 w-full items-center">
                <ShieldAlertIcon className="w-4 h-4 text-negative" />
                <span className="font-['InterBold'] text-(length:--body-comfortable) leading-[1.4] text-negative">
                  {swapError ? swapError.title : 'Approval Failed'}
                </span>
              </div>
              <div className="text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] text-center">
                {swapError ? swapError.message : approvalError}
              </div>
            </div>
          )}
          <div className={`flex w-full justify-center ${swapError ? 'opacity-40' : ''}`}>
            <div className="w-60 pb-6 inline-flex justify-between items-center">
              <div className="w-10 inline-flex flex-col justify-start items-center gap-2">
                <div className={`${isSwapSuccessful ? 'grayscale opacity-50' : ''}`}>
                  <CurrencyLogo currency={inputToken} />
                </div>
                <div className="flex flex-col justify-start items-center gap-2">
                  <div className="inline-flex justify-start items-center gap-1">
                    <div className="justify-start text-espresso text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-tight">
                      {inputAmount}
                    </div>
                    <div className="justify-start text-clay-light text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-tight">
                      {inputToken.symbol}
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
                      on {chainIdToChainName(inputToken.xChainId)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-16 h-9 inline-flex flex-col justify-between items-center">
                {isSwapSuccessful ? (
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
                <CurrencyLogo currency={outputToken} />
                <div className="flex flex-col justify-start items-center gap-2">
                  <div className="inline-flex justify-start items-center gap-1">
                    <div className="justify-start text-espresso text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-tight">
                      {formatBalance(outputAmount, usdPrice)}
                    </div>
                    <div className="justify-start text-clay-light text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-tight">
                      {outputToken.symbol}
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
                      on {chainIdToChainName(outputToken.xChainId)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full">
            {isSwapSuccessful ? (
              <div className="flex w-full flex-col gap-4">
                <Button
                  variant="cherry"
                  className="w-full text-white font-semibold font-['InterRegular']"
                  onClick={() => {
                    handleClose();
                  }}
                >
                  <div className="flex items-center gap-2 text-white">
                    <span>Swap complete</span>
                    <Check className="w-4 h-4" />
                  </div>
                </Button>

                <div className="text-clay-light text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight text-center flex justify-center gap-1 items-center">
                  Enjoying SODAX?
                  <Link
                    href="https://x.com/gosodax"
                    target="_blank"
                    className="flex gap-1 hover:font-bold text-clay items-center leading-[1.4]"
                  >
                    Follow updates on X <ExternalLinkIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : swapError ? (
              <div className="flex w-full flex-col gap-4">
                <Button
                  variant="cherry"
                  className="w-full text-white font-semibold font-['InterRegular']"
                  onClick={handleClose}
                >
                  Close
                </Button>

                <div className="text-clay-light text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight text-center flex justify-center gap-1 items-center">
                  Need help?
                  <Link
                    href="https://discord.gg/xM2Nh4S6vN"
                    target="_blank"
                    className="flex gap-1 hover:font-bold text-clay items-center leading-[1.4]"
                  >
                    Get support on Discord <ExternalLinkIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-4">
                {!allowanceConfirmed && !hasAllowed && !isAllowanceLoading && (
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
                        `Approve ${inputToken.symbol}`
                      )}
                    </Button>
                  </div>
                )}

                {(allowanceConfirmed || hasAllowed) && (
                  <Button
                    variant="cherry"
                    className="w-full text-white font-semibold font-['InterRegular'] disabled:bg-cherry-bright"
                    disabled={isWaitingForSolvedStatus || isSwapPending}
                    onClick={handleSwapConfirm}
                  >
                    {isWaitingForSolvedStatus || isSwapPending ? (
                      <div className="flex items-center gap-2 text-white">
                        <span>
                          {isSwapPending
                            ? 'Confirming Swap'
                            : swapStatus === SolverIntentStatusCode.NOT_STARTED_YET
                              ? 'Swap Created'
                              : swapStatus === SolverIntentStatusCode.STARTED_NOT_FINISHED
                                ? 'Swap in Progress'
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
                      `Swap to ${outputToken.symbol} on ${chainIdToChainName(outputToken.xChainId)}`
                    )}
                  </Button>
                )}

                {isAllowanceLoading && (
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
                              {formatBalance(minOutputAmount?.toString() || '0', usdPrice)} {outputToken.symbol}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-clay-light">Swap Fee (0.20%)</span>
                            <span className="text-espresso font-medium">
                              {swapFeesUsdValue?.total && `$${swapFeesUsdValue?.total.toFixed(4)}`}
                            </span>
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SwapConfirmDialog;
