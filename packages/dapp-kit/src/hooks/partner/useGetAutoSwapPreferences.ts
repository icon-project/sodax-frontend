import type { AutoSwapPreferences } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseGetAutoSwapPreferencesProps = {
  queryAddress: string | undefined;
  queryOptions?: Omit<UseQueryOptions<AutoSwapPreferences, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to fetch the auto-swap preferences (output token, destination chain, destination
 * address) for a given EVM address. Disabled when `queryAddress` is missing. Throws on `!ok`.
 */
export function useGetAutoSwapPreferences({
  queryAddress,
  queryOptions,
}: UseGetAutoSwapPreferencesProps): UseQueryResult<AutoSwapPreferences, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<AutoSwapPreferences, Error>({
    queryKey: ['partner', 'feeClaim', 'autoSwapPreferences', queryAddress],
    queryFn: async () => {
      if (!queryAddress) {
        throw new Error('queryAddress is required');
      }
      const result = await sodax.partners.feeClaim.getAutoSwapPreferences(queryAddress);
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!queryAddress,
    ...queryOptions,
  });
}
