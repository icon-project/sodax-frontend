import type { Address, XToken } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * React hook for fetching an AToken's ERC20 metadata from the Sodax money market.
 *
 * Fetches and caches the metadata (name, symbol, decimals, address) for a given aToken address and chain using React Query.
 * This metadata is typically required for rendering balances and labels in UI components.
 *
 * @param {Address | undefined} aToken - The aToken contract address to look up. Should be an EVM address.
 * @param {ChainId | undefined} chainId - The EVM chain ID for the aToken.
 *
 * @example
 * ```typescript
 * const { data: aToken, isLoading, error } = useAToken(aTokenAddress, chainId);
 * if (aToken) {
 *   console.log(aToken.symbol); // 'aETH'
 * }
 * ```
 *
 * @returns {UseQueryResult<Erc20Token, Error>} A React Query result object containing:
 *   - data: The aToken ERC20 metadata when available.
 *   - isLoading: Loading state indicator.
 *   - error: Any error that occurred during data fetching.
 */
export function useAToken(aToken: Address | undefined): UseQueryResult<XToken, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['aToken', sodax.hubProvider.chainConfig.chain.id, aToken],
    queryFn: async () => {
      if (!aToken) {
        throw new Error('aToken address or hub provider is not defined');
      }

      const aTokenData = await sodax.moneyMarket.data.getATokenData(aToken);
      return {
        ...aTokenData,
        xChainId: sodax.hubProvider.chainConfig.chain.id,
      };
    },
    enabled: !!aToken,
  });
}
