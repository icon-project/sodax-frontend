'use client';

import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import type { XToken, ChainId } from '@sodax/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CurrencyLogo from '@/components/shared/currency-logo';
import { SwitchDirectionIcon, CircularProgressIcon } from '@/components/icons';
import { formatUnits } from 'viem';
import type BigNumber from 'bignumber.js';
import { Timer, XIcon, Check, ChevronRight, ChevronsRight, ChevronDown, ChevronUp } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';
import { Separator } from '@radix-ui/react-separator';
import { getXChainType, useEvmSwitchChain, useWalletProvider, useXAccounts } from '@sodax/wallet-sdk';
import { availableChains } from '@/constants/chains';
import { useSwapAllowance, useSwapApprove, useSpokeProvider, useQuote } from '@sodax/dapp-kit';
import type { CreateIntentParams, SolverIntentQuoteRequest } from '@sodax/sdk';
// import superjson from 'superjson';

interface SwapConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceToken: XToken;
  destinationToken: XToken;
  sourceAmount: string;
  destinationAmount: string;
  exchangeRate: BigNumber | null;
  onConfirm: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  slippageTolerance?: number;
  estimatedGasFee?: string;
  error?: string;
  sourceAddress?: string;
  destinationAddress?: string;
  isSwapAndSend?: boolean;
  isSwapSuccessful?: boolean;
  swapFee?: string;
  minOutputAmount?: BigNumber;
  intentOrderPayload?: CreateIntentParams;
}

const SwapConfirmDialog: React.FC<SwapConfirmDialogProps> = ({
  open,
  onOpenChange,
  sourceToken,
  destinationToken,
  sourceAmount,
  destinationAmount,
  exchangeRate,
  onConfirm,
  onClose,
  isLoading = false,
  slippageTolerance = 0.5,
  minOutputAmount,
  estimatedGasFee,
  error,
  sourceAddress,
  destinationAddress,
  isSwapAndSend = false,
  isSwapSuccessful = false,
  swapFee,
  intentOrderPayload,
}: SwapConfirmDialogProps) => {
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState<boolean>(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [allowanceConfirmed, setAllowanceConfirmed] = useState<boolean>(false);

  // Add chain switching functionality
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceToken.xChainId);

  // Get connected wallet accounts
  const xAccounts = useXAccounts();

  // Get wallet provider and spoke provider for approval
  const walletProvider = useWalletProvider(sourceToken.xChainId);
  const spokeProvider = useSpokeProvider(sourceToken.xChainId, walletProvider);

  // Only create paramsForApprove when intentOrderPayload exists
  // const paramsForApprove = intentOrderPayload
  //   ? {
  //       ...intentOrderPayload,
  //       inputAmount: intentOrderPayload.inputAmount.toString(),
  //       minOutputAmount: intentOrderPayload.minOutputAmount.toString(),
  //       deadline: intentOrderPayload.deadline.toString(),
  //     }
  //   : undefined;

  // Before passing props
  const paramsForApprove = intentOrderPayload
    ? JSON.parse(
        JSON.stringify(intentOrderPayload, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
      )
    : undefined;

  // Check approval status - only check if not already confirmed
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useSwapAllowance(
    allowanceConfirmed ? undefined : paramsForApprove,
    spokeProvider,
  );

  // Update allowance confirmed state when hasAllowed becomes true
  useEffect(() => {
    console.log(hasAllowed);
    if (hasAllowed && !allowanceConfirmed) {
      setAllowanceConfirmed(true);
    }
  }, [hasAllowed, allowanceConfirmed]);

  // Reset allowance confirmed when dialog opens
  useEffect(() => {
    if (open) {
      setAllowanceConfirmed(false);
      setApprovalError(null);
    }
  }, [open]);

  // Approve function
  const { approve, isLoading: isApproving } = useSwapApprove(intentOrderPayload, spokeProvider);

  // Helper function to get wallet address for a specific chain
  const getWalletAddressForChain = (chainId: ChainId): string => {
    const chainType = getXChainType(chainId);
    if (!chainType) return 'Not connected';
    const account = xAccounts[chainType];
    return account?.address || 'Not connected';
  };

  // Update isCompleted when isSwapSuccessful changes
  useEffect(() => {
    if (isSwapSuccessful) {
      setIsCompleted(true);
    }
  }, [isSwapSuccessful]);

  // Clear approval error when dialog opens
  useEffect(() => {
    if (open) {
      setApprovalError(null);
    }
  }, [open]);

  // Utility function to format numbers to exactly 6 decimal places
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
      await approve({ params: intentOrderPayload });
    } catch (error) {
      console.error('Approval failed:', error);
      setApprovalError(error instanceof Error ? error.message : 'Approval failed. Please try again.');
    }
  };

  const handleConfirm = async (): Promise<void> => {
    setIsConfirming(true);
    try {
      await onConfirm();
      // Don't set isCompleted here - it will be set by the parent via isSwapSuccessful prop
    } catch (error) {
      // Handle any unexpected errors during confirmation
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
      // Allow closing even if not completed (e.g., when there's an error)
      onOpenChange(false);
      onClose?.();
    }
  };

  const formatExchangeRate = (): string => {
    if (!exchangeRate) return 'N/A';
    return `1 ${sourceToken.symbol} = ${exchangeRate.toFixed(6)} ${destinationToken.symbol}`;
  };

  // Helper function to get chain name by ID
  const getChainNameById = (chainId: string | number): string => {
    const chain = availableChains.find(chain => chain.id === chainId);
    return chain?.name || 'Unknown Chain';
  };

  return (
    <Dialog open={open} onOpenChange={isCompleted ? undefined : onOpenChange}>
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
                      {shortenAddress(getWalletAddressForChain(sourceToken.xChainId))}
                    </div>
                  </div>
                  <div className="justify-start text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4]">
                    on {getChainNameById(sourceToken.xChainId)}
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
                      {shortenAddress(getWalletAddressForChain(destinationToken.xChainId))}
                    </div>
                  </div>
                  <div className="justify-start text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4]">
                    on {getChainNameById(destinationToken.xChainId)}
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
              {/* Show Switch Chain button if user is on wrong chain */}
              {isWrongChain && (
                <Button
                  variant="cherry"
                  className="w-full text-white font-semibold font-['InterRegular']"
                  onClick={handleSwitchChain}
                >
                  Switch to {getChainNameById(sourceToken.xChainId)}
                </Button>
              )}

              {/* Show Approval button if not approved */}
              {!isWrongChain && !allowanceConfirmed && intentOrderPayload && (
                <div className="w-full">
                  <Button
                    variant="cherry"
                    className="w-full text-white font-semibold font-['InterRegular']"
                    onClick={handleApprove}
                    disabled={isAllowanceLoading || isApproving || allowanceConfirmed}
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

                  {/* Show approval error if any */}
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

              {/* Show Swap button only if not on wrong chain and approved */}
              {!isWrongChain && allowanceConfirmed && (
                <Button
                  variant="cherry"
                  className="w-full text-white font-semibold font-['InterRegular']"
                  onClick={handleConfirm}
                  disabled={isLoading || isConfirming}
                >
                  {isLoading || isConfirming ? (
                    <div className="flex items-center gap-2 text-white">
                      <span>Swap in progress</span>
                      <CircularProgressIcon
                        width={16}
                        height={16}
                        stroke="white"
                        progress={100}
                        className="animate-spin"
                      />
                    </div>
                  ) : (
                    `Swap ${destinationToken.symbol} on ${getChainNameById(destinationToken.xChainId)}`
                  )}
                </Button>
              )}

              {/* Show loading state when waiting for approval status */}
              {!isWrongChain && !allowanceConfirmed && !intentOrderPayload && (
                <Button
                  variant="cherry"
                  className="w-full text-white font-semibold font-['InterRegular']"
                  disabled={true}
                >
                  {isAllowanceLoading ? 'Checking approval...' : 'Preparing...'}
                </Button>
              )}

              {minOutputAmount && (
                <div className="w-full">
                  <div
                    className="flex justify-center items-center bg-transparent rounded-xl cursor-pointer"
                    onClick={() => setIsAccordionExpanded(!isAccordionExpanded)}
                  >
                    <div className="inline-flex justify-center items-center gap-1 w-60">
                      <div className="justify-start text-clay-light text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight">
                        Receive at least
                      </div>
                      <div className="justify-start text-clay text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight">
                        {formatToSixDecimals(minOutputAmount.toString())} {destinationToken.symbol}
                      </div>
                    </div>
                    <div className="w-4 h-4 relative overflow-hidden">
                      {isAccordionExpanded ? (
                        <ChevronUp className="w-4 h-4 text-clay-light" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-clay-light" />
                      )}
                    </div>
                  </div>

                  {/* Accordion Content */}
                  {isAccordionExpanded && (
                    <div className="bg-transparent border-none">
                      <Separator className="bg-clay-light h-[1px] mt-4 mb-4 opacity-30" />
                      <div className="space-y-2 text-(length:--body-comfortable)">
                        <div className="flex justify-between">
                          <span className="text-clay-light">Swap Fee (0.10%)</span>
                          <span className="text-espresso font-medium">{swapFee || '&lt; $0.01'}</span>
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
                  )}
                </div>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SwapConfirmDialog;
