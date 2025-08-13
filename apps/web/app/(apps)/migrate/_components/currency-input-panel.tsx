// apps/web/components/ui/network-input-display.tsx
import type React from 'react';
import { useEffect, useRef } from 'react';
import CurrencyLogoICX from './currency-logo-icx';
import CurrencyLogoSoda from './currency-logo-soda';
import { ICON_MAINNET_CHAIN_ID, type XToken, type SpokeChainId } from '@sodax/types';
import { NumberInput } from '@/components/ui/number-input';
import { Input } from '@/components/ui/input';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';

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
  className?: string;
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
  className = '',
}: CurrencyInputPanelProps) => {
  const formattedBalance = formatUnits(currencyBalance, currency.decimals);
  const formattedBalanceFixed = Number(formattedBalance).toFixed(2);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('inputRef', inputRef.current);
    if (type === CurrencyInputPanelType.INPUT && inputRef.current) {
      inputRef.current.focus();
    }
  }, [type]);

  return (
    <div
      className={`w-full relative rounded-3xl outline outline-4 outline-offset-[-4px] outline-cream-white inline-flex justify-between items-center hover:outline-6 group ${className}`}
      style={{ padding: 'var(--layout-space-comfortable) var(--layout-space-big)' }}
    >
      <div className="flex justify-start items-center gap-2">
        {chainId === ICON_MAINNET_CHAIN_ID ? (
          <CurrencyLogoICX className="group-hover:scale-106 transition-transform duration-200" />
        ) : (
          <CurrencyLogoSoda className="group-hover:scale-106 transition-transform duration-200" />
        )}

        <div className="inline-flex flex-col justify-center items-start gap-1">
          <div className="justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable) group-hover:text-clay">
            {type === CurrencyInputPanelType.INPUT ? 'From' : 'To'}
          </div>
          <div className="justify-center text-espresso font-['InterRegular'] leading-snug text-(size:--body-super-comfortable) inline-flex gap-1">
            {chainId === ICON_MAINNET_CHAIN_ID ? 'ICON' : 'SODA'}
            <span className="hidden md:inline">Network</span>
          </div>
        </div>
      </div>

      <div
        className="inline-flex flex-col justify-center items-end gap-1"
        style={{ paddingRight: 'var(--layout-space-normal)' }}
      >
        <div className="text-right justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)  group-hover:text-clay">
          {type === CurrencyInputPanelType.INPUT ? `${formattedBalanceFixed} available` : 'Receive'}
        </div>
        <div className="inline-flex gap-1 items-center">
          <div className="text-right justify-center text-espresso font-['InterRegular'] font-bold">
            <div className="relative">
              <Input
                type="number"
                ref={inputRef}
                value={inputValue === '' ? '' : Number(inputValue)}
                onChange={onInputChange}
                onFocus={onInputFocus}
                placeholder="0"
                className="text-right border-none shadow-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:border-none focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 !pr-0 focus:!text-espresso text-espresso !text-(size:--subtitle)"
                readOnly={type === CurrencyInputPanelType.OUTPUT}
              />
            </div>
          </div>
          <div className="text-right justify-center text-espresso font-['InterRegular'] font-normal text-(size:--body-super-comfortable)">
            {currency.symbol}
          </div>
          {type === CurrencyInputPanelType.INPUT && (
            <Button
              variant="cherry"
              className="h-4 px-2 mix-blend-multiply bg-cream-white rounded-[256px] inline-flex flex-col justify-center items-center gap-2"
              onClick={onMaxClick}
            >
              <div className="text-center justify-center text-clay text-[9px] font-bold font-['InterRegular'] uppercase leading-3">
                MAX
              </div>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrencyInputPanel;
