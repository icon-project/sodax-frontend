'use client';

import type React from 'react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import CurrencyInputPanel, { CurrencyInputPanelType } from './_components/currency-input-panel';
import SwapConfirmDialog from './_components/swap-confirm-dialog';
import { Button } from '@/components/ui/button';
import { SwitchDirectionIcon } from '@/components/icons/switch-direction-icon';
import type { SpokeChainId, ChainType } from '@sodax/types';
import { useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { getXChainType } from '@sodax/wallet-sdk-react';
import { chainIdToChainName } from '@/providers/constants';
import { useQuote, useSpokeProvider, useSwap, useStatus } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import BigNumber from 'bignumber.js';
import type { CreateIntentParams, QuoteType } from '@sodax/sdk';
import { SolverIntentStatusCode } from '@sodax/sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { useSodaxContext } from '@sodax/dapp-kit';
import { useSwapState, useSwapActions } from './_stores/swap-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { useModalStore } from '@/stores/modal-store-provider';
import { parseUnits } from 'viem';
import { normaliseTokenAmount } from '../migrate/_utils/migration-utils';

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
    const fullBalanceBigInt = parseUnits(fullBalance, tokenDecimals);
    const feeAmount = solver.getFee(fullBalanceBigInt);

    const availableBalanceBigInt = fullBalanceBigInt - feeAmount;

    if (availableBalanceBigInt > 0n) {
      return normaliseTokenAmount(availableBalanceBigInt, tokenDecimals);
    }

    return '0';
  } catch (error) {
    console.error('Error calculating max available amount:', error);
    return normaliseTokenAmount(balance, tokenDecimals);
  }
};

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
    const amountBigInt = parseUnits(amount, tokenDecimals);
    const feeAmount = solver.getFee(amountBigInt);
    const totalRequired = amountBigInt + feeAmount;

    return totalRequired <= balance;
  } catch (error) {
    console.error('Error checking sufficient balance with fee:', error);
    const amountBigInt = parseUnits(amount, tokenDecimals);
    return amountBigInt <= balance;
  }
};

interface SwapStatusMonitorProps {
  dstTxHash: string;
  onSwapSuccessful: () => void;
  onSwapFailed: () => void;
  onUpdateSwapStatus: (statusCode: number) => void;
  resetTrigger: number;
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
  const hasCalledFailed = useRef<boolean>(false);
  const lastResetTrigger = useRef<number>(resetTrigger);

  useEffect(() => {
    if (resetTrigger !== lastResetTrigger.current) {
      hasCalledSuccess.current = false;
      hasCalledFailed.current = false;
      lastResetTrigger.current = resetTrigger;
    }
  });

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

export default function SwapPage() {
  const openModal = useModalStore(state => state.openModal);
  const queryClient = useQueryClient();

  const { sourceToken, destinationToken, sourceAmount, isSwapAndSend, customDestinationAddress, slippageTolerance } =
    useSwapState();

  const {
    setSourceToken,
    setDestinationToken,
    setSourceAmount,
    setIsSwapAndSend,
    setCustomDestinationAddress,
    switchTokens,
  } = useSwapActions();

  const [isSwapConfirmOpen, setIsSwapConfirmOpen] = useState<boolean>(false);
  const [swapError, setSwapError] = useState<string>('');
  const [isSwapSuccessful, setIsSwapSuccessful] = useState<boolean>(false);
  const [isSwapFailed, setIsSwapFailed] = useState<boolean>(false);
  const [dstTxHash, setDstTxHash] = useState<string>('');
  const [swapResetCounter, setSwapResetCounter] = useState<number>(0);

  // Fixed amounts for dialog - these don't change once dialog is open
  const [fixedDestinationAmount, setFixedDestinationAmount] = useState<string>('');
  const [fixedMinOutputAmount, setFixedMinOutputAmount] = useState<string>('');

  const handleSwapSuccessful = useCallback(() => {
    setIsSwapSuccessful(true);
    setIsSwapFailed(false);
  }, []);

  const handleSwapFailed = useCallback(() => {
    setIsSwapFailed(true);
    setIsSwapSuccessful(false);
    setSwapError('Swap failed. Please try again.');
  }, []);

  const sourceChainType = getXChainType(sourceToken.xChainId);
  const destinationChainType = getXChainType(destinationToken.xChainId);
  const [intentOrderPayload, setIntentOrderPayload] = useState<CreateIntentParams | undefined>(undefined);
  const { address: sourceAddress } = useXAccount(sourceToken.xChainId);
  const { address: destinationAddress } = useXAccount(destinationToken.xChainId);

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

  const isWaitingForSolvedStatus = useMemo(() => {
    return !!dstTxHash && !isSwapFailed;
  }, [dstTxHash, isSwapFailed]);

  const { usdValue: sourceUsdValue } = useTokenPrice(sourceToken, sourceAmount);

  const { sodax } = useSodaxContext();

  const swapFee = useMemo(() => {
    if (!sourceAmount || sourceAmount === '' || Number.isNaN(Number(sourceAmount)) || Number(sourceAmount) <= 0) {
      return undefined;
    }

    try {
      const sourceAmountBigInt = parseUnits(sourceAmount, sourceToken.decimals);
      const feeAmount = sodax.solver.getFee(sourceAmountBigInt);

      if (feeAmount === 0n) {
        return 'Free';
      }

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
      amount: parseUnits(sourceAmount, sourceToken.decimals),
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

  const { usdValue: destinationUsdValue } = useTokenPrice(destinationToken, calculatedDestinationAmount);

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
      inputAmount: parseUnits(sourceAmount, sourceToken.decimals), // The amount of input tokens
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
      openModal(MODAL_ID.WALLET_MODAL, { primaryChainType: getTargetChainType() });
    } else if (buttonState.action === 'review') {
      // Set fixed amounts before opening dialog to prevent changes during swap
      setFixedDestinationAmount(calculatedDestinationAmount);
      setFixedMinOutputAmount(minOutputAmount);
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
      const sourceAmountBigInt = parseUnits(sourceAmount, sourceToken.decimals);

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

      const [, , intentDeliveryInfo] = result.value;
      setDstTxHash(intentDeliveryInfo.dstTxHash);
      setSwapStatus(0);
      queryClient.invalidateQueries({ queryKey: ['xBalances'] });
    } catch (error) {
      console.error('Swap execution failed:', error);
      setSwapError(error instanceof Error ? error.message : 'Swap failed. Please try again.');
      setDstTxHash('');
    }
  };

  const handleDialogClose = (): void => {
    setSwapError('');
    setIsSwapSuccessful(false);
    setIsSwapFailed(false);
    setDstTxHash('');
    setSwapResetCounter(prev => prev + 1);
    // Reset fixed amounts when dialog is closed
    setFixedDestinationAmount('');
    setFixedMinOutputAmount('');
  };

  const buttonState = getButtonState();
  const [swapStatus, setSwapStatus] = useState<number>(-1);
  const handleUpdateSwapStatus = (statusCode: number) => {
    setSwapStatus(statusCode);
  };
  return (
    <div className="w-full">
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
            inputValue={calculatedDestinationAmount}
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
        destinationAmount={
          isSwapConfirmOpen && fixedDestinationAmount ? fixedDestinationAmount : calculatedDestinationAmount
        }
        exchangeRate={exchangeRate}
        onConfirm={handleSwapConfirm}
        onClose={handleDialogClose}
        isLoading={Boolean(isSwapPending || isWaitingForSolvedStatus)}
        slippageTolerance={slippageTolerance}
        error={swapError}
        minOutputAmount={
          new BigNumber(isSwapConfirmOpen && fixedMinOutputAmount ? fixedMinOutputAmount : minOutputAmount)
        }
        intentOrderPayload={intentOrderPayload}
        isSwapSuccessful={isSwapSuccessful}
        swapFee={swapFee}
        swapStatus={swapStatus}
      />
    </div>
  );
}
