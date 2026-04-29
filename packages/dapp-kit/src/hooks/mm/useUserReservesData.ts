import type { UserReserveData } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseUserReservesDataParams = {
  spokeChainKey: SpokeChainKey | undefined;
  userAddress: string | undefined;
  queryOptions?: Omit<
    UseQueryOptions<readonly [readonly UserReserveData[], number], Error>,
    'queryKey' | 'queryFn' | 'enabled'
  >;
};

/**
 * React hook for fetching the raw user reserves data (positions on the hub) for a given spoke
 * chain and user address.
 */
export function useUserReservesData({
  spokeChainKey,
  userAddress,
  queryOptions,
}: UseUserReservesDataParams): UseQueryResult<readonly [readonly UserReserveData[], number], Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['mm', 'userReservesData', spokeChainKey, userAddress],
    queryFn: async () => {
      if (!spokeChainKey || !userAddress) {
        throw new Error('spokeChainKey and userAddress are required');
      }
      return sodax.moneyMarket.data.getUserReservesData(spokeChainKey, userAddress);
    },
    enabled: !!spokeChainKey && !!userAddress,
    refetchInterval: 5000,
    ...queryOptions,
  });
}
