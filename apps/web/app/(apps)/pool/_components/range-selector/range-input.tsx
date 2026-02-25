'use client';

import type React from 'react';
import { cn } from '@/lib/utils';
import { MinusCircle, PlusCircle } from 'lucide-react';

interface RangeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  step?: number;
  tokenPairLabel: string;
}

export function RangeInput({
  label,
  value,
  onChange,
  disabled = false,
  step = 0.01,
  tokenPairLabel,
}: RangeInputProps): React.JSX.Element {
  const numericValue = Number.parseFloat(value) || 0;

  const handleIncrement = () => {
    if (disabled) return;
    onChange((numericValue + step).toFixed(4));
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = Math.max(0, numericValue - step);
    onChange(newValue.toFixed(4));
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        disabled && 'opacity-50 pointer-events-none',
      )}
    >
      {/* Vertical divider */}
      <div className="w-px h-10 bg-clay/20 shrink-0" />

      <div className="flex flex-col gap-0.5">
        {/* Label row */}
        <span className="font-['InterRegular'] text-[11px] text-clay leading-none">{label}</span>

        {/* Value row: value + buttons */}
        <div className="flex items-center gap-1">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={e => {
              const v = e.target.value;
              if (v === '' || /^\d*\.?\d*$/.test(v)) {
                onChange(v);
              }
            }}
            placeholder="0.0000"
            className={cn(
              'w-16 bg-transparent outline-none',
              "font-['InterRegular'] text-(length:--body-comfortable) text-espresso font-medium",
              'placeholder:text-clay-light',
            )}
          />
          <button
            type="button"
            onClick={handleDecrement}
            className="shrink-0 text-clay hover:text-espresso transition-colors"
          >
            <MinusCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleIncrement}
            className="shrink-0 text-clay hover:text-espresso transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
