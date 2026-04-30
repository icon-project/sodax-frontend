import type { FeeTokenApproveParams } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseIsTokenApprovedProps = {
  params: FeeTokenApproveParams | undefined;
  queryOptions?: Omit<UseQueryOptions<boolean, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to check whether a token is approved to the protocol-intents contract on Sonic for
 * a given owner. Read-only; throws on `!ok`.
 */
export function useIsTokenApproved({
  params,
  queryOptions,
}: UseIsTokenApprovedProps): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<boolean, Error>({
    queryKey: ['partner', 'feeClaim', 'isTokenApproved', params?.srcChainKey, params?.srcAddress, params?.token],
    queryFn: async () => {
      if (!params) {
        throw new Error('params are required');
      }
      const result = await sodax.partners.feeClaim.isTokenApproved(params);
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!params,
    refetchInterval: 5_000,
    gcTime: 0,
    ...queryOptions,
  });
}
