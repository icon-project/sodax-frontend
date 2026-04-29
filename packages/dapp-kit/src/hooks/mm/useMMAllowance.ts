import type { MoneyMarketParams } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseMMAllowanceParams<K extends SpokeChainKey> = {
  params: MoneyMarketParams<K> | undefined;
  queryOptions?: Omit<UseQueryOptions<boolean, Error>, 'queryKey' | 'queryFn'>;
};

/**
 * Hook for checking token allowance / trustline sufficiency for money market operations.
 *
 * Skips the on-chain check entirely for `borrow` and `withdraw` actions — those don't require
 * approval, and the SDK already short-circuits to `true` for them. The early `enabled: false`
 * here additionally avoids a render flash with `isLoading: true`.
 *
 * The query key matches the invalidation keys emitted by `useMMApprove` and the four mutation
 * hooks: `['mm', 'allowance', srcChainKey, token, action]`.
 *
 * @example
 * ```tsx
 * const { data: hasAllowance } = useMMAllowance({ params: supplyParams });
 * ```
 */
export function useMMAllowance<K extends SpokeChainKey>({
  params,
  queryOptions,
}: UseMMAllowanceParams<K>): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<boolean, Error>({
    queryKey: ['mm', 'allowance', params?.srcChainKey, params?.token, params?.action],
    queryFn: async () => {
      if (!params) {
        throw new Error('Params are required');
      }

      // Borrow and withdraw don't require approval; SDK returns true instantly anyway.
      if (params.action === 'borrow' || params.action === 'withdraw') {
        return true;
      }

      const result = await sodax.moneyMarket.isAllowanceValid({ params });
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!params && params.action !== 'borrow' && params.action !== 'withdraw',
    refetchInterval: 5000,
    gcTime: 0,
    ...queryOptions,
  });
}
