'use client';

import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import CurrencyLogo from '@/components/shared/currency-logo';
import type BigNumber from 'bignumber.js';
import { Timer, XIcon, ChevronsRight, ShieldAlertIcon, ExternalLinkIcon } from 'lucide-react';
import SwapButton from './swap-button';
import { shortenAddress } from '@/lib/utils';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { chainIdToChainName } from '@/providers/constants';
import { useSwapApprove, useSpokeProvider, useSwap, useStatus } from '@sodax/dapp-kit';
import { type CreateIntentParams, SolverIntentStatusCode } from '@sodax/sdk';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useSwapActions, useSwapState } from '../_stores/swap-store-provider';
import { formatUnits, parseUnits } from 'viem';
import type { SpokeChainId } from '@sodax/types';
import { getSwapErrorMessage, formatBalance } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

interface SwapConfirmDialogProps {
  open: boolean;
  outputAmount: bigint | undefined;
  onClose?: () => void;
  swapFeesUsdValue?: {
    partner: BigNumber;
    solver: BigNumber;
    total: BigNumber;
  };
  minOutputAmount: bigint | undefined;
  usdPrice?: number;
}

const SwapConfirmDialog: React.FC<SwapConfirmDialogProps> = ({
  open,
  outputAmount,
  onClose,
  minOutputAmount,
  swapFeesUsdValue,
  usdPrice = 0,
}: SwapConfirmDialogProps) => {
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const {
    inputToken,
    outputToken,
    inputAmount,
    isSwapAndSend,
    customDestinationAddress,
    dstTxHash,
    swapError,
    swapStatus,
  } = useSwapState();
  const {
    setInputAmount,
    setDstTxHash,
    setSwapError,
    setSwapStatus,
    setAllowanceConfirmed,
    resetSwapExecutionState,
  } = useSwapActions();
  const { address: sourceAddress } = useXAccount(inputToken.xChainId);
  const { address: destinationAddress } = useXAccount(outputToken.xChainId);
  const finalDestinationAddress = isSwapAndSend ? customDestinationAddress : destinationAddress || '';
  const sourceWalletProvider = useWalletProvider(inputToken.xChainId);
  const sourceSpokeProvider = useSpokeProvider(inputToken.xChainId, sourceWalletProvider);
  const sourceXAccount = useXAccount(inputToken.xChainId);
  const { mutateAsync: executeSwap, isPending: isSwapPending } = useSwap(sourceSpokeProvider);

  const intentOrderPayload = useMemo(() => {
    if (!inputToken || !outputToken || !minOutputAmount || !inputAmount || !sourceAddress || !finalDestinationAddress) {
      return undefined;
    }

    return {
      inputToken: inputToken.address,
      outputToken: outputToken.address,
      inputAmount: parseUnits(inputAmount, inputToken.decimals),
      minOutputAmount: minOutputAmount,
      deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5),
      allowPartialFill: false,
      srcChain: inputToken.xChainId as SpokeChainId,
      dstChain: outputToken.xChainId as SpokeChainId,
      srcAddress: sourceAddress,
      dstAddress: finalDestinationAddress,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    } satisfies CreateIntentParams;
  }, [inputToken, outputToken, minOutputAmount, inputAmount, sourceAddress, finalDestinationAddress]);

  const { approve, isLoading: isApproving } = useSwapApprove(intentOrderPayload, sourceSpokeProvider);
  const { data: status } = useStatus((dstTxHash || '0x') as `0x${string}`);

  useEffect(() => {
    if (dstTxHash && status?.ok) {
      const statusCode = status.value.status;
      setSwapStatus(statusCode);
      if(statusCode === SolverIntentStatusCode.FAILED) {
        setSwapError({ title: 'Swap failed', message: 'Please try again.' });
      }
    }
  }, [dstTxHash, status, setSwapStatus]);

  const handleApprove = async (): Promise<void> => {
    try {
      const value = await approve({ params: intentOrderPayload as CreateIntentParams });
      if (value) {
        setAllowanceConfirmed(true);
      } else {
        setApprovalError('Failed to approve tokens.');
      }
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : 'Approval failed. Please try again.');
    }
  };

  const handleClose = (): void => {
    const isWaitingForSolvedStatus = !!dstTxHash && !swapError;
    if (isWaitingForSolvedStatus || isSwapPending) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    
    if (swapStatus === SolverIntentStatusCode.SOLVED) {
      setInputAmount('');
    }

    setIsShaking(false);
    setApprovalError(null);
    resetSwapExecutionState();
    onClose?.();
  };

  const handleSwapConfirm = async (): Promise<void> => {
    const result = await executeSwap(intentOrderPayload as CreateIntentParams);

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
                <div className={`${swapStatus === SolverIntentStatusCode.SOLVED ? 'grayscale opacity-50' : ''}`}>
                  <CurrencyLogo currency={inputToken} />
                </div>
                <div className="flex flex-col justify-start items-center gap-2">
                  <div className="inline-flex justify-start items-center gap-1">
                    <div className="justify-start text-espresso text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-tight">
                      {formatBalance(inputAmount, usdPrice)}
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
                {swapStatus === SolverIntentStatusCode.SOLVED ? (
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
                      {formatBalance(outputAmount ? formatUnits(outputAmount, outputToken.decimals) : '0', usdPrice)}
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

          <SwapButton
            intentOrderPayload={intentOrderPayload}
            spokeProvider={sourceSpokeProvider}
            isSwapPending={isSwapPending}
            onClose={handleClose}
            onApprove={handleApprove}
            onSwapConfirm={handleSwapConfirm}
            isApproving={isApproving}
          />

          {swapStatus === SolverIntentStatusCode.SOLVED ? (
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
          ) : swapError ? (
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
          ) : (
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
                          {formatBalance(
                            minOutputAmount ? formatUnits(minOutputAmount, outputToken.decimals) : '0',
                            usdPrice,
                          )}{' '}
                          {outputToken.symbol}
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SwapConfirmDialog;
