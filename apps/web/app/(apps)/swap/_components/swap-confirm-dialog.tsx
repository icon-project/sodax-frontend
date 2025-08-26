import type React from 'react';
import { useState } from 'react';
import type { XToken } from '@sodax/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CurrencyLogo from '@/components/shared/currency-logo';
import { SwitchDirectionIcon, CircularProgressIcon } from '@/components/icons';
import { formatUnits } from 'viem';
import type BigNumber from 'bignumber.js';
import { Timer, XIcon, Check, ChevronRight, ChevronsRight, ChevronDown, ChevronUp } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';
import { Separator } from '@radix-ui/react-separator';

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
  minOutputAmount?: string; // Add minOutputAmount prop
  sourceAddress?: string;
  destinationAddress?: string;
  isSwapAndSend?: boolean;
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
  estimatedGasFee,
  error,
  minOutputAmount, // Add minOutputAmount to destructuring
  sourceAddress,
  destinationAddress,
  isSwapAndSend = false,
}: SwapConfirmDialogProps) => {
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState<boolean>(false); // Add accordion state

  // Utility function to format numbers to exactly 6 decimal places
  const formatToSixDecimals = (value: string): string => {
    const num = Number.parseFloat(value);
    if (Number.isNaN(num)) return value;
    return num.toFixed(4);
  };

  const handleConfirm = async (): Promise<void> => {
    setIsConfirming(true);
    try {
      await onConfirm();
      setIsCompleted(true);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = (): void => {
    if (isCompleted) {
      setIsCompleted(false);
      onOpenChange(false);
      onClose?.();
    }
  };

  const formatExchangeRate = (): string => {
    if (!exchangeRate) return 'N/A';
    return `1 ${sourceToken.symbol} = ${exchangeRate.toFixed(6)} ${destinationToken.symbol}`;
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
                      {shortenAddress(sourceToken.address)}
                    </div>
                  </div>
                  <div className="justify-start text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4]">
                    on {sourceToken.xChainId.toUpperCase()}
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
                      {shortenAddress(destinationToken.address)}
                    </div>
                  </div>
                  <div className="justify-start text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4]">
                    on {destinationToken.xChainId.toUpperCase()}
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
          ) : (
            <div className="flex w-full flex-col gap-4">
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
                  `Swap ${destinationToken.symbol} on ${destinationToken.xChainId.toUpperCase()}`
                )}
              </Button>

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
                        {formatToSixDecimals(minOutputAmount)} {destinationToken.symbol}
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
                          <span className="text-clay-light">Swap Fee:</span>
                          <span className="text-espresso font-medium">&lt; $0.01</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-clay-light">Network Cost:</span>
                          <span className="text-espresso font-medium">
                            {/* {estimatedGasFee ? `${estimatedGasFee} ETH` : 'N/A'} */}
                            &lt; $0.01
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-clay-light">Max Slippage:</span>
                          <span className="text-espresso font-medium">{slippageTolerance}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-clay-light">Via:</span>
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
