// Centralized React Query invalidation for Money Market actions (borrow/repay/supply/withdraw)
// so UI refreshes immediately after successful transactions.

import type { QueryClient } from '@tanstack/react-query';
import type { ChainId } from '@sodax/types';

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

  // Balance queries: use prefix matching to invalidate all balance queries for a chain.
  // Query key format: ['xBalances', chainId, tokenSymbols[], address]
  // Using prefix ['xBalances', chainId] matches all queries for that chain regardless of token list.
  if (balanceChainIds && balanceChainIds.length > 0) {
    for (const chainId of balanceChainIds) {
      queryClient.invalidateQueries({
        queryKey: ['xBalances', chainId],
        exact: false, // Match all queries starting with ['xBalances', chainId]
      });
    }
  }

  // Add a small delay before refetching to allow transaction confirmation.
  // This ensures balances are refetched after the transaction is included in a block.
  // Note: React Query will automatically refetch invalidated queries when components remount or
  // when refetchInterval triggers, but we explicitly refetch here to ensure immediate update.
  setTimeout(() => {
    // Trigger refetch for invalidated balance queries (only active/mounted components)
    if (balanceChainIds && balanceChainIds.length > 0) {
      for (const chainId of balanceChainIds) {
        queryClient.refetchQueries({
          queryKey: ['xBalances', chainId],
          type: 'active',
        });
      }
    }
    // Refetch MM data queries
    queryClient.refetchQueries({
      queryKey: ['mm'],
      type: 'active',
    });
  }, 2000); // 2 second delay to allow transaction confirmation
}
