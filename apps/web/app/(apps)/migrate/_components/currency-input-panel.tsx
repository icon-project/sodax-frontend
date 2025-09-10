// apps/web/components/ui/network-input-display.tsx
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ICON_MAINNET_CHAIN_ID, type XToken, type SpokeChainId } from '@sodax/types';
import { Input } from '@/components/ui/input';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import CurrencyLogo from '@/components/shared/currency-logo';
import CanLogo from './can-logo';
import BnUSDChainSelector from './bnusd-chain-selector';
import { isLegacybnUSDToken, isNewbnUSDToken, spokeChainConfig } from '@sodax/sdk';
import { ChevronDownIcon } from '@/components/icons/chevron-down-icon';
import { getChainName } from '@/constants/chains';

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
  onChainSelect?: (chainId: SpokeChainId, token: XToken) => void;
  className?: string;
  isChainConnected?: boolean;
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
  onChainSelect,
  className = '',
  isChainConnected = false,
}: CurrencyInputPanelProps) => {
  const [isChainSelectorOpen, setIsChainSelectorOpen] = useState(false);
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

  const handleCurrencyAreaClick = (): void => {
    // Only show chain selector for bnUSD tokens
    if (isLegacybnUSDToken(currency) || isNewbnUSDToken(currency)) {
      setIsChainSelectorOpen(true);
    }
  };

  const handleChainSelect = (selectedChainId: SpokeChainId, selectedToken: XToken): void => {
    if (onChainSelect) {
      onChainSelect(selectedChainId, selectedToken);
    }
  };

  return (
    <div
      className={`w-full relative rounded-(--layout-container-radius) outline outline-[#e4dada] inline-flex justify-between items-center group ${className} outline-2 outline-offset-[-2px] hover:outline-4 hover:outline-offset-[-4px] sm:outline-3 sm:outline-offset-[-3px] sm:hover:outline-5 sm:hover:outline-offset-[-5px] md:outline-4 md:outline-offset-[-4px] md:hover:outline-6 md:hover:outline-offset-[-6px]`}
      style={{ padding: 'var(--layout-space-comfortable) var(--layout-space-big)' }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex justify-start items-center gap-4 cursor-pointer" onClick={handleCurrencyAreaClick}>
        {currency.xChainId === 'sonic' && (currency.symbol === 'SODA' || currency.symbol === 'bnUSD') ? (
          <CanLogo currency={currency} isChainConnected={isChainConnected} />
        ) : (
          <CurrencyLogo currency={currency} isChainConnected={isChainConnected} />
        )}

        <div className="inline-flex flex-col justify-center items-start gap-1">
          <div className="justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable) group-hover:text-clay">
            {type === CurrencyInputPanelType.INPUT ? 'From' : 'To'}
          </div>
          <div className="justify-center text-espresso font-['InterRegular'] leading-snug text-(size:--body-super-comfortable) inline-flex gap-1 items-center">
            {isLegacybnUSDToken(currency) || isNewbnUSDToken(currency)
              ? getChainName(chainId) || spokeChainConfig[chainId]?.chain?.name || 'Unknown'
              : chainId === ICON_MAINNET_CHAIN_ID
                ? 'ICON'
                : 'Sonic'}
            <span className="hidden md:inline">Network</span>
            {(isLegacybnUSDToken(currency) || isNewbnUSDToken(currency)) && <ChevronDownIcon className="w-4 h-4" />}
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
                className="text-right border-none shadow-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:border-none focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 !pr-0 focus:!text-espresso text-espresso !text-(size:--subtitle) font-['InterBold'] placeholder:text-espresso pt-[5px]"
                readOnly={type === CurrencyInputPanelType.OUTPUT}
              />
            </div>
          </div>
          <div className="text-right justify-center text-espresso font-['InterRegular'] font-normal text-(length:--body-super-comfortable) flex-none">
            {currency.symbol === 'bnUSD (legacy)'
              ? 'bnUSD'
              : currency.symbol === 'bnUSD'
                ? 'New bnUSD'
                : currency.symbol}
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

      <BnUSDChainSelector
        isOpen={isChainSelectorOpen}
        onClose={() => setIsChainSelectorOpen(false)}
        onChainSelect={handleChainSelect}
        currency={currency}
        type={type}
      />
    </div>
  );
};

export default CurrencyInputPanel;
