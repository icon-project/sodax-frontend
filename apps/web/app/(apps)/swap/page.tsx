'use client';

import type React from 'react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import CurrencyInputPanel, { CurrencyInputPanelType } from './_components/currency-input-panel';
import SwapConfirmDialog from './_components/swap-confirm-dialog';
import { Button } from '@/components/ui/button';
import { SwitchDirectionIcon } from '@/components/icons/switch-direction-icon';
import type { SpokeChainId, ChainType } from '@sodax/types';
import { useEvmSwitchChain, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { getXChainType } from '@sodax/wallet-sdk-react';
import { chainIdToChainName } from '@/providers/constants';
import { useQuote, useSpokeProvider, useSwap, useStatus, useSodaxContext } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import BigNumber from 'bignumber.js';
import type { CreateIntentParams, QuoteType } from '@sodax/sdk';
import { SolverIntentStatusCode } from '@sodax/sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useTokenPrice, useTokenUsdValue } from '@/hooks/useTokenPrice';
import { useSwapState, useSwapActions } from './_stores/swap-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { useModalStore } from '@/stores/modal-store-provider';
import { formatUnits, parseUnits } from 'viem';
import { normaliseTokenAmount } from '../migrate/_utils/migration-utils';
import { convertSegmentPathToStaticExportFilename } from 'next/dist/shared/lib/segment-cache/segment-value-encoding';

const calculateMaxAvailableAmount = (
  balance: bigint,
  tokenDecimals: number,
  solver: { getPartnerFee: (amount: bigint) => bigint },
): string => {
  if (balance === 0n) {
    return '0';
  }

  try {
    const fullBalance = normaliseTokenAmount(balance, tokenDecimals);
    const fullBalanceBigInt = parseUnits(fullBalance, tokenDecimals);
    const feeAmount = solver.getPartnerFee(fullBalanceBigInt);

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
  solver: { getPartnerFee: (amount: bigint) => bigint },
): boolean => {
  if (!amount || amount === '0' || amount === '' || Number.isNaN(Number(amount))) {
    return false;
  }

  try {
    const amountBigInt = parseUnits(amount, tokenDecimals);
    const feeAmount = solver.getPartnerFee(amountBigInt);
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
  onUpdateSwapStatus: (statusCode: SolverIntentStatusCode) => void;
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
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceToken.xChainId);
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
  const [switchChainLoading, setSwitchChainLoading] = useState<boolean>(false);

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

  const sourceUsdValue = useTokenUsdValue(sourceToken, sourceAmount);

  const { sodax } = useSodaxContext();

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
      amount:
        parseUnits(sourceAmount, sourceToken.decimals) -
        sodax.solver.getPartnerFee(parseUnits(sourceAmount, sourceToken.decimals)),
      quote_type: 'exact_input' as QuoteType,
    };

    return payload;
  }, [sourceToken, destinationToken, sourceAmount, sodax]);

  const quoteQuery = useQuote(quotePayload);

  const calculatedDestinationAmount = useMemo(() => {
    if (quoteQuery.data?.ok && quoteQuery.data.value) {
      const quotedAmount = quoteQuery.data.value.quoted_amount;
      return normaliseTokenAmount(quotedAmount, destinationToken.decimals);
    }
    return '';
  }, [quoteQuery.data, destinationToken.decimals]);

  const destinationUsdValue = useTokenUsdValue(destinationToken, calculatedDestinationAmount);

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

  const swapFees = useMemo(() => {
    if (!sourceAmount || sourceAmount === '' || Number.isNaN(Number(sourceAmount)) || Number(sourceAmount) <= 0) {
      return undefined;
    }

    if (
      !calculatedDestinationAmount ||
      calculatedDestinationAmount === '' ||
      Number.isNaN(Number(calculatedDestinationAmount)) ||
      Number(calculatedDestinationAmount) <= 0
    ) {
      return undefined;
    }

    return {
      partner: new BigNumber(
        formatUnits(sodax.solver.getPartnerFee(parseUnits(sourceAmount, sourceToken.decimals)), sourceToken.decimals),
      ),
      solver: new BigNumber(
        formatUnits(
          sodax.solver.getSolverFee(parseUnits(calculatedDestinationAmount, destinationToken.decimals)),
          destinationToken.decimals,
        ),
      ),
    };
  }, [sourceAmount, calculatedDestinationAmount, sourceToken.decimals, destinationToken.decimals, sodax.solver]);

  const { data: sourceTokenPrice } = useTokenPrice(sourceToken);
  const { data: destinationTokenPrice } = useTokenPrice(destinationToken);
  const swapFeesUsdValue = useMemo(() => {
    if (!swapFees || !sourceTokenPrice || !destinationTokenPrice) {
      return undefined;
    }

    return {
      partner: swapFees.partner.multipliedBy(sourceTokenPrice),
      solver: swapFees.solver.multipliedBy(destinationTokenPrice),
      total: swapFees.partner.multipliedBy(sourceTokenPrice).plus(swapFees.solver.multipliedBy(destinationTokenPrice)),
    };
  }, [swapFees, sourceTokenPrice, destinationTokenPrice]);

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

  const createIntentOrderPayload = () => {
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
    openModal(MODAL_ID.WALLET_MODAL, { primaryChainType: getTargetChainType() });
  };

  //When switch cahin, sometimes it takes a while to get vlaue of sourceProvider

  useEffect(() => {
    if (sourceProvider !== undefined) {
      setSwitchChainLoading(false);
    }
  }, [sourceProvider]);

  const handleClickReview = async (): Promise<void> => {
    if (isWrongChain) {
      setSwitchChainLoading(true);
      handleSwitchChain();
      return;
    }

    setFixedDestinationAmount(calculatedDestinationAmount);
    setFixedMinOutputAmount(minOutputAmount);
    createIntentOrderPayload();
    setIsSwapConfirmOpen(true);
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
      setSwapStatus(SolverIntentStatusCode.NOT_STARTED_YET);
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

  const [swapStatus, setSwapStatus] = useState<SolverIntentStatusCode>(SolverIntentStatusCode.NOT_FOUND);
  const handleUpdateSwapStatus = (statusCode: SolverIntentStatusCode) => {
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

        {isSourceChainConnected && (isDestinationChainConnected || isSwapAndSend) ? (
          <Button
            variant="cherry"
            className="w-full md:w-[232px] text-(size:--body-comfortable) text-white"
            onClick={handleClickReview}
            disabled={
              sourceAmount === '0' ||
              sourceAmount === '' ||
              (isSwapAndSend && customDestinationAddress === '') ||
              switchChainLoading
            }
          >
            {sourceAmount === '0' || sourceAmount === ''
              ? 'Enter amount'
              : isSwapAndSend && customDestinationAddress === ''
                ? 'Enter destination address'
                : isWrongChain
                  ? `Switch to ${chainIdToChainName(sourceToken.xChainId)}`
                  : switchChainLoading
                    ? 'Switching...'
                    : 'Review'}
          </Button>
        ) : (
          <Button
            variant="cherry"
            className="w-full md:w-[232px] text-(size:--body-comfortable) text-white"
            onClick={handleOpenWalletModal}
          >
            Connect{' '}
            {!isSourceChainConnected
              ? chainIdToChainName(sourceToken.xChainId)
              : !isSwapAndSend
                ? chainIdToChainName(destinationToken.xChainId)
                : ''}
          </Button>
        )}
      </div>

      {sourceAddress && (
        <div className="mt-3 text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
          Takes ~1 min · Total fees: {swapFeesUsdValue?.total && `$${swapFeesUsdValue?.total.toFixed(4)}`}
        </div>
      )}

      <SwapConfirmDialog
        open={isSwapConfirmOpen}
        onOpenChange={setIsSwapConfirmOpen}
        sourceToken={sourceToken}
        destinationToken={destinationToken}
        finalDestinationAddress={
          isSwapAndSend && customDestinationAddress ? customDestinationAddress : destinationAddress || ''
        }
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
        swapFeesUsdValue={swapFeesUsdValue}
        swapStatus={swapStatus}
      />
    </div>
  );
}
