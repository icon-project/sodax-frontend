// apps/web/components/ui/network-input-display.tsx
import type React from 'react';
import CurrencyLogoICX from './currency-logo-icx';
import CurrencyLogoSoda from './currency-logo-soda';
import { ICON_MAINNET_CHAIN_ID, XToken, type SpokeChainId } from '@sodax/types';
import { NumberInput } from '@/components/ui/number-input';
import { formatUnits } from 'viem';

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

  return (
    <div
      className={`w-full relative rounded-3xl outline outline-4 outline-offset-[-4px] outline-cream-white inline-flex justify-between items-center ${className}`}
      style={{ padding: 'var(--layout-space-comfortable) var(--layout-space-big)' }}
    >
      <div className="flex justify-start items-center gap-2">
        {chainId === ICON_MAINNET_CHAIN_ID ? <CurrencyLogoICX /> : <CurrencyLogoSoda />}

        <div className="inline-flex flex-col justify-center items-start gap-1">
          <div className="justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
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
        <div className="text-right justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
          {type === CurrencyInputPanelType.INPUT ? `${formattedBalanceFixed} available` : 'Receive'}
        </div>
        <div className="inline-flex gap-1 items-center">
          <div className="text-right justify-center text-espresso font-['InterRegular'] font-bold text-(size:--subtitle)">
            <div className="relative">
                <NumberInput
                  value={inputValue === '' ? 0 : Number(inputValue)}
                  onChange={onInputChange}
                  onFocus={onInputFocus}
                  placeholder="0"
                  className="text-right border-none shadow-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:border-none focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 !text-(size:--subtitle) !pr-0"
                />
            </div>
          </div>
          <div className="text-right justify-center text-espresso font-['InterRegular'] font-normal text-(size:--body-super-comfortable)">
            {currency.symbol}
          </div>
          {type === CurrencyInputPanelType.INPUT && (
            <button
              type="button"
              onClick={onMaxClick}
              className="ml-1 px-2 py-1 bg-cream-white text-clay rounded text-xs font-medium hover:bg-cherry-brighter hover:text-espresso active:bg-cream-white active:text-espresso disabled:bg-cream-white disabled:text-clay-light transition-colors duration-200 cursor-pointer font-['InterBold'] text-[9px] leading-[1.2] rounded-full h-4"
            >
              MAX
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrencyInputPanel;
