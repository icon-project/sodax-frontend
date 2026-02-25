'use client';

import type React from 'react';
import { useEffect } from 'react';
import { usePoolState, usePoolActions } from '../../_stores/pool-store-provider';
import { usePoolContext } from '../../_hooks/usePoolContext';
import { getDisplayTokens } from '../../_utils/display-tokens';
import { useLiquidityAmounts } from '@sodax/dapp-kit';
import { TokenInput } from './token-input';
import { formatTokenAmount } from '@/lib/utils';

interface TokenInputPairProps {
  disabled?: boolean;
}

export function TokenInputPair({ disabled = false }: TokenInputPairProps): React.JSX.Element {
  const { selectedChainId, minPrice, maxPrice } = usePoolState();
  const { setToken0Amount, setToken1Amount } = usePoolActions();
  const { poolData, token0Balance, token1Balance, spokeAddress } = usePoolContext();
  const { token0Symbol, token1Symbol } = getDisplayTokens(poolData);

  const walletConnected = !!spokeAddress;

  // Auto-calculates paired amounts based on price range and current tick
  const { liquidityToken0Amount, liquidityToken1Amount, handleToken0AmountChange, handleToken1AmountChange } =
    useLiquidityAmounts(minPrice, maxPrice, poolData);

  // Sync hook-managed amounts to the store so supply dialog can access them
  useEffect(() => {
    setToken0Amount(liquidityToken0Amount);
  }, [liquidityToken0Amount, setToken0Amount]);
  useEffect(() => {
    setToken1Amount(liquidityToken1Amount);
  }, [liquidityToken1Amount, setToken1Amount]);

  const token0 = poolData?.token0;
  const token1 = poolData?.token1;

  const formattedToken0Balance =
    walletConnected && token0 ? formatTokenAmount(token0Balance, token0.decimals) : undefined;
  const formattedToken1Balance =
    walletConnected && token1 ? formatTokenAmount(token1Balance, token1.decimals) : undefined;

  // Check if amounts exceed balance
  const token0Exceeds =
    walletConnected &&
    liquidityToken0Amount !== '' &&
    formattedToken0Balance !== undefined &&
    Number(liquidityToken0Amount) > Number(formattedToken0Balance);
  const token1Exceeds =
    walletConnected &&
    liquidityToken1Amount !== '' &&
    formattedToken1Balance !== undefined &&
    Number(liquidityToken1Amount) > Number(formattedToken1Balance);

  // Check if amounts are at max balance
  const token0IsAtMax =
    walletConnected &&
    liquidityToken0Amount !== '' &&
    formattedToken0Balance !== undefined &&
    Number(liquidityToken0Amount) >= Number(formattedToken0Balance);
  const token1IsAtMax =
    walletConnected &&
    liquidityToken1Amount !== '' &&
    formattedToken1Balance !== undefined &&
    Number(liquidityToken1Amount) >= Number(formattedToken1Balance);

  const isDisabled = disabled || !selectedChainId || !poolData;

  return (
    <div className="flex flex-col gap-2 w-full md:flex-row md:items-center md:min-w-0">
      <TokenInput
        tokenSymbol={token0Symbol}
        value={liquidityToken0Amount}
        onChange={handleToken0AmountChange}
        balance={formattedToken0Balance}
        disabled={isDisabled}
        hasError={token0Exceeds}
        isAtMax={token0IsAtMax}
        onMaxClick={
          walletConnected && token0
            ? () => handleToken0AmountChange(formatTokenAmount(token0Balance, token0.decimals))
            : undefined
        }
      />
      <TokenInput
        tokenSymbol={token1Symbol}
        value={liquidityToken1Amount}
        onChange={handleToken1AmountChange}
        balance={formattedToken1Balance}
        disabled={isDisabled}
        hasError={token1Exceeds}
        isAtMax={token1IsAtMax}
        onMaxClick={
          walletConnected && token1
            ? () => handleToken1AmountChange(formatTokenAmount(token1Balance, token1.decimals))
            : undefined
        }
      />
    </div>
  );
}
