// apps/web/components/ui/network-input-display.tsx
import type React from 'react';
import NetworkDisplay from './network-display';
import { NumberInput } from './number-input';

interface NetworkInputDisplayProps {
  iconSrc: string;
  secondaryIconSrc?: string;
  label: string;
  description: string;
  tokenSymbol: string;
  availableAmount?: string;
  inputValue?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputFocus?: () => void;
  onMaxClick?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  showMaxButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const NetworkInputDisplay: React.FC<NetworkInputDisplayProps> = ({
  iconSrc,
  secondaryIconSrc,
  label,
  description,
  tokenSymbol,
  availableAmount = '0 available',
  inputValue = '',
  onInputChange,
  onInputFocus,
  onMaxClick,
  placeholder = '0',
  readOnly = false,
  disabled = false,
  showMaxButton = true,
  className = '',
  children,
}: NetworkInputDisplayProps) => {
  return (
    <div
      className={`w-full relative rounded-3xl outline outline-4 outline-offset-[-4px] outline-cream-white inline-flex justify-between items-center ${className}`}
      style={{ padding: 'var(--layout-space-comfortable) var(--layout-space-big)' }}
    >
      <NetworkDisplay iconSrc={iconSrc} secondaryIconSrc={secondaryIconSrc} label={label} description={description} />
      <div
        className="inline-flex flex-col justify-center items-end gap-1"
        style={{ paddingRight: 'var(--layout-space-normal)' }}
      >
        <div className="text-right justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
          {availableAmount}
        </div>
        <div className="inline-flex gap-1 items-center">
          <div className="text-right justify-center text-espresso font-['InterRegular'] font-bold text-(size:--subtitle)">
            <div className="relative">
              <NumberInput
                value={inputValue === '' ? undefined : Number(inputValue)}
                onChange={onInputChange}
                onFocus={onInputFocus}
                placeholder={placeholder}
                readOnly={readOnly}
                disabled={disabled}
                className="text-right border-none shadow-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:border-none focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 !text-(size:--subtitle) !pr-0"
              />
              {children}
            </div>
          </div>
          <div className="text-right justify-center text-espresso font-['InterRegular'] font-normal text-(size:--body-super-comfortable)">
            {tokenSymbol}
          </div>
          {showMaxButton && onMaxClick && (
            <button
              type="button"
              onClick={onMaxClick}
              disabled={disabled}
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

export default NetworkInputDisplay;
