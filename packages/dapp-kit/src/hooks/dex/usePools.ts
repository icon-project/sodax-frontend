import type { PoolKey } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UsePoolsProps = {
  /**
   * Optional react-query options. The hook owns `queryKey` and `queryFn`.
   */
  queryOptions?: Omit<UseQueryOptions<PoolKey[], Error>, 'queryKey' | 'queryFn'>;
};

/**
 * Loads the list of concentrated-liquidity pools known to the SDK config. The SDK's `getPools()`
 * is synchronous in v2 (no network), so this hook caches indefinitely by default.
 */
export function usePools(props?: UsePoolsProps): UseQueryResult<PoolKey[], Error> {
  const { sodax } = useSodaxContext();

  return useQuery<PoolKey[], Error>({
    queryKey: ['dex', 'pools'],
    queryFn: () => sodax.dex.clService.getPools(),
    staleTime: Number.POSITIVE_INFINITY,
    ...props?.queryOptions,
  });
}
