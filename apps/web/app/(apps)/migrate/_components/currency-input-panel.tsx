import type React from 'react';
import { useRef, useState } from 'react';
import { ICON_MAINNET_CHAIN_ID, type XToken, type SpokeChainId } from '@sodax/types';
import { Input } from '@/components/ui/input';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import CurrencyLogo from '@/components/shared/currency-logo';
import CanLogo from '@/components/shared/can-logo';
import BnUSDChainSelector from './bnusd-chain-selector';
import { isLegacybnUSDToken, isNewbnUSDToken, spokeChainConfig } from '@sodax/sdk';
import { ChevronDownIcon } from '@/components/icons/chevron-down-icon';
import { getChainName } from '@/constants/chains';
import BigNumber from 'bignumber.js';
import { useIsMobile } from '@/hooks/use-mobile';

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
  onMaxClick,
  onChainSelect,
  className = '',
  isChainConnected = false,
}: CurrencyInputPanelProps) => {
  const [isChainSelectorOpen, setIsChainSelectorOpen] = useState(false);
  const isMobile = useIsMobile();
  const isLegacyBnUSD = currency.symbol === 'bnUSD (legacy)';
  const isNewBnUSD = currency.symbol === 'bnUSD';
  const tokenLabel = isLegacyBnUSD ? 'OLD' : isNewBnUSD ? 'NEW' : null;
  const isBnUSD = isLegacyBnUSD || isNewBnUSD;

  const inputRef = useRef<HTMLInputElement>(null);

  const handleCurrencyAreaClick = (): void => {
    if (isMobile) return;
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
              ? getChainName(chainId)?.toUpperCase().includes('ICON')
                ? getChainName(chainId)?.toUpperCase()
                : getChainName(chainId) || spokeChainConfig[chainId]?.chain?.name || 'Unknown'
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
        <div className="text-right justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable) group-hover:text-clay">
          {type === CurrencyInputPanelType.INPUT ? (
            <>
              <span>
                {`${new BigNumber(formatUnits(currencyBalance, currency.decimals))
                  .decimalPlaces(2, BigNumber.ROUND_FLOOR)
                  .toFixed(2)} available`}
              </span>
              {isMobile && (
                <Button
                  variant="default"
                  size="tiny"
                  className="mix-blend-multiply bg-cream-white rounded-[256px] uppercase text-clay hover:bg-cherry-brighter hover:text-espresso active:bg-cream-white active:text-espresso ml-2 font-['InterBold'] text-[length:var(--body-tiny)]"
                  onClick={onMaxClick}
                >
                  MAX
                </Button>
              )}
            </>
          ) : (
            'Receive'
          )}
        </div>
        <div className="inline-flex items-baseline gap-1">
          <div className="text-right justify-center text-espresso font-['InterRegular'] font-bold">
            <div className="relative">
              <Input
                autoFocus={type === CurrencyInputPanelType.INPUT && !isMobile}
                type="number"
                ref={inputRef}
                value={inputValue === '' ? '' : Number(inputValue)}
                onChange={onInputChange}
                placeholder="0"
                className="text-right border-none shadow-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:border-none focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 !pr-0 focus:!text-espresso text-espresso !text-(size:--subtitle) font-['InterBold'] placeholder:text-espresso leading-none align-baseline
  translate-y-[2px] sm:translate-y-[1px] md:translate-y-[2px]"
                readOnly={type === CurrencyInputPanelType.OUTPUT}
              />
            </div>
          </div>
          <div className="text-right justify-center text-espresso font-['InterRegular'] font-normal text-(length:--body-super-comfortable) flex-none">
            <span className="inline-flex items-baseline leading-none relative top-[0.125rem]">
              <span className="font-['InterRegular']">{isBnUSD ? 'bnUSD' : currency.symbol}</span>
              {tokenLabel && (
                <span className="text-negative ml-[0.25rem] font-['InterBold'] text-(size:--body-tiny) relative -top-[0.125rem] leading-none">
                  {tokenLabel}
                </span>
              )}
            </span>
          </div>

          {type === CurrencyInputPanelType.INPUT && !isMobile && (
            <Button
              variant="default"
              size="tiny"
              className="mix-blend-multiply bg-cream-white rounded-[256px] uppercase text-clay hover:bg-cherry-brighter hover:text-espresso active:bg-cream-white active:text-espresso font-['InterBold'] ml-1 text-[length:var(--body-tiny)]"
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
