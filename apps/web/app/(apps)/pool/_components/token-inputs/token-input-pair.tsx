'use client';

import type React from 'react';
import { useMemo } from 'react';
import { usePoolState, usePoolActions } from '../../_stores/pool-store-provider';
import { MOCK_POOL_PAIR } from '../../_mocks';
import { TokenInput } from './token-input';
import { useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { formatTokenAmount } from '@/lib/utils';

interface TokenInputPairProps {
  disabled?: boolean;
}

export function TokenInputPair({ disabled = false }: TokenInputPairProps): React.JSX.Element {
  const { token0Amount, token1Amount, selectedChainId } = usePoolState();
  const { setToken0Amount, setToken1Amount } = usePoolActions();

  const pair = MOCK_POOL_PAIR;

  // Get wallet balances if chain is selected
  const { address } = useXAccount(selectedChainId || undefined);
  const walletConnected = !!address;

  const token0WithChain = useMemo(
    () => (selectedChainId ? { ...pair.token0, xChainId: selectedChainId } : pair.token0),
    [selectedChainId, pair.token0],
  );
  const token1WithChain = useMemo(
    () => (selectedChainId ? { ...pair.token1, xChainId: selectedChainId } : pair.token1),
    [selectedChainId, pair.token1],
  );

  const { data: balances } = useXBalances({
    xChainId: selectedChainId || 'sonic',
    xTokens: selectedChainId ? [token0WithChain, token1WithChain] : [],
    address,
  });

  const token0Balance = balances?.[pair.token0.address] ?? 0n;
  const token1Balance = balances?.[pair.token1.address] ?? 0n;

  const formattedToken0Balance = walletConnected ? formatTokenAmount(token0Balance, pair.token0.decimals) : undefined;
  const formattedToken1Balance = walletConnected ? formatTokenAmount(token1Balance, pair.token1.decimals) : undefined;

  // Check if amounts exceed balance
  const token0Exceeds = walletConnected && token0Amount !== '' && Number(token0Amount) > Number(formattedToken0Balance);
  const token1Exceeds = walletConnected && token1Amount !== '' && Number(token1Amount) > Number(formattedToken1Balance);

  const isDisabled = disabled || !selectedChainId;

  return (
    <div className="w-full flex flex-col gap-2">
      <TokenInput
        token={pair.token0}
        value={token0Amount}
        onChange={setToken0Amount}
        balance={formattedToken0Balance}
        disabled={isDisabled}
        hasError={token0Exceeds}
        onMaxClick={
          walletConnected
            ? () => setToken0Amount(formatTokenAmount(token0Balance, pair.token0.decimals))
            : undefined
        }
      />
      <TokenInput
        token={pair.token1}
        value={token1Amount}
        onChange={setToken1Amount}
        balance={formattedToken1Balance}
        disabled={isDisabled}
        hasError={token1Exceeds}
        onMaxClick={
          walletConnected
            ? () => setToken1Amount(formatTokenAmount(token1Balance, pair.token1.decimals))
            : undefined
        }
      />
    </div>
  );
}
