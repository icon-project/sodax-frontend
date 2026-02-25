'use client';

import type React from 'react';
import { usePoolState, usePoolActions } from '../../_stores/pool-store-provider';
import { usePoolContext } from '../../_hooks/usePoolContext';
import { getDisplayTokens } from '../../_utils/display-tokens';
import { RangeInput } from './range-input';

interface RangeSelectorProps {
  disabled?: boolean;
}

export function RangeSelector({ disabled = false }: RangeSelectorProps): React.JSX.Element {
  const { minPrice, maxPrice } = usePoolState();
  const { setMinPrice, setMaxPrice } = usePoolActions();
  const { poolData } = usePoolContext();
  const { token0Symbol, token1Symbol } = getDisplayTokens(poolData);

  const pairLabel = `${token0Symbol} per ${token1Symbol}`;

  return (
    <div className="w-full flex items-center gap-3">
      <span className="font-['InterRegular'] text-[10px] text-clay font-medium uppercase tracking-wider shrink-0">
        Selected<br />range
      </span>
      <RangeInput
        label="Min. price"
        value={minPrice}
        onChange={setMinPrice}
        disabled={disabled}
        tokenPairLabel={pairLabel}
      />
      <RangeInput
        label="Max. price"
        value={maxPrice}
        onChange={setMaxPrice}
        disabled={disabled}
        tokenPairLabel={pairLabel}
      />
    </div>
  );
}
