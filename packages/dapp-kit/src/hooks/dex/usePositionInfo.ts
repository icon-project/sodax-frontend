import type { ClPositionInfo, PoolKey } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UsePositionInfoResponse = {
  positionInfo: ClPositionInfo;
  isValid: boolean;
};

export type UsePositionInfoProps = {
  tokenId: string | null;
  poolKey: PoolKey | null;
  queryOptions?: Omit<UseQueryOptions<UsePositionInfoResponse, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to fetch a CL position by NFT token id and validate it against an expected pool key.
 * Reads via the hub `publicClient`. Disabled when `tokenId` or `poolKey` is missing.
 */
export function usePositionInfo({
  tokenId,
  poolKey,
  queryOptions,
}: UsePositionInfoProps): UseQueryResult<UsePositionInfoResponse, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<UsePositionInfoResponse, Error>({
    queryKey: ['dex', 'positionInfo', tokenId, poolKey],
    queryFn: async () => {
      if (!tokenId || !poolKey) {
        throw new Error('Token ID and pool key are required');
      }

      const info = await sodax.dex.clService.getPositionInfo(BigInt(tokenId), sodax.hubProvider.publicClient);

      const isValid =
        info.poolKey.currency0.toLowerCase() === poolKey.currency0.toLowerCase() &&
        info.poolKey.currency1.toLowerCase() === poolKey.currency1.toLowerCase() &&
        info.poolKey.fee === poolKey.fee;

      return { positionInfo: info, isValid };
    },
    enabled: tokenId !== null && tokenId !== '' && poolKey !== null,
    staleTime: 10_000,
    ...queryOptions,
  });
}
