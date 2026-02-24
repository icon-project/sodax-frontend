'use client';

import type React from 'react';
import { cn } from '@/lib/utils';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import type { XToken } from '@sodax/types';

interface TokenInputProps {
  token: XToken;
  value: string;
  onChange: (value: string) => void;
  balance?: string;
  disabled?: boolean;
  onMaxClick?: () => void;
  hasError?: boolean;
}

export function TokenInput({
  token,
  value,
  onChange,
  balance,
  disabled = false,
  onMaxClick,
  hasError = false,
}: TokenInputProps): React.JSX.Element {
  return (
    <div className="w-full flex flex-col gap-1">
      <InputGroup
        className={cn(
          'border-cream-white border-4 h-14 rounded-2xl outline-none shadow-none',
          disabled && 'opacity-50 pointer-events-none',
          hasError && 'border-red-300',
        )}
      >
        <InputGroupInput
          type="number"
          placeholder="0"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "pl-4 pr-2 text-espresso text-(length:--body-super-comfortable) placeholder:text-clay-light font-['InterRegular']",
            hasError && 'text-red-500',
          )}
        />
        <InputGroupAddon align="inline-end">
          <div className="flex items-center gap-2">
            <InputGroupText
              className={cn(
                "text-cherry-grey text-(length:--body-comfortable) font-normal font-['InterRegular']",
                value && 'hidden',
              )}
            >
              {token.symbol}
            </InputGroupText>
            {balance && !disabled && (
              <div className="flex items-center gap-1">
                <span className="font-['InterRegular'] text-[10px] text-clay">{balance}</span>
                {onMaxClick && (
                  <button
                    type="button"
                    onClick={onMaxClick}
                    className="px-1.5 py-0.5 rounded-full bg-cream-white text-[9px] font-bold font-['InterRegular'] uppercase text-clay hover:bg-cherry-brighter hover:text-espresso transition-colors"
                  >
                    MAX
                  </button>
                )}
              </div>
            )}
          </div>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
