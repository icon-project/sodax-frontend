'use client';

import type React from 'react';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';

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
        'flex-1 flex flex-col items-center gap-1 p-3 rounded-lg bg-almost-white mix-blend-multiply',
        disabled && 'opacity-50 pointer-events-none',
      )}
    >
      <span className="font-['InterRegular'] text-[10px] text-clay font-medium uppercase tracking-wider">{label}</span>

      <div className="flex items-center gap-2 w-full">
        <button
          type="button"
          onClick={handleDecrement}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-cream-white hover:bg-cherry-brighter transition-colors"
        >
          <Minus className="w-3 h-3 text-espresso" />
        </button>

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
            'flex-1 text-center bg-transparent outline-none',
            "font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso font-medium",
            'placeholder:text-clay-light',
          )}
        />

        <button
          type="button"
          onClick={handleIncrement}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-cream-white hover:bg-cherry-brighter transition-colors"
        >
          <Plus className="w-3 h-3 text-espresso" />
        </button>
      </div>

      <span className="font-['InterRegular'] text-[10px] text-clay">{tokenPairLabel}</span>
    </div>
  );
}
