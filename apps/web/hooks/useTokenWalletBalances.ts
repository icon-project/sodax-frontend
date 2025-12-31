// apps/web/hooks/useTokenWalletBalances.ts
import { formatUnits } from 'viem';
import { useMemo } from 'react';
import type { XToken } from '@sodax/types';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';

/**
 * React hook that calculates wallet balances for multiple tokens,
 * supporting tokens across multiple chains.
 *
 * @param {XToken[]} tokens - Array of tokens to calculate wallet balances for.
 *
 * @returns {Array<XToken & { supplyBalance: string }>} Tokens enriched with supplyBalance (wallet balance).
 */
export function useTokenWalletBalances(tokens: XToken[]): Array<XToken & { supplyBalance: string }> {
  const allChainBalances = useAllChainBalances();

  return useMemo(() => {
    return tokens.map(token => {
      const balanceEntries = allChainBalances[token.address] || [];
      const balanceEntry = balanceEntries.find(entry => entry.chainId === token.xChainId);
      const balance = balanceEntry ? balanceEntry.balance : 0n;

      const supplyBalance = balance > 0n ? Number(formatUnits(balance, token.decimals)).toFixed(4) : '0';

      return {
        ...token,
        supplyBalance,
      };
    });
  }, [tokens, allChainBalances]);
}

