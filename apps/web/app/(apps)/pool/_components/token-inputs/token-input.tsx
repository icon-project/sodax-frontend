'use client';

import type React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TokenInputProps {
  tokenSymbol: string;
  value: string;
  onChange: (value: string) => void;
  balance?: string;
  disabled?: boolean;
  onMaxClick?: () => void;
  hasError?: boolean;
  isAtMax?: boolean;
}

export function TokenInput({
  tokenSymbol,
  value,
  onChange,
  balance,
  disabled = false,
  onMaxClick,
  hasError = false,
  isAtMax = false,
}: TokenInputProps): React.JSX.Element {
  // Derive icon name from symbol (same logic as CurrencyLogo)
  const iconName = tokenSymbol.toLowerCase().startsWith('soda')
    ? tokenSymbol.toLowerCase().replace('soda', '')
    : tokenSymbol.toLowerCase();

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full bg-cream-white px-3 py-1.5 h-10 min-w-0 flex-1',
        disabled && 'opacity-50 pointer-events-none',
        hasError && 'ring-1 ring-red-300',
      )}
    >
      {/* Token logo */}
      <Image
        className="w-6 h-6 rounded-full shrink-0"
        src={`/coin/${iconName}.png`}
        alt={tokenSymbol}
        width={24}
        height={24}
      />

      {/* Balance + input stacked */}
      <div className="flex flex-col min-w-0 flex-1">
        {balance && (
          <span className="font-['InterRegular'] text-[10px] text-clay leading-tight truncate">{balance}</span>
        )}
        <div className="flex items-center">
          <input
            type="number"
            placeholder="0"
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "w-full min-w-0 bg-transparent outline-none text-espresso text-sm font-['InterRegular'] placeholder:text-clay-light leading-tight",
              hasError && 'text-red-500',
            )}
          />
          {!value && (
            <span className="font-['InterRegular'] text-sm text-espresso whitespace-nowrap shrink-0 ml-0.5">
              {tokenSymbol}
            </span>
          )}
        </div>
      </div>

      {/* Max label */}
      {balance && !disabled && onMaxClick && !isAtMax && (
        <button
          type="button"
          onClick={onMaxClick}
          className="font-['InterRegular'] text-[10px] text-clay hover:text-espresso transition-colors shrink-0"
        >
          max
        </button>
      )}
    </div>
  );
}
