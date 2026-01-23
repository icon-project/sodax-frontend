import { useMemo } from 'react';
import { useRef, useState } from 'react';
import type { XToken } from '@sodax/types';
import { Input } from '@/components/ui/input';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import CurrencyLogo from '@/components/shared/currency-logo';
import { ChevronDownIcon } from '@/components/icons/chevron-down-icon';
import TokenSelectDialog from './token-select-dialog';
import { useSwapState } from '../_stores/swap-store-provider';
import { formatBalance, validateChainAddress } from '@/lib/utils';
import { getXChainType } from '@sodax/wallet-sdk-react';
import BigNumber from 'bignumber.js';
import { useValidateStellarTrustline } from '@/hooks/useValidateStellarTrustline';
import { useValidateStellarAccount } from '@/hooks/useValidateStellarAccount';
import { STELLAR_MAINNET_CHAIN_ID } from '@sodax/types';
import { useIsMobile } from '@/hooks/use-mobile';

export enum CurrencyInputPanelType {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

interface CurrencyInputPanelProps {
  type: CurrencyInputPanelType;
  currency: XToken;
  currencyBalance: bigint;
  inputValue?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxClick?: () => void;
  onCurrencyChange?: (currency: XToken) => void;
  className?: string;
  isChainConnected?: boolean;
  isSwapAndSend?: boolean;
  onSwapAndSendToggle?: (enabled: boolean) => void;
  customDestinationAddress?: string;
  onCustomDestinationAddressChange?: (address: string) => void;
  usdPrice?: number;
}

const CurrencyInputPanel: React.FC<CurrencyInputPanelProps> = ({
  type,
  currency,
  currencyBalance,
  inputValue = '',
  onInputChange,
  onMaxClick,
  onCurrencyChange,
  className = '',
  isChainConnected = false,
  isSwapAndSend = false,
  onSwapAndSendToggle,
  customDestinationAddress = '',
  onCustomDestinationAddressChange,
  usdPrice = 0,
}: CurrencyInputPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState<boolean>(false);
  const [isValidAddress, setIsValidAddress] = useState<boolean>(false);
  const { outputToken } = useSwapState();

  const handleTokenSelect = (selectedToken: XToken): void => {
    if (onCurrencyChange) {
      onCurrencyChange(selectedToken);
    }
  };

  const handleChange = (value: string): void => {
    if (validateChainAddress(value, getXChainType(outputToken.xChainId) || '')) {
      setIsValidAddress(true);
    } else {
      setIsValidAddress(false);
    }

    if (onCustomDestinationAddressChange) {
      onCustomDestinationAddressChange(value);
    }
  };

  const usdValue = useMemo(() => {
    return inputValue === '' ? 0 : new BigNumber(inputValue).multipliedBy(usdPrice).toFixed(2);
  }, [inputValue, usdPrice]);

  const { data: stellarAccountValidation } = useValidateStellarAccount(
    isSwapAndSend && outputToken.xChainId === STELLAR_MAINNET_CHAIN_ID ? customDestinationAddress : null,
  );
  const { data: stellarTrustlineValidation } = useValidateStellarTrustline(
    isSwapAndSend && outputToken.xChainId === STELLAR_MAINNET_CHAIN_ID ? customDestinationAddress : null,
    outputToken,
  );

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (isMobile) return;
    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && !target.closest('input')) {
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className={`w-full relative rounded-(--layout-container-radius) outline-[#e4dada] justify-between items-center group ${className} outline-2 outline-offset-[-2px] hover:outline-4 hover:outline-offset-[-4px] sm:outline-3 sm:outline-offset-[-3px] sm:hover:outline-5 sm:hover:outline-offset-[-5px] md:outline-4 md:outline-offset-[-4px] md:hover:outline-6 md:hover:outline-offset-[-6px]`}
      style={{ padding: 'var(--layout-space-comfortable) var(--layout-space-big)' }}
      onClick={handleContainerClick}
    >
      <div className="inline-flex justify-between w-full">
        <div className="inline-flex justify-start items-center gap-(--layout-space-small)">
          <div className="cursor-pointer" onClick={() => setIsTokenSelectorOpen(true)}>
            <CurrencyLogo
              className="group-hover:scale-106 transition-transform duration-200"
              currency={currency}
              isChainConnected={isChainConnected}
            />
          </div>
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
                <div className="mix-blend-multiply text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] flex gap-1">
                  <span className="hidden sm:inline">Balance:</span>
                  <span className="inline">
                    {formatBalance(formatUnits(currencyBalance, currency.decimals), usdPrice)}
                  </span>
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
            {!isChainConnected && type === CurrencyInputPanelType.INPUT && (
              <div className="mix-blend-multiply text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] flex gap-1">
                <span className="text-(length:--body-comfortable) whitespace-nowrap">Wallet not connected</span>
              </div>
            )}

            {type === CurrencyInputPanelType.OUTPUT && onSwapAndSendToggle && (
              <div className="inline-flex justify-start items-center gap-2 w-32 md:w-[150px]">
                <span className="text-clay-light text-(length:--body-comfortable) font-medium font-['InterRegular']">
                  Swap and send
                </span>
                <Switch
                  checked={isSwapAndSend}
                  onCheckedChange={onSwapAndSendToggle}
                  className="data-[state=checked]:bg-clay-light cursor-pointer w-8 h-4"
                />
              </div>
            )}
          </div>
        </div>

        <div className="h-12 pr-0 sm:pr-6 inline-flex flex-col justify-center items-end gap-1">
          <div className="text-right justify-center text-espresso font-normal font-['InterRegular'] leading-relaxed">
            <Input
              autoFocus={type === CurrencyInputPanelType.INPUT && !isMobile}
              type="number"
              ref={inputRef}
              value={type === CurrencyInputPanelType.OUTPUT ? formatBalance(inputValue, usdPrice) : inputValue}
              onChange={onInputChange}
              onClick={e => e.stopPropagation()}
              onFocus={e => e.stopPropagation()}
              placeholder="0"
              className="!text-2xl text-right border-none shadow-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:border-none focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 !pr-0 focus:!text-espresso text-espresso [&::selection]:bg-cherry-brighter [&::selection]:text-espresso [&::-moz-selection]:bg-cherry-brighter [&::-moz-selection]:text-espresso placeholder:text-espresso w-32 -ml-32 sm:ml-0 md:w-full !px-0 h-7 rounded-none"
              readOnly={type === CurrencyInputPanelType.OUTPUT}
            />
          </div>
          <div className="mix-blend-multiply text-right justify-center text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-none">
            {type === CurrencyInputPanelType.INPUT ? `Sell $${usdValue}` : `Buy $${usdValue}`}
          </div>
        </div>
      </div>

      {type === CurrencyInputPanelType.OUTPUT && isSwapAndSend && onCustomDestinationAddressChange && (
        <>
          <div className="inline-flex justify-start items-center gap-2 mt-2 w-full">
            <Input
              autoFocus
              type="text"
              placeholder="Enter destination address"
              value={customDestinationAddress}
              onChange={e => handleChange(e.target.value)}
              onClick={e => e.stopPropagation()}
              onFocus={e => e.stopPropagation()}
              className={`h-10 flex-1 text-(length:--body-small) border-cream-white focus:!border-cream-white rounded-full border-4 px-8 py-3 shadow-none focus:shadow-none focus-visible:border-4 focus:outline-none focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 ${!isValidAddress ? 'text-negative focus-visible:text-negative' : ''}`}
            />
          </div>
          {stellarAccountValidation?.ok === false && validateChainAddress(customDestinationAddress, 'STELLAR') && (
            <div className="p-2 text-negative text-(length:--body-small) font-medium font-['InterRegular'] leading-none">
              Stellar account does not exist for this address
            </div>
          )}
          {stellarTrustlineValidation?.ok === false && validateChainAddress(customDestinationAddress, 'STELLAR') && (
            <div className="p-2 text-negative text-(length:--body-small) font-medium font-['InterRegular'] leading-none">
              Trustline does not exist for this address
            </div>
          )}
        </>
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
