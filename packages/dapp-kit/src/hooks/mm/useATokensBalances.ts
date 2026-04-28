import { HubService } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { type Address, isAddress } from 'viem';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseATokensBalancesParams = {
  aTokens: readonly Address[];
  spokeChainKey: SpokeChainKey | undefined;
  userAddress: string | undefined;
  queryOptions?: Omit<UseQueryOptions<Map<Address, bigint>, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to fetch aToken balances for a list of addresses in a single multicall.
 * Derives the user's hub wallet via {@link HubService.getUserHubWalletAddress} from the
 * spoke `chainKey` + spoke wallet `userAddress`.
 */
export function useATokensBalances({
  aTokens,
  spokeChainKey,
  userAddress,
  queryOptions,
}: UseATokensBalancesParams): UseQueryResult<Map<Address, bigint>, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['mm', 'aTokensBalances', aTokens, spokeChainKey, userAddress],
    queryFn: async () => {
      if (aTokens.length === 0) {
        return new Map<Address, bigint>();
      }
      if (!spokeChainKey || !userAddress) {
        throw new Error('spokeChainKey and userAddress are required');
      }
      for (const aToken of aTokens) {
        if (!isAddress(aToken)) {
          throw new Error(`Invalid aToken address: ${aToken}`);
        }
      }

      const hubWalletAddress = await HubService.getUserHubWalletAddress(
        userAddress,
        spokeChainKey,
        sodax.hubProvider,
      );
      return sodax.moneyMarket.data.getATokensBalances(aTokens, hubWalletAddress);
    },
    enabled:
      aTokens.length > 0 && aTokens.every(token => isAddress(token)) && !!spokeChainKey && !!userAddress,
    ...queryOptions,
  });
}
