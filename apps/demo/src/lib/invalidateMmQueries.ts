// Centralized React Query invalidation for Money Market actions (borrow/repay/supply/withdraw)
// so UI refreshes immediately after successful transactions.

import type { QueryClient } from '@tanstack/react-query';
import type { ChainId } from '@sodax/types';
import { POST_TX_REFETCH_DELAY, POST_TX_REFETCH_DELAY_LONG } from '@/components/mm/constants';

export type InvalidateMmQueriesParams = {
  mmChainIds: readonly ChainId[];
  address: string | undefined;
  balanceChainIds?: readonly ChainId[];
};

/**
 * Invalidates React Query caches for Money Market data after successful transactions.
 * Uses a short delay to allow transaction confirmation before refetching.
 *
 * @param queryClient - React Query client instance
 * @param params - Object containing:
 *   - mmChainIds: Chain IDs where MM data should be invalidated (where collateral/debt exists)
 *   - address: User's wallet address
 *   - balanceChainIds: Chain IDs where wallet balances should be invalidated
 */
export function invalidateMmQueries(
  queryClient: QueryClient,
  { mmChainIds, address, balanceChainIds }: InvalidateMmQueriesParams,
): void {
  if (!address) {
    return;
  }

  // Invalidate MM user data (reserves, summary) for the specified chains
  for (const chainId of mmChainIds) {
    queryClient.invalidateQueries({ queryKey: ['mm', 'userReservesData', chainId, address] });
    queryClient.invalidateQueries({ queryKey: ['mm', 'userFormattedSummary', chainId, address] });
  }

  // Reserve/price formatting affects APYs, liquidity, and borrow/supply limits (global, not chain-specific).
  queryClient.invalidateQueries({ queryKey: ['mm', 'reservesUsdFormat'] });
  // aToken balances are shown in Markets table (supplied amounts) - invalidate all since it's a Map query.
  queryClient.invalidateQueries({ queryKey: ['mm', 'aTokensBalances'] });

  // Balance queries: use predicate for reliable matching since query keys contain nested arrays.
  // Query key format: ['xBalances', chainId, tokenSymbols[], address]
  // Prefix matching with nested arrays can be unreliable, so we match explicitly.
  const balanceChainIdSet = new Set(balanceChainIds ?? []);
  const balancePredicate =
    balanceChainIdSet.size > 0
      ? (query: { queryKey: readonly unknown[] }) =>
          query.queryKey[0] === 'xBalances' && balanceChainIdSet.has(query.queryKey[1] as ChainId)
      : undefined;

  if (balancePredicate) {
    queryClient.invalidateQueries({ predicate: balancePredicate });
  }

  // Refetch immediately + with delays to account for transaction confirmation time.
  // Some chains need a few seconds before the new balance is available on-chain.
  const refetchAll = () => {
    if (balancePredicate) {
      queryClient.refetchQueries({ predicate: balancePredicate, type: 'active' });
    }
    queryClient.refetchQueries({ queryKey: ['mm'], type: 'active' });
  };

  refetchAll();
  setTimeout(refetchAll, POST_TX_REFETCH_DELAY);
  setTimeout(refetchAll, POST_TX_REFETCH_DELAY_LONG);
}
