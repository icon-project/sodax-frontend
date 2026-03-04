// packages/dapp-kit/src/hooks/mm/useATokens.ts
import { isAddress, type Address } from 'viem';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { SpokeProvider } from '@sodax/sdk';
import { HubService } from '@sodax/sdk';

export type UseATokensBalancesParams = {
  aTokens: readonly Address[];
  spokeProvider?: SpokeProvider;
  userAddress?: string;
  queryOptions?: UseQueryOptions<Map<Address, bigint>, Error>;
};

/**
 * React hook to fetch and cache aToken balances for multiple aToken addresses in a single multicall.
 *
 * Accepts an array of aToken addresses, a spoke provider, and user address. The hook derives the user's
 * hub wallet address and then fetches balanceOf for each aToken in a single multicall. Returns a Map
 * of aToken address to balance, with querying/caching powered by React Query. This hook uses viem's
 * multicall to batch all requests into a single RPC call for better performance.
 *
 * @param {UseATokensBalancesParams} params - Required params object:
 *   @property {readonly Address[]} aTokens - Array of aToken contract addresses to query balances for.
 *   @property {SpokeProvider} spokeProvider - The spoke provider to derive hub wallet address from.
 *   @property {string} userAddress - User's wallet address on the spoke chain.
 *   @property {UseQueryOptions<Map<Address, bigint>, Error>} queryOptions - React Query options to control query (e.g., staleTime, refetch, etc.).
 *
 * @returns {UseQueryResult<Map<Address, bigint>, Error>} React Query result object:
 *   - data: Map of aToken address to balance, if available
 *   - isLoading: Boolean loading state
 *   - error: Error, if API call fails
 *
 * @example
 * const { data: aTokenBalances, isLoading, error } = useATokensBalances({
 *   aTokens: [aToken1, aToken2, aToken3],
 *   spokeProvider,
 *   userAddress: '0x...',
 *   queryOptions: {}
 * });
 * const aToken1Balance = aTokenBalances?.get(aToken1);
 */
export function useATokensBalances({
  aTokens,
  spokeProvider,
  userAddress,
  queryOptions,
}: UseATokensBalancesParams): UseQueryResult<Map<Address, bigint>, Error> {
  const { sodax } = useSodaxContext();
  const defaultQueryOptions = {
    queryKey: ['mm', 'aTokensBalances', aTokens, spokeProvider?.chainConfig.chain.id, userAddress],
    enabled: aTokens.length > 0 && aTokens.every(token => isAddress(token)) && !!spokeProvider && !!userAddress,
  };
  queryOptions = {
    ...defaultQueryOptions,
    ...queryOptions, // override default query options if provided
  };

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      if (aTokens.length === 0) {
        return new Map();
      }

      if (!spokeProvider || !userAddress) {
        throw new Error('Spoke provider and user address are required');
      }

      // Validate all addresses
      for (const aToken of aTokens) {
        if (!isAddress(aToken)) {
          throw new Error(`Invalid aToken address: ${aToken}`);
        }
      }

      const hubWalletAddress = await HubService.getUserHubWalletAddress(userAddress, spokeProvider.chainConfig.chain.id, sodax.hubProvider);

      return await sodax.moneyMarket.data.getATokensBalances(aTokens, hubWalletAddress);
    },
  });
}
