'use client';

import type React from 'react';
import { useState } from 'react';
import CurrencyInputPanel, { CurrencyInputPanelType } from './_components/currency-input-panel';
import { Button } from '@/components/ui/button';
import { SwitchDirectionIcon } from '@/components/icons/switch-direction-icon';
import type { XToken, SpokeChainId, ChainType } from '@sodax/types';
import { useWalletUI } from '../_context/wallet-ui';
import { useXAccount, useXBalances } from '@sodax/wallet-sdk';
import { getXChainType } from '@sodax/wallet-sdk';
import { chainIdToChainName } from '@/providers/constants';

export default function SwapPage() {
  const { openWalletModal } = useWalletUI();
  const [inputAmount, setInputAmount] = useState<string>('');

  const [inputCurrency, setInputCurrency] = useState<XToken>({
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
    xChainId: '0x2105.base',
    address: '0x0000000000000000000000000000000000000000',
  });

  const [outputCurrency, setOutputCurrency] = useState<XToken>({
    name: 'USDT',
    symbol: 'USDT',
    decimals: 18,
    xChainId: 'solana',
    address: '0x0000000000000000000000000000000000000000',
  });

  // Get wallet addresses for the chains
  const inputChainType = getXChainType(inputCurrency.xChainId);
  const outputChainType = getXChainType(outputCurrency.xChainId);

  const { address: inputAddress } = useXAccount(inputChainType);
  const { address: outputAddress } = useXAccount(outputChainType);

  // Fetch balances for input currency
  const { data: inputBalances } = useXBalances({
    xChainId: inputCurrency.xChainId,
    xTokens: [inputCurrency],
    address: inputAddress,
  });

  // Fetch balances for output currency
  const { data: outputBalances } = useXBalances({
    xChainId: outputCurrency.xChainId,
    xTokens: [outputCurrency],
    address: outputAddress,
  });

  // Get the actual balance values
  const inputBalance = inputBalances?.[inputCurrency.address] || 0n;
  const outputBalance = outputBalances?.[outputCurrency.address] || 0n;

  // Determine which chain needs to be connected and get target chain type
  const getTargetChainType = (): ChainType | undefined => {
    // Check if input chain is not connected
    if (!inputAddress) {
      return inputChainType;
    }

    // Check if output chain is not connected
    if (!outputAddress) {
      return outputChainType;
    }

    // Both chains are connected
    return undefined;
  };

  // Determine button text and state based on connection status and amount
  const getButtonState = (): { text: string; disabled: boolean; action: 'connect' | 'enter-amount' | 'review' } => {
    // Check if input chain is not connected
    if (!inputAddress) {
      return {
        text: `Connect to ${chainIdToChainName(inputCurrency.xChainId as SpokeChainId)}`,
        disabled: false,
        action: 'connect',
      };
    }

    // Check if input amount is not set
    if (!inputAmount || inputAmount === '0' || inputAmount === '') {
      return {
        text: 'Enter amount',
        disabled: true,
        action: 'enter-amount',
      };
    }

    // Check if output chain is not connected (user has source network connected + set amount)
    if (!outputAddress) {
      return {
        text: 'Connect recipient',
        disabled: false,
        action: 'connect',
      };
    }

    // All conditions met - ready for swap
    return {
      text: 'Review for swap',
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
      // TODO: Implement swap review logic
      console.log('Review swap logic here');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputAmount(e.target.value);
  };

  const handleMaxClick = (): void => {
    // TODO: Implement max amount logic
    console.log('Max amount clicked');
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
            chainId={inputCurrency.xChainId as SpokeChainId}
            currency={inputCurrency}
            currencyBalance={inputBalance}
            inputValue={inputAmount}
            onInputChange={handleInputChange}
            onMaxClick={handleMaxClick}
            onCurrencyChange={setInputCurrency}
          />

          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 left-1/2 bottom-[-22px] absolute transform -translate-x-1/2 bg-cream-white rounded-[256px] border-4 border-[#F5F2F2] flex justify-center items-center hover:bg-cherry-grey hover:outline-cherry-grey hover:scale-110 cursor-pointer transition-all duration-200 active:bg-cream-white z-50"
            // onClick={switchDirection}
          >
            <SwitchDirectionIcon className="w-4 h-4" />
          </Button>
        </div>

        <CurrencyInputPanel
          type={CurrencyInputPanelType.OUTPUT}
          chainId={outputCurrency.xChainId as SpokeChainId}
          currency={outputCurrency}
          currencyBalance={outputBalance}
          inputValue={''}
          onCurrencyChange={setOutputCurrency}
          // onInputChange={e => setTypedValue(e.target.value)}
        />
      </div>

      <Button
        variant="cherry"
        className="w-full md:w-[232px] text-(size:--body-comfortable) text-white"
        onClick={handleOpenWalletModal}
        disabled={buttonState.disabled}
      >
        {buttonState.text}
      </Button>
    </div>
  );
}
