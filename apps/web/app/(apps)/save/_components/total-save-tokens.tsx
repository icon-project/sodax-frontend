// apps/web/app/(apps)/save/_components/total-save-tokens.tsx
'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import BigNumber from 'bignumber.js';
import { useReservesUsdFormat } from '@sodax/dapp-kit';
import { flattenTokens, getUniqueTokenSymbols } from '@/lib/utils';
import { useTokenSupplyBalances } from '@/hooks/useTokenSupplyBalances';
import { useAllTokenPrices } from '@/hooks/useAllTokenPrices';
import type { XToken } from '@sodax/types';

export default function TotalSaveTokens(): React.JSX.Element {
  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();
  const allTokens = useMemo(() => flattenTokens(), []);
  const groupedTokens = useMemo(() => getUniqueTokenSymbols(allTokens), [allTokens]);
  const allGroupTokens = useMemo(() => groupedTokens.flatMap(group => group.tokens), [groupedTokens]);
  const tokensWithSupplyBalance = useTokenSupplyBalances(allGroupTokens, formattedReserves || []);

  // Get unique token symbols with balances > 0
  const tokensWithBalance = useMemo(() => {
    const tokensBySymbol = new Map<string, XToken>();

    tokensWithSupplyBalance.forEach(token => {
      if (Number(token.supplyBalance) > 0) {
        // Use the first token of each symbol for icon display
        if (!tokensBySymbol.has(token.symbol)) {
          tokensBySymbol.set(token.symbol, token);
        }
      }
    });

    return Array.from(tokensBySymbol.values());
  }, [tokensWithSupplyBalance]);

  // Get prices for all tokens with balances
  const { data: tokenPrices } = useAllTokenPrices(tokensWithBalance);

  // Calculate total USD value across all tokens
  const totalUsdValue = useMemo((): string => {
    if (!tokenPrices || isFormattedReservesLoading) {
      return '$0.00';
    }

    let total = new BigNumber(0);

    groupedTokens.forEach(group => {
      const tokensWithBalanceForSymbol = tokensWithSupplyBalance.filter(
        token => token.symbol === group.symbol && Number(token.supplyBalance) > 0,
      );

      if (tokensWithBalanceForSymbol.length === 0) {
        return;
      }

      // Calculate total balance for this token symbol across all chains
      const totalBalanceForSymbol = tokensWithBalanceForSymbol.reduce((sum, token) => {
        return sum + Number(token.supplyBalance || '0');
      }, 0);

      // Get price for this token (use first token for price lookup)
      const firstToken = tokensWithBalanceForSymbol[0];
      if (firstToken) {
        const priceKey = `${firstToken.symbol}-${firstToken.xChainId}`;
        const price = tokenPrices[priceKey] || 0;

        if (price > 0) {
          total = total.plus(new BigNumber(totalBalanceForSymbol).multipliedBy(price));
        }
      }
    });

    const formatted = total.toFixed(2);
    return `$${Number(formatted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [tokensWithSupplyBalance, groupedTokens, tokenPrices, isFormattedReservesLoading]);

  return (
    <div className="w-full flex gap-2 justify-start">
      <div className="text-(length:--body-super-comfortable) font-['InterRegular'] text-clay">Total Save Tokens</div>
      <div className="flex items-center -space-x-1">
        {tokensWithBalance.length > 0 ? (
          tokensWithBalance.map((token, index) => (
            <Image
              key={`${token.symbol}-${token.xChainId}-${index}`}
              src={`/coin/${token.symbol === 'bnUSD (legacy)' ? 'bnusd' : token.symbol.toLowerCase()}.png`}
              alt={token.symbol}
              width={20}
              height={20}
              className="rounded-full outline-2 outline-white shrink-0 bg-white"
            />
          ))
        ) : (
          <div className="w-5 h-5 rounded-full bg-clay-light shrink-0" />
        )}
      </div>
      <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular']">
        {totalUsdValue}
      </div>
    </div>
  );
}
