import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ICON_MAINNET_CHAIN_ID, type XToken, type SpokeChainId } from '@sodax/types';
import { Input } from '@/components/ui/input';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import CurrencyLogo from '@/components/shared/currency-logo';
import { ChevronDownIcon } from '@/components/icons/chevron-down-icon';
import TokenSelectDialog from './token-select-modal';

export enum CurrencyInputPanelType {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

interface CurrencyInputPanelProps {
  type: CurrencyInputPanelType;
  chainId: SpokeChainId;
  currency: XToken;
  currencyBalance: bigint;
  inputValue?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputFocus?: () => void;
  onMaxClick?: () => void;
  onCurrencyChange?: (currency: XToken) => void;
  className?: string;
  isChainConnected?: boolean;
  isSwapAndSend?: boolean;
  onSwapAndSendToggle?: (enabled: boolean) => void;
  customDestinationAddress?: string;
  onCustomDestinationAddressChange?: (address: string) => void;
}

const CurrencyInputPanel: React.FC<CurrencyInputPanelProps> = ({
  type,
  chainId,
  currency,
  currencyBalance,
  inputValue = '',
  onInputChange,
  onInputFocus,
  onMaxClick,
  onCurrencyChange,
  className = '',
  isChainConnected = true,
  isSwapAndSend = false,
  onSwapAndSendToggle,
  customDestinationAddress = '',
  onCustomDestinationAddressChange,
}: CurrencyInputPanelProps) => {
  const formattedBalance = formatUnits(currencyBalance, currency.decimals);
  const formattedBalanceFixed = Number(formattedBalance).toFixed(2);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState<boolean>(false);

  useEffect(() => {
    console.log('inputRef', inputRef.current);
    if (type === CurrencyInputPanelType.INPUT && inputRef.current) {
      inputRef.current.focus();
    }
  }, [type]);

  const handleTokenSelect = (selectedToken: XToken): void => {
    if (onCurrencyChange) {
      onCurrencyChange(selectedToken);
    }
  };

  return (
    <div
      className={`w-full relative rounded-3xl outline outline-4 outline-offset-[-4px] outline-cream-white justify-between items-center hover:outline-6 group ${className}`}
      style={{ padding: 'var(--layout-space-comfortable) var(--layout-space-big)' }}
    >
      <div className="flex inline-flex gap-2 w-full">
        <div className="inline-flex justify-start items-center gap-4">
          <CurrencyLogo className="group-hover:scale-106 transition-transform duration-200" currency={currency} />
          <div className="inline-flex flex-col justify-center items-start gap-1">
            <div
              className="inline-flex justify-start items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsTokenSelectorOpen(true)}
            >
              <div className="justify-center text-espresso text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-snug">
                {currency.symbol}
              </div>
              <ChevronDownIcon className="w-4 h-4" />
            </div>
            {isChainConnected && (
              <div className="inline-flex justify-start items-center gap-2">
                <div className="mix-blend-multiply justify-center text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] flex">
                  <span className="inline">Balance:{'  '}</span>
                  <span className="inline">{formattedBalanceFixed}</span>
                </div>
                {type === CurrencyInputPanelType.INPUT && (
                  <Button
                    variant="default"
                    className="h-4 px-2 mix-blend-multiply bg-cream-white rounded-[256px] text-[9px] font-bold font-['InterRegular'] uppercase text-clay -mt-[2px] hover:bg-cherry-brighter hover:text-espresso active:bg-cream-white active:text-espresso"
                    onClick={onMaxClick}
                  >
                    MAX
                  </Button>
                )}
              </div>
            )}

            {type === CurrencyInputPanelType.OUTPUT && onSwapAndSendToggle && (
              <div className="inline-flex justify-start items-center gap-2 w-[40px] md:w-[150px]">
                <span className="text-clay-light text-(length:--body-comfortable) font-medium font-['InterRegular'] hidden md:block">
                  Swap and send
                </span>
                <Switch
                  checked={isSwapAndSend}
                  onCheckedChange={onSwapAndSendToggle}
                  className="data-[state=checked]:bg-cherry-brighter cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        <div className="h-12 pr-6 inline-flex flex-col justify-center items-end gap-1">
          <div className="text-right justify-center text-espresso font-normal font-['InterRegular'] leading-relaxed">
            <Input
              type="number"
              ref={inputRef}
              value={inputValue === '' ? '' : Number(inputValue)}
              onChange={onInputChange}
              onFocus={onInputFocus}
              placeholder="0"
              className="!text-2xl text-right border-none shadow-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:border-none focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 !pr-0 focus:!text-espresso text-espresso"
              readOnly={type === CurrencyInputPanelType.OUTPUT}
            />
          </div>
          <div className="mix-blend-multiply text-right justify-center text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-none">
            Sell $0
          </div>
        </div>
      </div>

      {type === CurrencyInputPanelType.OUTPUT && isSwapAndSend && onCustomDestinationAddressChange && (
        <div className="inline-flex justify-start items-center gap-2 mt-2 w-full">
          <Input
            type="text"
            placeholder="Enter destination address"
            value={customDestinationAddress}
            onChange={e => onCustomDestinationAddressChange(e.target.value)}
            className="flex-1 text-(length:--body-small) border-cream-white focus:border-cherry-brighter rounded-full border-4 px-8 py-3 shadow-none focus:shadow-none focus-visible:border-4 focus:outline-none focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
          />
        </div>
      )}

      <TokenSelectDialog
        isOpen={isTokenSelectorOpen}
        onClose={() => setIsTokenSelectorOpen(false)}
        onTokenSelect={handleTokenSelect}
      />
    </div>
  );
};

export default CurrencyInputPanel;
