import { isAddress } from 'viem';
import type { XToken } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseATokenParams = {
  aToken: string;
  queryOptions?: UseQueryOptions<XToken, Error>;
};

/**
 * React hook to fetch and cache metadata for a given aToken address.
 *
 * Accepts an aToken address and React Query options to control query behavior.
 * Returns the aToken's ERC20-style metadata from the Sodax money market, with querying/caching
 * powered by React Query.
 *
 * @param {UseATokenParams} params - Required params object:
 *   @property {Address} aToken - The aToken contract address to query.
 *   @property {UseQueryOptions<XToken, Error>} queryOptions - React Query options to control query (e.g., staleTime, refetch, etc.).
 *
 * @returns {UseQueryResult<XToken, Error>} React Query result object:
 *   - data: XToken metadata, if available
 *   - isLoading: Boolean loading state
 *   - error: Error, if API call fails
 *
 * @example
 * const { data: xToken, isLoading, error } = useAToken({ aToken: aTokenAddress, queryOptions: {} });
 * if (xToken) {
 *   console.log(xToken.symbol);
 * }
 */
export function useAToken({ aToken, queryOptions }: UseATokenParams): UseQueryResult<XToken, Error> {
  const { sodax } = useSodaxContext();
  const defaultQueryOptions = {
    queryKey: ['mm', 'aToken', aToken],
    enabled: !!aToken,
  };
  queryOptions = {
    ...defaultQueryOptions,
    ...queryOptions, // override default query options if provided
  };

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      if (!aToken) {
        throw new Error('aToken address or hub provider is not defined');
      }

      if (!isAddress(aToken)) {
        throw new Error('aToken address is not a valid address');
      }

      const aTokenData = await sodax.moneyMarket.data.getATokenData(aToken);
      return {
        ...aTokenData,
        xChainId: sodax.hubProvider.chainConfig.chain.id,
      };
    },
  });
}
