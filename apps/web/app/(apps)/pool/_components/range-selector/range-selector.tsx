'use client';

import type React from 'react';
import { usePoolState, usePoolActions } from '../../_stores/pool-store-provider';
import { MOCK_POOL_PAIR } from '../../_mocks';
import { RangeInput } from './range-input';

interface RangeSelectorProps {
  disabled?: boolean;
}

export function RangeSelector({ disabled = false }: RangeSelectorProps): React.JSX.Element {
  const { minPrice, maxPrice } = usePoolState();
  const { setMinPrice, setMaxPrice } = usePoolActions();

  const pair = MOCK_POOL_PAIR;
  const pairLabel = `${pair.token0.symbol} per ${pair.token1.symbol}`;

  return (
    <div className="w-full flex flex-col gap-2">
      <span className="font-['InterRegular'] text-(length:--body-small) text-clay font-medium">Set price range</span>
      <div className="flex gap-2">
        <RangeInput
          label="Min price"
          value={minPrice}
          onChange={setMinPrice}
          disabled={disabled}
          tokenPairLabel={pairLabel}
        />
        <RangeInput
          label="Max price"
          value={maxPrice}
          onChange={setMaxPrice}
          disabled={disabled}
          tokenPairLabel={pairLabel}
        />
      </div>
    </div>
  );
}
