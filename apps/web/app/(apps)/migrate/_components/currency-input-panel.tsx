// apps/web/components/ui/network-input-display.tsx
import type React from 'react';
import { useEffect, useRef } from 'react';
import { ICON_MAINNET_CHAIN_ID, type XToken, type SpokeChainId } from '@sodax/types';
import { Input } from '@/components/ui/input';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import CurrencyLogo from '@/components/shared/currency-logo';
import Image from 'next/image';

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
  const formattedBalanceFixed = Number(formattedBalance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (type === CurrencyInputPanelType.INPUT && inputRef.current) {
      inputRef.current.focus();
    }
  }, [type]);

  return (
    <div
      className={`w-full relative rounded-3xl outline outline-4 outline-offset-[-4px] outline-[#e4dada] inline-flex justify-between items-center hover:outline-6 hover:outline-offset-[-6px] group ${className}`}
      style={{ padding: 'var(--layout-space-comfortable) var(--layout-space-big)' }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex justify-start items-center gap-4">
        {currency.symbol === 'SODA' ? (
          <Image src="/can.png" alt="SODA Token" width={56} height={56} className="mx-1" />
        ) : (
          <CurrencyLogo currency={currency} />
        )}

        <div className="inline-flex flex-col justify-center items-start gap-1">
          <div className="justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable) group-hover:text-clay">
            {type === CurrencyInputPanelType.INPUT ? 'From' : 'To'}
          </div>
          <div className="justify-center text-espresso font-['InterRegular'] leading-snug text-(size:--body-super-comfortable) inline-flex gap-1">
            {chainId === ICON_MAINNET_CHAIN_ID ? 'ICON' : 'Sonic'}
            <span className="hidden md:inline">Network</span>
          </div>
        </div>
      </div>

      <div
        className="inline-flex flex-col justify-center items-end"
        style={{ paddingRight: 'var(--layout-space-normal)' }}
      >
        <div className="text-right justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)  group-hover:text-clay">
          {type === CurrencyInputPanelType.INPUT
            ? `${formattedBalance === '0' ? '0' : formattedBalanceFixed} available`
            : 'Receive'}
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
                className="text-right border-none shadow-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:border-none focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 !pr-0 focus:!text-espresso text-espresso !text-(size:--subtitle) font-['InterBold'] leading-[1.2] placeholder:text-espresso"
                readOnly={type === CurrencyInputPanelType.OUTPUT}
              />
            </div>
          </div>
          <div className="text-right justify-center text-espresso font-['InterRegular'] font-normal text-(length:--body-super-comfortable) leading-[1.4]">
            {currency.symbol}
          </div>
          {type === CurrencyInputPanelType.INPUT && (
            <Button
              variant="default"
              className="h-4 px-2 mix-blend-multiply bg-cream-white rounded-[256px] text-[9px] font-bold font-['InterRegular'] uppercase text-clay hover:bg-cherry-brighter hover:text-espresso active:bg-cream-white active:text-espresso"
              onClick={onMaxClick}
            >
              MAX
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrencyInputPanel;
