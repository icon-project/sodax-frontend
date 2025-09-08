'use client';

import type React from 'react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import CurrencyInputPanel, { CurrencyInputPanelType } from './_components/currency-input-panel';
import SwapConfirmDialog from './_components/swap-confirm-dialog';
import { Button } from '@/components/ui/button';
import { SwitchDirectionIcon } from '@/components/icons/switch-direction-icon';
import type { XToken, SpokeChainId, ChainType } from '@sodax/types';
import { useWalletUI } from '../_context/wallet-ui';
import { useXAccount, useXAccounts, useXBalances, useXConnection } from '@sodax/wallet-sdk';
import { getXChainType } from '@sodax/wallet-sdk';
import { chainIdToChainName } from '@/providers/constants';
import { useQuote, useSpokeProvider, useSwap, useStatus } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk';
import BigNumber from 'bignumber.js';
import type { CreateIntentParams, QuoteType } from '@sodax/sdk';
import { SolverIntentStatusCode } from '@sodax/sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { useSodaxContext } from '@sodax/dapp-kit';
import { useSwapState, useSwapActions } from './_stores/swap-store-provider';

const scaleTokenAmount = (amount: number | string, decimals: number): bigint => {
  if (!amount || amount === '' || amount === '0' || Number.isNaN(Number(amount))) {
    return 0n;
  }

  return BigInt(
    new BigNumber(amount.toString()).multipliedBy(new BigNumber(10).pow(decimals)).toFixed(0, BigNumber.ROUND_DOWN),
  );
};

const normaliseTokenAmount = (amount: number | string | bigint, decimals: number): string => {
  if (!amount || amount === 0n || amount === '0' || Number.isNaN(Number(amount))) {
    return '0';
  }

  return new BigNumber(amount.toString()).dividedBy(new BigNumber(10).pow(decimals)).toFixed(4, BigNumber.ROUND_DOWN);
};

// Calculate the maximum available amount for swapping after deducting the swap fee
const calculateMaxAvailableAmount = (
  balance: bigint,
  tokenDecimals: number,
  solver: { getFee: (amount: bigint) => bigint },
): string => {
  if (balance === 0n) {
    return '0';
  }

  try {
    const fullBalance = normaliseTokenAmount(balance, tokenDecimals);
    const fullBalanceBigInt = scaleTokenAmount(fullBalance, tokenDecimals);
    const feeAmount = solver.getFee(fullBalanceBigInt);

    // Calculate available balance after deducting fee
    const availableBalanceBigInt = fullBalanceBigInt - feeAmount;

    if (availableBalanceBigInt > 0n) {
      return normaliseTokenAmount(availableBalanceBigInt, tokenDecimals);
    }

    // If fee is greater than or equal to balance, return 0
    return '0';
  } catch (error) {
    console.error('Error calculating max available amount:', error);
    // Fallback to full balance if fee calculation fails
    return normaliseTokenAmount(balance, tokenDecimals);
  }
};

// Check if user has sufficient balance including swap fee
const hasSufficientBalanceWithFee = (
  amount: string,
  balance: bigint,
  tokenDecimals: number,
  solver: { getFee: (amount: bigint) => bigint },
): boolean => {
  if (!amount || amount === '0' || amount === '' || Number.isNaN(Number(amount))) {
    return false;
  }

  try {
    const amountBigInt = scaleTokenAmount(amount, tokenDecimals);
    const feeAmount = solver.getFee(amountBigInt);
    const totalRequired = amountBigInt + feeAmount;

    return totalRequired <= balance;
  } catch (error) {
    console.error('Error checking sufficient balance with fee:', error);
    // Fallback to simple balance check if fee calculation fails
    const amountBigInt = scaleTokenAmount(amount, tokenDecimals);
    return amountBigInt <= balance;
  }
};

// Component to monitor swap status only when dstTxHash is available
interface SwapStatusMonitorProps {
  dstTxHash: string;
  onSwapSuccessful: () => void;
  onSwapFailed: () => void; // Add callback for failed swaps
  onUpdateSwapStatus: (statusCode: number) => void;
  resetTrigger: number; // Add this to trigger reset of internal state
}

function SwapStatusMonitor({
  dstTxHash,
  onSwapSuccessful,
  onSwapFailed,
  onUpdateSwapStatus,
  resetTrigger,
}: SwapStatusMonitorProps): React.JSX.Element | null {
  const { data: status } = useStatus(dstTxHash as `0x${string}`);
  const hasCalledSuccess = useRef<boolean>(false);
  const hasCalledFailed = useRef<boolean>(false); // Track if we've already called failed callback
  const lastResetTrigger = useRef<number>(resetTrigger);

  // Reset the success and failed flags when resetTrigger changes (new swap started)
  useEffect(() => {
    if (resetTrigger !== lastResetTrigger.current) {
      hasCalledSuccess.current = false;
      hasCalledFailed.current = false;
      lastResetTrigger.current = resetTrigger;
    }
  });

  useEffect(() => {
    console.log('Status update:', status, 'dstTxHash:', dstTxHash);

    if (status?.ok && !hasCalledSuccess.current && !hasCalledFailed.current) {
      const statusCode = status.value.status;
      onUpdateSwapStatus(statusCode);
      if (statusCode === SolverIntentStatusCode.SOLVED) {
        console.log('Swap status is SOLVED, calling onSwapSuccessful');
        hasCalledSuccess.current = true;
        onSwapSuccessful();
      } else if (statusCode === SolverIntentStatusCode.FAILED) {
        console.log('Swap status is FAILED, calling onSwapFailed');
        hasCalledFailed.current = true;
        onSwapFailed();
      }
    }
  }, [status, dstTxHash, onSwapSuccessful, onSwapFailed, onUpdateSwapStatus]);

  // This component doesn't render anything, it just monitors status
  return null;
}

export default function SwapPage() {
  const { openWalletModal } = useWalletUI();
  const queryClient = useQueryClient();

  // Get swap state from Zustand store
  const {
    sourceToken,
    destinationToken,
    sourceAmount,
    destinationAmount,
    isSwapAndSend,
    customDestinationAddress,
    slippageTolerance,
  } = useSwapState();

  // Get swap actions from Zustand store
  const {
    setSourceToken,
    setDestinationToken,
    setSourceAmount,
    setDestinationAmount,
    setIsSwapAndSend,
    setCustomDestinationAddress,
    switchTokens,
  } = useSwapActions();

  const [isSwapConfirmOpen, setIsSwapConfirmOpen] = useState<boolean>(false);
  const [swapError, setSwapError] = useState<string>('');
  const [isSwapSuccessful, setIsSwapSuccessful] = useState<boolean>(false);
  const [isSwapFailed, setIsSwapFailed] = useState<boolean>(false); // Add failed state
  const [dstTxHash, setDstTxHash] = useState<string>('');
  const [swapResetCounter, setSwapResetCounter] = useState<number>(0);

  // Memoize the callback to prevent unnecessary re-renders of SwapStatusMonitor
  const handleSwapSuccessful = useCallback(() => {
    setIsSwapSuccessful(true);
    setIsSwapFailed(false); // Reset failed state when successful
  }, []);

  // Add callback for failed swaps
  const handleSwapFailed = useCallback(() => {
    setIsSwapFailed(true);
    setIsSwapSuccessful(false); // Reset success state when failed
    setSwapError('Swap failed. Please try again.'); // Set error message
  }, []);

  const sourceChainType = getXChainType(sourceToken.xChainId);
  const destinationChainType = getXChainType(destinationToken.xChainId);
  const [intentOrderPayload, setIntentOrderPayload] = useState<CreateIntentParams | undefined>(undefined);
  const { address: sourceAddress } = useXAccount(sourceChainType);
  const { address: destinationAddress } = useXAccount(destinationChainType);

  const isSourceChainConnected = sourceAddress !== undefined;
  const isDestinationChainConnected = destinationAddress !== undefined;

  const sourceWalletProvider = useWalletProvider(sourceToken.xChainId);
  const sourceProvider = useSpokeProvider(sourceToken.xChainId, sourceWalletProvider);

  const { data: sourceBalances } = useXBalances({
    xChainId: sourceToken.xChainId,
    xTokens: [sourceToken],
    address: sourceAddress,
  });

  const { data: destinationBalances } = useXBalances({
    xChainId: destinationToken.xChainId,
    xTokens: [destinationToken],
    address: destinationAddress,
  });

  const sourceBalance = sourceBalances?.[sourceToken.address] || 0n;
  const destinationBalance = destinationBalances?.[destinationToken.address] || 0n;

  // Check if swap is successful based on status
  // Status monitoring is now handled by SwapStatusMonitor component

  // Determine if we should show loading state
  const isWaitingForSolvedStatus = useMemo(() => {
    // Stop loading if swap failed, continue loading if we have dstTxHash and haven't failed
    return !!dstTxHash && !isSwapFailed;
  }, [dstTxHash, isSwapFailed]);

  // Get token prices and USD values
  const { usdValue: sourceUsdValue } = useTokenPrice(sourceToken, sourceAmount);
  const { usdValue: destinationUsdValue } = useTokenPrice(destinationToken, destinationAmount);

  // Get Sodax context for fee calculation
  const { sodax } = useSodaxContext();

  // Calculate swap fee
  const swapFee = useMemo(() => {
    if (!sourceAmount || sourceAmount === '' || Number.isNaN(Number(sourceAmount)) || Number(sourceAmount) <= 0) {
      return undefined;
    }

    try {
      const sourceAmountBigInt = scaleTokenAmount(sourceAmount, sourceToken.decimals);
      const feeAmount = sodax.solver.getFee(sourceAmountBigInt);

      if (feeAmount === 0n) {
        return 'Free';
      }

      // Convert fee to human readable format
      const feeInTokens = normaliseTokenAmount(feeAmount, sourceToken.decimals);
      const feeUsdValue = sourceUsdValue ? (Number(feeInTokens) * sourceUsdValue) / Number(sourceAmount) : undefined;

      if (feeUsdValue && feeUsdValue > 0) {
        return `$${feeUsdValue.toFixed(4)}`;
      }

      return `${feeInTokens} ${sourceToken.symbol}`;
    } catch (error) {
      console.error('Error calculating swap fee:', error);
      return '&lt; $0.01';
    }
  }, [sourceAmount, sourceToken, sodax.solver, sourceUsdValue]);

  const quotePayload = useMemo(() => {
    if (
      !sourceToken ||
      !destinationToken ||
      !sourceAmount ||
      sourceAmount === '' ||
      Number.isNaN(Number(sourceAmount)) ||
      Number(sourceAmount) <= 0
    ) {
      return undefined;
    }

    const payload = {
      token_src: sourceToken.address,
      token_src_blockchain_id: sourceToken.xChainId,
      token_dst: destinationToken.address,
      token_dst_blockchain_id: destinationToken.xChainId,
      amount: scaleTokenAmount(sourceAmount, sourceToken.decimals),
      quote_type: 'exact_input' as QuoteType,
    };

    return payload;
  }, [sourceToken, destinationToken, sourceAmount]);

  const quoteQuery = useQuote(quotePayload);

  const calculatedDestinationAmount = useMemo(() => {
    if (quoteQuery.data?.ok && quoteQuery.data.value) {
      const quotedAmount = quoteQuery.data.value.quoted_amount;
      return normaliseTokenAmount(quotedAmount, destinationToken.decimals);
    }
    return '';
  }, [quoteQuery.data, destinationToken.decimals]);

  const exchangeRate = useMemo(() => {
    if (
      !sourceAmount ||
      !calculatedDestinationAmount ||
      sourceAmount === '' ||
      calculatedDestinationAmount === '' ||
      Number.isNaN(Number(sourceAmount)) ||
      Number.isNaN(Number(calculatedDestinationAmount)) ||
      Number(sourceAmount) <= 0
    ) {
      return null;
    }

    try {
      return new BigNumber(calculatedDestinationAmount).dividedBy(new BigNumber(sourceAmount));
    } catch {
      return null;
    }
  }, [sourceAmount, calculatedDestinationAmount]);

  const minOutputAmount = useMemo(() => {
    if (quoteQuery.data?.ok && quoteQuery.data.value && calculatedDestinationAmount) {
      return new BigNumber(calculatedDestinationAmount)
        .multipliedBy(100 - slippageTolerance)
        .dividedBy(100)
        .toFixed(destinationToken.decimals, BigNumber.ROUND_DOWN);
    }
    return '';
  }, [quoteQuery.data, calculatedDestinationAmount, destinationToken.decimals, slippageTolerance]);

  useEffect(() => {
    setDestinationAmount(calculatedDestinationAmount);
  }, [calculatedDestinationAmount, setDestinationAmount]);

  const { mutateAsync: executeSwap, isPending: isSwapPending } = useSwap(sourceProvider);

  const getTargetChainType = (): ChainType | undefined => {
    if (!sourceAddress) {
      return sourceChainType;
    }

    if (!destinationAddress) {
      return destinationChainType;
    }

    return undefined;
  };

  const getButtonState = (): {
    text: string;
    disabled: boolean;
    action: 'connect' | 'enter-amount' | 'review' | 'insufficient-balance';
  } => {
    if (!sourceAddress) {
      return {
        text: `Connect to ${chainIdToChainName(sourceToken.xChainId as SpokeChainId)}`,
        disabled: false,
        action: 'connect',
      };
    }

    if (!sourceAmount || sourceAmount === '0' || sourceAmount === '' || Number.isNaN(Number(sourceAmount))) {
      return {
        text: 'Enter amount',
        disabled: true,
        action: 'enter-amount',
      };
    }

    if (!hasSufficientBalanceWithFee(sourceAmount, sourceBalance, sourceToken.decimals, sodax.solver)) {
      return {
        text: 'Insufficient balance',
        disabled: true,
        action: 'insufficient-balance',
      };
    }

    if (isSwapAndSend) {
      if (!customDestinationAddress || customDestinationAddress.trim() === '') {
        return {
          text: 'Enter destination address',
          disabled: true,
          action: 'enter-amount',
        };
      }
    } else {
      if (!destinationAddress) {
        return {
          text: 'Connect recipient',
          disabled: false,
          action: 'connect',
        };
      }
    }

    if (quoteQuery.isLoading) {
      return {
        text: 'Getting quote...',
        disabled: true,
        action: 'enter-amount',
      };
    }

    if (quoteQuery.error || (quoteQuery.data && !quoteQuery.data.ok)) {
      return {
        text: 'Quote unavailable',
        disabled: true,
        action: 'enter-amount',
      };
    }

    return {
      text: 'Review',
      disabled: false,
      action: 'review',
    };
  };

  const createIntentOrderPayload = async (): Promise<void> => {
    if (!quoteQuery.data?.ok || !quoteQuery.data.value) {
      console.error('Quote undefined');
      return;
    }

    if (!sourceToken || !destinationToken) {
      console.error('sourceToken or destToken undefined');
      return;
    }

    if (!minOutputAmount || minOutputAmount === '') {
      console.error('minOutputAmount undefined');
      return;
    }

    if (!sourceAddress) {
      console.error('sourceAccount.address undefined');
      return;
    }

    if (!destinationAddress) {
      console.error('destAccount.address undefined');
      return;
    }

    if (!sourceProvider) {
      console.error('sourceProvider or destProvider undefined');
      return;
    }

    const createIntentParams = {
      inputToken: sourceToken.address, // The address of the input token on hub chain
      outputToken: destinationToken.address, // The address of the output token on hub chain
      inputAmount: scaleTokenAmount(sourceAmount, sourceToken.decimals), // The amount of input tokens
      minOutputAmount: BigInt(Number(minOutputAmount).toFixed(0)), // The minimum amount of output tokens to accept
      deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // Optional timestamp after which intent expires (0 = no deadline)
      allowPartialFill: false, // Whether the intent can be partially filled
      srcChain: sourceToken.xChainId as SpokeChainId, // Chain ID where input tokens originate
      dstChain: destinationToken.xChainId as SpokeChainId, // Chain ID where output tokens should be delivered
      srcAddress: sourceAddress, // Source address (original address on spoke chain)
      dstAddress: destinationAddress, // Destination address (original address on spoke chain)
      solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
      data: '0x', // Additional arbitrary data
    } satisfies CreateIntentParams;

    setIntentOrderPayload(createIntentParams);
  };

  const handleOpenWalletModal = (): void => {
    const buttonState = getButtonState();

    if (buttonState.action === 'connect') {
      const targetChainType = getTargetChainType();
      openWalletModal(targetChainType);
    } else if (buttonState.action === 'review') {
      createIntentOrderPayload();
      setIsSwapConfirmOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSourceAmount(e.target.value);
  };

  const handleMaxClick = (): void => {
    if (isSourceChainConnected) {
      const maxAvailableAmount = calculateMaxAvailableAmount(sourceBalance, sourceToken.decimals, sodax.solver);
      setSourceAmount(maxAvailableAmount);
    }
  };

  const switchDirection = (): void => {
    switchTokens();
  };

  const handleSwapConfirm = async (): Promise<void> => {
    try {
      setSwapError('');
      setIsSwapSuccessful(false);
      setSwapResetCounter(prev => prev + 1);

      if (!sourceProvider) {
        throw new Error('Source provider not available');
      }

      if (!sourceAddress) {
        throw new Error('Source address not available');
      }

      const finalDestinationAddress =
        isSwapAndSend && customDestinationAddress ? customDestinationAddress : destinationAddress;

      if (!finalDestinationAddress) {
        throw new Error('Destination address not available');
      }

      if (!quoteQuery.data?.ok || !quoteQuery.data.value) {
        throw new Error('Quote not available. Please try again.');
      }

      const quotedAmount = quoteQuery.data.value.quoted_amount;
      const sourceAmountBigInt = scaleTokenAmount(sourceAmount, sourceToken.decimals);

      if (sourceAmountBigInt <= 0n) {
        throw new Error('Invalid source amount');
      }

      if (quotedAmount <= 0n) {
        throw new Error('Invalid quoted amount');
      }

      if (!hasSufficientBalanceWithFee(sourceAmount, sourceBalance, sourceToken.decimals, sodax.solver)) {
        throw new Error('Insufficient balance for swap (including fees)');
      }

      const minOutputAmount = new BigNumber(quotedAmount.toString())
        .multipliedBy(100 - slippageTolerance)
        .dividedBy(100)
        .toFixed(0, BigNumber.ROUND_DOWN);

      const result = await executeSwap({
        inputToken: sourceToken.address,
        outputToken: destinationToken.address,
        inputAmount: sourceAmountBigInt,
        minOutputAmount: BigInt(minOutputAmount),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5),
        allowPartialFill: false,
        srcChain: sourceToken.xChainId as SpokeChainId,
        dstChain: destinationToken.xChainId as SpokeChainId,
        srcAddress: sourceAddress,
        dstAddress: finalDestinationAddress,
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      });

      if (!result.ok) {
        throw new Error(`Swap execution failed: ${result.error?.code || 'Unknown error'}`);
      }

      // Store the destination transaction hash for status monitoring
      const [, , intentDeliveryInfo] = result.value;
      setDstTxHash(intentDeliveryInfo.dstTxHash);
      setSwapStatus(0);
      console.log('Swap Status', swapStatus);
      // Invalidate balance queries
      queryClient.invalidateQueries({ queryKey: ['xBalances'] });
    } catch (error) {
      console.error('Swap execution failed:', error);
      setSwapError(error instanceof Error ? error.message : 'Swap failed. Please try again.');
      setDstTxHash('');
    }
  };

  const handleDialogClose = (): void => {
    // setSourceAmount('');
    // setDestinationAmount('');
    setSwapError('');
    setIsSwapSuccessful(false);
    setIsSwapFailed(false); // Reset failed state
    setDstTxHash('');
    setSwapResetCounter(prev => prev + 1);
  };

  const buttonState = getButtonState();
  const [swapStatus, setSwapStatus] = useState<number>(-1);
  const handleUpdateSwapStatus = (statusCode: number) => {
    setSwapStatus(statusCode);
  };
  return (
    <div className="w-full">
      {/* SwapStatusMonitor component - only renders when dstTxHash is available */}
      {dstTxHash && (
        <SwapStatusMonitor
          dstTxHash={dstTxHash}
          onSwapSuccessful={handleSwapSuccessful}
          onSwapFailed={handleSwapFailed}
          resetTrigger={swapResetCounter}
          onUpdateSwapStatus={handleUpdateSwapStatus}
        />
      )}

      <div className="gap-(--layout-space-comfortable) w-full flex flex-col">
        <div className="inline-flex flex-col justify-start items-start gap-4">
          <div className="self-stretch mix-blend-multiply justify-end">
            <span className="text-yellow-dark text-(length:--app-title) font-bold font-['InterRegular'] leading-9">
              Swap{' '}
            </span>
            <span className="text-yellow-dark text-(length:--app-title) font-normal font-['Shrikhand'] leading-9">
              everywhere
            </span>
          </div>
          <div className="mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug !text-(size:--subtitle)">
            Access 53 assets across 11 networks.
          </div>
        </div>

        <div className="inline-flex flex-col justify-start items-start gap-2 w-full">
          <div className="relative w-full">
            <CurrencyInputPanel
              type={CurrencyInputPanelType.INPUT}
              chainId={sourceToken.xChainId as SpokeChainId}
              currency={sourceToken}
              currencyBalance={isSourceChainConnected ? sourceBalance : 0n}
              inputValue={sourceAmount}
              onInputChange={handleInputChange}
              onMaxClick={handleMaxClick}
              onCurrencyChange={setSourceToken}
              isChainConnected={isSourceChainConnected}
              usdValue={sourceUsdValue}
            />

            <Button
              variant="secondary"
              size="icon"
              className="w-10 h-10 left-1/2 bottom-[-22px] absolute transform -translate-x-1/2 bg-cream-white rounded-[256px] border-4 border-[#F5F2F2] flex justify-center items-center hover:bg-cherry-grey hover:outline-cherry-grey hover:scale-110 cursor-pointer transition-all duration-200 active:bg-cream-white z-50"
              onClick={switchDirection}
            >
              <SwitchDirectionIcon className="w-4 h-4" />
            </Button>
          </div>

          <CurrencyInputPanel
            type={CurrencyInputPanelType.OUTPUT}
            chainId={destinationToken.xChainId as SpokeChainId}
            currency={destinationToken}
            currencyBalance={isDestinationChainConnected ? destinationBalance : 0n}
            inputValue={destinationAmount}
            onCurrencyChange={setDestinationToken}
            isChainConnected={isDestinationChainConnected}
            isSwapAndSend={isSwapAndSend}
            onSwapAndSendToggle={setIsSwapAndSend}
            customDestinationAddress={customDestinationAddress}
            onCustomDestinationAddressChange={setCustomDestinationAddress}
            usdValue={destinationUsdValue}
          />
        </div>

        {quoteQuery.data?.ok === false && (
          <div className="self-stretch px-8 py-6 bg-white rounded-[20px] inline-flex justify-between items-center">
            <div className="flex-1 inline-flex flex-col justify-center items-start gap-1">
              {/* <div className="self-stretch justify-center text-espresso text-base font-bold font-['InterRegular'] leading-tight">
                Sorry, your transaction got stuck
              </div> */}
              <div className="self-stretch justify-center">
                <span className="text-clay text-base font-normal font-['InterRegular'] leading-tight">
                  {quoteQuery.data.error.detail.message} <br />
                  For more help, reach out{' '}
                </span>
                <span className="text-clay text-base font-normal font-['InterRegular'] underline leading-tight">
                  on Discord
                </span>
                <span className="text-clay text-base font-normal font-['InterRegular'] leading-tight">.</span>
              </div>
            </div>
          </div>
        )}

        {/* Failed swap error display */}
        {isSwapFailed && (
          <div className="self-stretch px-8 py-6 bg-red-50 border border-red-200 rounded-[20px] inline-flex justify-between items-center">
            <div className="flex-1 inline-flex flex-col justify-center items-start gap-1">
              <div className="self-stretch justify-center text-red-600 text-base font-bold font-['InterRegular'] leading-tight">
                Swap Failed
              </div>
              <div className="self-stretch justify-center text-red-500 text-base font-normal font-['InterRegular'] leading-tight">
                {swapError || 'Your swap transaction failed. Please try again.'}
              </div>
            </div>
          </div>
        )}

        <Button
          variant="cherry"
          className="w-full md:w-[232px] text-(size:--body-comfortable) text-white"
          onClick={handleOpenWalletModal}
          disabled={buttonState.disabled}
        >
          {buttonState.text}
        </Button>
      </div>

      {sourceAddress && (
        <div className="mt-3 text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
          Takes ~1 min · Total fees: {swapFee || '$0.001'}
        </div>
      )}

      <SwapConfirmDialog
        open={isSwapConfirmOpen}
        onOpenChange={setIsSwapConfirmOpen}
        sourceToken={sourceToken}
        destinationToken={destinationToken}
        sourceAmount={sourceAmount}
        destinationAmount={destinationAmount}
        exchangeRate={exchangeRate}
        onConfirm={handleSwapConfirm}
        onClose={handleDialogClose}
        isLoading={Boolean(isSwapPending || isWaitingForSolvedStatus)}
        slippageTolerance={slippageTolerance}
        error={swapError}
        minOutputAmount={new BigNumber(minOutputAmount)}
        intentOrderPayload={intentOrderPayload}
        isSwapSuccessful={isSwapSuccessful}
        swapFee={swapFee}
        swapStatus={swapStatus}
      />
    </div>
  );
}
