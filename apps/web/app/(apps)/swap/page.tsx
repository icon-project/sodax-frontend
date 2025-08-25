'use client';

import type React from 'react';
import { useState, useMemo, useEffect } from 'react';
import CurrencyInputPanel, { CurrencyInputPanelType } from './_components/currency-input-panel';
import SwapConfirmDialog from './_components/swap-confirm-dialog';
import { Button } from '@/components/ui/button';
import { SwitchDirectionIcon } from '@/components/icons/switch-direction-icon';
import type { XToken, SpokeChainId, ChainType } from '@sodax/types';
import { useWalletUI } from '../_context/wallet-ui';
import { useXAccount, useXBalances, useXConnection } from '@sodax/wallet-sdk';
import { getXChainType } from '@sodax/wallet-sdk';
import { chainIdToChainName } from '@/providers/constants';
import { useQuote, useSpokeProvider, useSwap } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk';
import BigNumber from 'bignumber.js';
import type { QuoteType } from '@sodax/sdk';
import { useQueryClient } from '@tanstack/react-query';

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

  return new BigNumber(amount.toString())
    .dividedBy(new BigNumber(10).pow(decimals))
    .toFixed(decimals, BigNumber.ROUND_DOWN);
};

export default function SwapPage() {
  const { openWalletModal } = useWalletUI();
  const queryClient = useQueryClient();
  const [sourceAmount, setSourceAmount] = useState<string>('');
  const [destinationAmount, setDestinationAmount] = useState<string>('');
  const [isSwapConfirmOpen, setIsSwapConfirmOpen] = useState<boolean>(false);
  const [swapError, setSwapError] = useState<string>('');
  const [isSwapAndSend, setIsSwapAndSend] = useState<boolean>(false);
  const [customDestinationAddress, setCustomDestinationAddress] = useState<string>('');

  const [sourceToken, setSourceToken] = useState<XToken>({
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
    xChainId: '0x2105.base',
    address: '0x0000000000000000000000000000000000000000', // Native ETH on Base
  });

  const [destinationToken, setDestinationToken] = useState<XToken>({
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
    xChainId: 'solana',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
  });

  const sourceChainType = getXChainType(sourceToken.xChainId);
  const destinationChainType = getXChainType(destinationToken.xChainId);

  const { address: sourceAddress } = useXAccount(sourceChainType);
  const { address: destinationAddress } = useXAccount(destinationChainType);

  const sourceConnection = useXConnection(sourceChainType);
  const destinationConnection = useXConnection(destinationChainType);

  const isSourceChainConnected = !!sourceConnection;
  const isDestinationChainConnected = !!destinationConnection;

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

    // Debug logging
    console.log('Quote payload:', payload);
    console.log('Source token:', sourceToken);
    console.log('Destination token:', destinationToken);
    console.log('Source amount:', sourceAmount);

    return payload;
  }, [sourceToken, destinationToken, sourceAmount]);

  const quoteQuery = useQuote(quotePayload);

  // Debug logging for quote query
  useEffect(() => {
    console.log('Quote query state:', {
      isLoading: quoteQuery.isLoading,
      error: quoteQuery.error,
      data: quoteQuery.data,
    });
  }, [quoteQuery.isLoading, quoteQuery.error, quoteQuery.data]);

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

  // Calculate minimum output amount with slippage tolerance
  const minOutputAmount = useMemo(() => {
    if (quoteQuery.data?.ok && quoteQuery.data.value && calculatedDestinationAmount) {
      const slippageTolerance = 0.5;
      return new BigNumber(calculatedDestinationAmount)
        .multipliedBy(100 - slippageTolerance)
        .dividedBy(100)
        .toFixed(destinationToken.decimals, BigNumber.ROUND_DOWN);
    }
    return '';
  }, [quoteQuery.data, calculatedDestinationAmount, destinationToken.decimals]);

  useEffect(() => {
    setDestinationAmount(calculatedDestinationAmount);
  }, [calculatedDestinationAmount]);

  // Use the swap hook for actual swap execution
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

    // Check if user has sufficient balance
    const sourceAmountBigInt = scaleTokenAmount(sourceAmount, sourceToken.decimals);
    if (sourceAmountBigInt > sourceBalance) {
      return {
        text: 'Insufficient balance',
        disabled: true,
        action: 'insufficient-balance',
      };
    }

    // Check destination address based on toggle state
    if (isSwapAndSend) {
      // When toggle is ON, require custom destination address
      if (!customDestinationAddress || customDestinationAddress.trim() === '') {
        return {
          text: 'Enter destination address',
          disabled: true,
          action: 'enter-amount',
        };
      }
    } else {
      // When toggle is OFF, require connected destination wallet
      if (!destinationAddress) {
        return {
          text: 'Connect recipient',
          disabled: false,
          action: 'connect',
        };
      }
    }

    // Check if quote is loading or has error
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

  const handleOpenWalletModal = (): void => {
    const buttonState = getButtonState();

    if (buttonState.action === 'connect') {
      const targetChainType = getTargetChainType();
      openWalletModal(targetChainType);
    } else if (buttonState.action === 'review') {
      setIsSwapConfirmOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSourceAmount(e.target.value);
  };

  const handleMaxClick = (): void => {
    if (isSourceChainConnected) {
      setSourceAmount(normaliseTokenAmount(sourceBalance, sourceToken.decimals));
    }
  };

  const switchDirection = (): void => {
    // Swap source and destination tokens
    setSourceToken(destinationToken);
    setDestinationToken(sourceToken);

    // Clear amounts when switching
    setSourceAmount('');
    setDestinationAmount('');
  };

  const handleSwapConfirm = async (): Promise<void> => {
    try {
      setSwapError('');

      // Validate all required data
      if (!sourceProvider) {
        throw new Error('Source provider not available');
      }

      if (!sourceAddress) {
        throw new Error('Source address not available');
      }

      // Use custom destination address if toggle is enabled, otherwise use connected wallet address
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

      // Validate amounts
      if (sourceAmountBigInt <= 0n) {
        throw new Error('Invalid source amount');
      }

      if (quotedAmount <= 0n) {
        throw new Error('Invalid quoted amount');
      }

      // Check balance again before executing
      if (sourceAmountBigInt > sourceBalance) {
        throw new Error('Insufficient balance for swap');
      }

      // Calculate minimum output amount with slippage tolerance (0.5%)
      const slippageTolerance = 0.5;
      const minOutputAmount = new BigNumber(quotedAmount.toString())
        .multipliedBy(100 - slippageTolerance)
        .dividedBy(100)
        .toFixed(0, BigNumber.ROUND_DOWN);

      console.log('Executing swap:', {
        sourceToken,
        destinationToken,
        sourceAmount: sourceAmountBigInt.toString(),
        destinationAmount: quotedAmount.toString(),
        minOutputAmount,
        exchangeRate: exchangeRate?.toString(),
        sourceAddress,
        destinationAddress: finalDestinationAddress,
      });

      // Execute the actual swap
      const result = await executeSwap({
        inputToken: sourceToken.address,
        outputToken: destinationToken.address,
        inputAmount: sourceAmountBigInt,
        minOutputAmount: BigInt(minOutputAmount),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // 5 minutes from now
        allowPartialFill: false,
        srcChain: sourceToken.xChainId as SpokeChainId,
        dstChain: destinationToken.xChainId as SpokeChainId,
        srcAddress: sourceAddress,
        dstAddress: finalDestinationAddress,
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      });

      console.log('Swap result:', result);

      if (!result.ok) {
        throw new Error(`Swap execution failed: ${result.error?.code || 'Unknown error'}`);
      }

      // Manually invalidate balance queries to ensure immediate refresh
      queryClient.invalidateQueries({ queryKey: ['xBalances'] });

      // Dialog will handle its own completion state
      // Form will be reset when dialog closes
    } catch (error) {
      console.error('Swap execution failed:', error);
      setSwapError(error instanceof Error ? error.message : 'Swap failed. Please try again.');
    }
  };

  const handleDialogClose = (): void => {
    // Reset form when dialog is closed after completion
    setSourceAmount('');
    setDestinationAmount('');
    setSwapError('');
  };

  const buttonState = getButtonState();

  return (
    <div className="inline-flex flex-col justify-start items-start gap-(--layout-space-comfortable) w-full">
      <div className="inline-flex flex-col justify-start items-start gap-4">
        <div className="self-stretch mix-blend-multiply justify-end">
          <span className="text-yellow-dark text-(length:--app-title) font-bold font-['InterRegular'] leading-9">
            Swap{' '}
          </span>
          <span className="text-yellow-dark text-(length:--app-title) font-normal font-['Shrikhand'] leading-9">
            in seconds
          </span>
        </div>
        <div className="mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug !text-(size:--subtitle)">
          Access 438 assets across ## networks.
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
        />
      </div>

      {/* Quote Error Display */}
      {quoteQuery.data?.ok === false && (
        <div className="self-stretch px-8 py-6 bg-white rounded-[20px] inline-flex justify-between items-center">
          <div className="flex-1 inline-flex flex-col justify-center items-start gap-1">
            <div className="self-stretch justify-center text-espresso text-base font-bold font-['InterRegular'] leading-tight">
              Sorry, your transaction got stuck
            </div>
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

      {/* Quote Loading State */}
      {/* {quoteQuery.isLoading && sourceAmount && (
        <div className="self-stretch px-8 py-6 bg-white rounded-[20px] inline-flex justify-between items-center">
          <div className="flex-1 inline-flex flex-col justify-center items-start gap-1">
            <div className="self-stretch justify-center text-espresso text-base font-bold font-['InterRegular'] leading-tight">
              Getting quote...
            </div>
            <div className="self-stretch justify-center">
              <span className="text-clay text-base font-normal font-['InterRegular'] leading-tight">
                Please wait while we calculate the best rate for your swap.
              </span>
            </div>
          </div>
        </div>
      )} */}

      <Button
        variant="cherry"
        className="w-full md:w-[232px] text-(size:--body-comfortable) text-white"
        onClick={handleOpenWalletModal}
        disabled={buttonState.disabled}
      >
        {buttonState.text}
      </Button>

      {/* Swap Confirm Dialog */}
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
        isLoading={isSwapPending}
        slippageTolerance={0.5}
        estimatedGasFee="~$2.50"
        error={swapError}
        minOutputAmount={minOutputAmount}
        sourceAddress={sourceAddress}
        destinationAddress={isSwapAndSend && customDestinationAddress ? customDestinationAddress : destinationAddress}
        isSwapAndSend={isSwapAndSend}
      />
    </div>
  );
}
