'use client';

import type React from 'react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import CurrencyInputPanel, { CurrencyInputPanelType } from './_components/currency-input-panel';
import SwapConfirmDialog from './_components/swap-confirm-dialog';
import { Button } from '@/components/ui/button';
import { SwitchDirectionIcon } from '@/components/icons/switch-direction-icon';
import type { SpokeChainId } from '@sodax/types';
import { useXAccount, useXBalances, useWalletProvider } from '@sodax/wallet-sdk-react';
import { useQuote, useSpokeProvider, useSwap, useStatus, useSodaxContext } from '@sodax/dapp-kit';
import BigNumber from 'bignumber.js';
import type { CreateIntentParams, QuoteType } from '@sodax/sdk';
import { SolverIntentStatusCode } from '@sodax/sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useTokenPrice, useTokenUsdValue } from '@/hooks/useTokenPrice';
import { useSwapState, useSwapActions } from './_stores/swap-store-provider';
import { formatUnits, parseUnits } from 'viem';
import { normaliseTokenAmount } from '../migrate/_utils/migration-utils';
import { getSwapErrorMessage } from '@/lib/utils';
import { ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';
import SwapCommitButton from './_components/swap-commit-button';

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
  const queryClient = useQueryClient();

  const { inputToken, outputToken, inputAmount, isSwapAndSend, customDestinationAddress, slippageTolerance } =
    useSwapState();

  const { setInputToken, setOutputToken, setInputAmount, setIsSwapAndSend, setCustomDestinationAddress, switchTokens } =
    useSwapActions();

  const [isSwapConfirmOpen, setIsSwapConfirmOpen] = useState<boolean>(false);
  const [swapError, setSwapError] = useState<{ title: string; message: string } | null>(null);
  const [isSwapSuccessful, setIsSwapSuccessful] = useState<boolean>(false);
  const [isSwapFailed, setIsSwapFailed] = useState<boolean>(false);
  const [dstTxHash, setDstTxHash] = useState<string>('');
  const [swapResetCounter, setSwapResetCounter] = useState<number>(0);
  // Fixed amounts for dialog - these don't change once dialog is open
  const [fixedOutputAmount, setFixedOutputAmount] = useState<string>('');
  const [fixedMinOutputAmount, setFixedMinOutputAmount] = useState<string>('');

  const handleSwapSuccessful = useCallback(() => {
    setIsSwapSuccessful(true);
    setIsSwapFailed(false);
  }, []);

  const handleSwapFailed = useCallback(() => {
    setIsSwapFailed(true);
    setIsSwapSuccessful(false);
    setSwapError({ title: 'Swap failed', message: 'Please try again.' });
  }, []);

  const [intentOrderPayload, setIntentOrderPayload] = useState<CreateIntentParams | undefined>(undefined);
  const { address: sourceAddress } = useXAccount(inputToken.xChainId);
  const { address: destinationAddress } = useXAccount(outputToken.xChainId);

  const isSourceChainConnected = sourceAddress !== undefined;
  const isDestinationChainConnected = destinationAddress !== undefined;

  const sourceWalletProvider = useWalletProvider(inputToken.xChainId);
  const sourceSpokeProvider = useSpokeProvider(inputToken.xChainId, sourceWalletProvider);

  const { data: sourceBalances } = useXBalances({
    xChainId: inputToken.xChainId,
    xTokens: [inputToken],
    address: sourceAddress,
  });

  const { data: destinationBalances } = useXBalances({
    xChainId: outputToken.xChainId,
    xTokens: [outputToken],
    address: destinationAddress,
  });

  const sourceBalance = sourceBalances?.[inputToken.address] || 0n;
  const destinationBalance = destinationBalances?.[outputToken.address] || 0n;

  const isWaitingForSolvedStatus = useMemo(() => {
    return !!dstTxHash && !isSwapFailed;
  }, [dstTxHash, isSwapFailed]);

  const sourceUsdValue = useTokenUsdValue(inputToken, inputAmount);
  const { sodax } = useSodaxContext();

  const quotePayload = useMemo(() => {
    if (
      !inputToken ||
      !outputToken ||
      !inputAmount ||
      inputAmount === '' ||
      Number.isNaN(Number(inputAmount)) ||
      Number(inputAmount) <= 0
    ) {
      return undefined;
    }

    const payload = {
      token_src: inputToken.address,
      token_src_blockchain_id: inputToken.xChainId,
      token_dst: outputToken.address,
      token_dst_blockchain_id: outputToken.xChainId,
      amount:
        parseUnits(inputAmount, inputToken.decimals) -
        sodax.solver.getPartnerFee(parseUnits(inputAmount, inputToken.decimals)),
      quote_type: 'exact_input' as QuoteType,
    };

    return payload;
  }, [inputToken, outputToken, inputAmount, sodax]);

  const quoteQuery = useQuote(quotePayload);

  const calculatedOutputAmount = useMemo(() => {
    if (quoteQuery.data?.ok && quoteQuery.data.value) {
      const quotedAmount = quoteQuery.data.value.quoted_amount;
      return normaliseTokenAmount(quotedAmount, outputToken.decimals);
    }
    return '';
  }, [quoteQuery.data, outputToken.decimals]);

  const destinationUsdValue = useTokenUsdValue(outputToken, calculatedOutputAmount);

  const exchangeRate = useMemo(() => {
    if (
      !inputAmount ||
      !calculatedOutputAmount ||
      inputAmount === '' ||
      calculatedOutputAmount === '' ||
      Number.isNaN(Number(inputAmount)) ||
      Number.isNaN(Number(calculatedOutputAmount)) ||
      Number(inputAmount) <= 0
    ) {
      return null;
    }

    try {
      return new BigNumber(calculatedOutputAmount).dividedBy(new BigNumber(inputAmount));
    } catch {
      return null;
    }
  }, [inputAmount, calculatedOutputAmount]);

  const swapFees = useMemo(() => {
    if (!inputAmount || inputAmount === '' || Number.isNaN(Number(inputAmount)) || Number(inputAmount) <= 0) {
      return undefined;
    }

    if (
      !calculatedOutputAmount ||
      calculatedOutputAmount === '' ||
      Number.isNaN(Number(calculatedOutputAmount)) ||
      Number(calculatedOutputAmount) <= 0
    ) {
      return undefined;
    }

    return {
      partner: new BigNumber(
        formatUnits(sodax.solver.getPartnerFee(parseUnits(inputAmount, inputToken.decimals)), inputToken.decimals),
      ),
      solver: new BigNumber(
        formatUnits(
          sodax.solver.getSolverFee(parseUnits(calculatedOutputAmount, outputToken.decimals)),
          outputToken.decimals,
        ),
      ),
    };
  }, [inputAmount, calculatedOutputAmount, inputToken.decimals, outputToken.decimals, sodax.solver]);

  const { data: inputTokenPrice } = useTokenPrice(inputToken);
  const { data: outputTokenPrice } = useTokenPrice(outputToken);
  const swapFeesUsdValue = useMemo(() => {
    if (!swapFees || !inputTokenPrice || !outputTokenPrice) {
      return undefined;
    }

    return {
      partner: swapFees.partner.multipliedBy(inputTokenPrice),
      solver: swapFees.solver.multipliedBy(outputTokenPrice),
      total: swapFees.partner.multipliedBy(inputTokenPrice).plus(swapFees.solver.multipliedBy(outputTokenPrice)),
    };
  }, [swapFees, inputTokenPrice, outputTokenPrice]);

  const minOutputAmount = useMemo(() => {
    if (quoteQuery.data?.ok && quoteQuery.data.value && calculatedOutputAmount) {
      return new BigNumber(calculatedOutputAmount)
        .multipliedBy(100 - slippageTolerance)
        .dividedBy(100)
        .toFixed(outputToken.decimals, BigNumber.ROUND_DOWN);
    }
    return '';
  }, [quoteQuery.data, calculatedOutputAmount, outputToken.decimals, slippageTolerance]);

  const { mutateAsync: executeSwap, isPending: isSwapPending } = useSwap(sourceSpokeProvider);

  const createIntentOrderPayload = () => {
    if (!inputToken || !outputToken) {
      console.error('SOURCE_TOKEN_OR_DEST_TOKEN_UNDEFINED');
      return;
    }

    if (!minOutputAmount || minOutputAmount === '') {
      console.error('MIN_OUTPUT_AMOUNT_UNDEFINED');
      return;
    }

    if (!sourceAddress) {
      console.error('SOURCE_ACCOUNT_ADDRESS_UNDEFINED');
      return;
    }

    if (!destinationAddress) {
      console.error('DESTINATION_ACCOUNT_ADDRESS_UNDEFINED');
      return;
    }

    if (!sourceSpokeProvider) {
      console.error('sourceSpokeProvider or destProvider undefined');
      return;
    }

    const createIntentParams = {
      inputToken: inputToken.address, // The address of the input token on hub chain
      outputToken: outputToken.address, // The address of the output token on hub chain
      inputAmount: parseUnits(inputAmount, inputToken.decimals), // The amount of input tokens
      minOutputAmount: BigInt(Number(minOutputAmount).toFixed(0)), // The minimum amount of output tokens to accept
      deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // Optional timestamp after which intent expires (0 = no deadline)
      allowPartialFill: false, // Whether the intent can be partially filled
      srcChain: inputToken.xChainId as SpokeChainId, // Chain ID where input tokens originate
      dstChain: outputToken.xChainId as SpokeChainId, // Chain ID where output tokens should be delivered
      srcAddress: sourceAddress, // Source address (original address on spoke chain)
      dstAddress: destinationAddress, // Destination address (original address on spoke chain)
      solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
      data: '0x', // Additional arbitrary data
    } satisfies CreateIntentParams;

    setIntentOrderPayload(createIntentParams);
  };

  useEffect(() => {
    if (intentOrderPayload != null) {
      setIsSwapConfirmOpen(true);
    }
  }, [intentOrderPayload]);

  const handleReview = async (): Promise<void> => {
    setFixedOutputAmount(calculatedOutputAmount);
    setFixedMinOutputAmount(minOutputAmount);
    createIntentOrderPayload();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputAmount(e.target.value);
  };

  const handleMaxClick = (): void => {
    if (isSourceChainConnected) {
      const maxAvailableAmount = calculateMaxAvailableAmount(sourceBalance, inputToken.decimals, sodax.solver);
      setInputAmount(maxAvailableAmount);
    }
  };

  const switchDirection = (): void => {
    switchTokens();
  };

  const handleSwapConfirm = async (): Promise<void> => {
    try {
      setSwapError(null);
      setIsSwapSuccessful(false);
      setSwapResetCounter(prev => prev + 1);

      if (!sourceSpokeProvider) {
        throw new Error('SOURCE_PROVIDER_NOT_AVAILABLE');
      }

      if (!sourceAddress) {
        throw new Error('SOURCE_ADDRESS_NOT_AVAILABLE');
      }

      const finalDestinationAddress =
        isSwapAndSend && customDestinationAddress ? customDestinationAddress : destinationAddress;

      if (!finalDestinationAddress) {
        throw new Error('DESTINATION_ADDRESS_NOT_AVAILABLE');
      }

      if (!quoteQuery.data?.ok || !quoteQuery.data.value) {
        throw new Error('QUOTE_NOT_AVAILABLE');
      }

      const quotedAmount = quoteQuery.data.value.quoted_amount;
      const inputAmountBigInt = parseUnits(inputAmount, inputToken.decimals);

      if (inputAmountBigInt <= 0n) {
        throw new Error('INVALID_SOURCE_AMOUNT');
      }

      if (quotedAmount <= 0n) {
        throw new Error('INVALID_QUOTED_AMOUNT');
      }

      if (!hasSufficientBalanceWithFee(inputAmount, sourceBalance, inputToken.decimals, sodax.solver)) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      const minOutputAmount = new BigNumber(quotedAmount.toString())
        .multipliedBy(100 - slippageTolerance)
        .dividedBy(100)
        .toFixed(0, BigNumber.ROUND_DOWN);

      const result = await executeSwap({
        inputToken: inputToken.address,
        outputToken: outputToken.address,
        inputAmount: inputAmountBigInt,
        minOutputAmount: BigInt(minOutputAmount),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5),
        allowPartialFill: false,
        srcChain: inputToken.xChainId as SpokeChainId,
        dstChain: outputToken.xChainId as SpokeChainId,
        srcAddress: sourceAddress,
        dstAddress: finalDestinationAddress,
        solver: '0x0000000000000000000000000000000000000000',
        data: '0x',
      });

      if (!result.ok) {
        const errorMessage = getSwapErrorMessage(result.error?.code || 'UNKNOWN');
        setSwapError(errorMessage);
        setDstTxHash('');
        return;
      }

      const [, , intentDeliveryInfo] = result.value;
      setDstTxHash(intentDeliveryInfo.dstTxHash);
      setSwapStatus(SolverIntentStatusCode.NOT_STARTED_YET);
      queryClient.invalidateQueries({ queryKey: ['xBalances'] });
    } catch (error) {
      const errorMessage = getSwapErrorMessage(error instanceof Error ? error.message : 'UNKNOWN');
      setSwapError(errorMessage);
      setDstTxHash('');
    }
  };

  const handleDialogClose = (): void => {
    setSwapError(null);
    setIsSwapSuccessful(false);
    setIsSwapFailed(false);
    setDstTxHash('');
    setSwapResetCounter(prev => prev + 1);
    // Reset fixed amounts when dialog is closed
    setIsSwapConfirmOpen(false);
    setFixedOutputAmount('');
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
          <div className="mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug !text-(length:--subtitle)">
            Access 53 assets across 11 networks.
          </div>
        </div>

        <div className="inline-flex flex-col justify-start items-start gap-2 w-full">
          <div className="relative w-full">
            <CurrencyInputPanel
              type={CurrencyInputPanelType.INPUT}
              currency={inputToken}
              currencyBalance={isSourceChainConnected ? sourceBalance : 0n}
              inputValue={inputAmount}
              onInputChange={handleInputChange}
              onMaxClick={handleMaxClick}
              onCurrencyChange={setInputToken}
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
            currency={outputToken}
            currencyBalance={isDestinationChainConnected ? destinationBalance : 0n}
            inputValue={calculatedOutputAmount}
            onCurrencyChange={setOutputToken}
            isChainConnected={isDestinationChainConnected}
            isSwapAndSend={isSwapAndSend}
            onSwapAndSendToggle={setIsSwapAndSend}
            customDestinationAddress={customDestinationAddress}
            onCustomDestinationAddressChange={setCustomDestinationAddress}
            usdValue={destinationUsdValue}
          />
        </div>

        <SwapCommitButton quoteQuery={quoteQuery} handleReview={handleReview} />
      </div>

      {quoteQuery.data?.ok === false ? (
        <div className="mt-(--layout-space-comfortable) text-clay-light text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight flex gap-1 items-center">
          Need help?
          <Link
            href="https://x.com/sodaxlabs"
            target="_blank"
            className="flex gap-1 hover:font-bold text-clay items-center leading-[1.4]"
          >
            Get support on Discord <ExternalLinkIcon className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        sourceAddress && (
          <div className="mt-3 text-clay-light font-['InterRegular'] leading-tight text-(length:--body-comfortable)">
            Takes ~1 min · Total fees: {swapFeesUsdValue?.total && `$${swapFeesUsdValue?.total.toFixed(4)}`}
          </div>
        )
      )}
      <SwapConfirmDialog
        open={isSwapConfirmOpen}
        inputToken={inputToken}
        outputToken={outputToken}
        finalDestinationAddress={
          isSwapAndSend && customDestinationAddress ? customDestinationAddress : destinationAddress || ''
        }
        outputAmount={isSwapConfirmOpen && fixedOutputAmount ? fixedOutputAmount : calculatedOutputAmount}
        exchangeRate={exchangeRate}
        onConfirm={handleSwapConfirm}
        onClose={handleDialogClose}
        isSwapPending={isSwapPending}
        isLoading={isWaitingForSolvedStatus}
        slippageTolerance={slippageTolerance}
        error={swapError || undefined}
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
