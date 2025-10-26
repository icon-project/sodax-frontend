'use client';

import type React from 'react';
import { useState, useMemo } from 'react';
import CurrencyInputPanel, { CurrencyInputPanelType } from './_components/currency-input-panel';
import SwapConfirmDialog from './_components/swap-confirm-dialog';
import { Button } from '@/components/ui/button';
import { SwitchDirectionIcon } from '@/components/icons/switch-direction-icon';
import { useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { useQuote, useSodaxContext } from '@sodax/dapp-kit';
import BigNumber from 'bignumber.js';
import type { QuoteType } from '@sodax/sdk';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { useSwapState, useSwapActions } from './_stores/swap-store-provider';
import { formatUnits, parseUnits } from 'viem';
import { ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';
import SwapReviewButton from './_components/swap-review-button';
import { calculateMaxAvailableAmount, formatBalance } from '@/lib/utils';

export default function SwapPage() {
  const { inputToken, outputToken, inputAmount, isSwapAndSend, customDestinationAddress, slippageTolerance } =
    useSwapState();

  const { setInputToken, setOutputToken, setInputAmount, setIsSwapAndSend, setCustomDestinationAddress, switchTokens } =
    useSwapActions();

  const [isSwapConfirmOpen, setIsSwapConfirmOpen] = useState<boolean>(false);
  // Fixed amounts for dialog - these don't change once dialog is open
  const [fixedOutputAmount, setFixedOutputAmount] = useState<bigint | undefined>(undefined);
  const [fixedMinOutputAmount, setFixedMinOutputAmount] = useState<bigint | undefined>(undefined);

  const { address: sourceAddress } = useXAccount(inputToken.xChainId);
  const { address: destinationAddress } = useXAccount(outputToken.xChainId);

  const isSourceChainConnected = sourceAddress !== undefined;
  const isDestinationChainConnected = destinationAddress !== undefined;

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
  const { data: outputTokenPrice } = useTokenPrice(outputToken);
  const calculatedOutputAmount = useMemo(() => {
    if (quoteQuery.data?.ok && quoteQuery.data.value) {
      return quoteQuery.data.value.quoted_amount;
    }
    return undefined;
  }, [quoteQuery.data]);

  const swapFees = useMemo(() => {
    if (!inputAmount || inputAmount === '' || Number.isNaN(Number(inputAmount)) || Number(inputAmount) <= 0) {
      return undefined;
    }

    if (!calculatedOutputAmount) {
      return undefined;
    }

    return {
      partner: new BigNumber(
        formatUnits(sodax.solver.getPartnerFee(parseUnits(inputAmount, inputToken.decimals)), inputToken.decimals),
      ),
      solver: new BigNumber(formatUnits(sodax.solver.getSolverFee(calculatedOutputAmount), outputToken.decimals)),
    };
  }, [inputAmount, calculatedOutputAmount, inputToken.decimals, outputToken.decimals, sodax.solver]);

  const { data: inputTokenPrice } = useTokenPrice(inputToken);
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
    if (calculatedOutputAmount) {
      return BigInt(
        new BigNumber(calculatedOutputAmount)
          .multipliedBy(100 - slippageTolerance)
          .dividedBy(100)
          .toFixed(0),
      );
    }
    return undefined;
  }, [calculatedOutputAmount, slippageTolerance]);

  const handleReview = async (): Promise<void> => {
    setFixedOutputAmount(calculatedOutputAmount);
    setFixedMinOutputAmount(minOutputAmount);
    setIsSwapConfirmOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputAmount(e.target.value);
  };

  const handleMaxClick = (): void => {
    if (isSourceChainConnected) {
      const maxAvailableAmount = calculateMaxAvailableAmount(sourceBalance, inputToken.decimals, sodax.solver);
      setInputAmount(formatBalance(maxAvailableAmount, inputTokenPrice || 0));
    }
  };

  const switchDirection = (): void => {
    switchTokens();
  };

  const handleDialogClose = (): void => {
    // Reset fixed amounts when dialog is closed
    setIsSwapConfirmOpen(false);
    setFixedOutputAmount(undefined);
    setFixedMinOutputAmount(undefined);
  };

  return (
    <div className="w-full">
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
            Access 66 assets across 12 networks.
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
              usdPrice={inputTokenPrice}
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
            inputValue={calculatedOutputAmount ? formatUnits(calculatedOutputAmount, outputToken.decimals) : undefined}
            onCurrencyChange={setOutputToken}
            isChainConnected={isDestinationChainConnected}
            isSwapAndSend={isSwapAndSend}
            onSwapAndSendToggle={setIsSwapAndSend}
            customDestinationAddress={customDestinationAddress}
            onCustomDestinationAddressChange={setCustomDestinationAddress}
            usdPrice={outputTokenPrice}
          />
        </div>

        <SwapReviewButton quoteQuery={quoteQuery} handleReview={handleReview} />
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
        sourceAddress={sourceAddress || ''}
        finalDestinationAddress={
          isSwapAndSend && customDestinationAddress ? customDestinationAddress : destinationAddress || ''
        }
        outputAmount={fixedOutputAmount}
        onClose={handleDialogClose}
        minOutputAmount={fixedMinOutputAmount}
        swapFeesUsdValue={swapFeesUsdValue}
        usdPrice={outputTokenPrice}
      />
    </div>
  );
}
