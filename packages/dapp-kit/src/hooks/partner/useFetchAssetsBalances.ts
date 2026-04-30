import type { PartnerFeeClaimAssetBalance } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseFetchAssetsBalancesProps = {
  queryAddress: string | undefined;
  queryOptions?: Omit<
    UseQueryOptions<Map<string, PartnerFeeClaimAssetBalance>, Error>,
    'queryKey' | 'queryFn' | 'enabled'
  >;
};

/**
 * React hook to fetch hub-asset balances on Sonic for a given EVM address. Disabled when
 * `queryAddress` is missing. Throws on `!ok`.
 */
export function useFetchAssetsBalances({
  queryAddress,
  queryOptions,
}: UseFetchAssetsBalancesProps): UseQueryResult<Map<string, PartnerFeeClaimAssetBalance>, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<Map<string, PartnerFeeClaimAssetBalance>, Error>({
    queryKey: ['partner', 'feeClaim', 'assetsBalances', queryAddress],
    queryFn: async () => {
      if (!queryAddress) {
        throw new Error('queryAddress is required');
      }
      const result = await sodax.partners.feeClaim.fetchAssetsBalances(queryAddress);
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!queryAddress,
    ...queryOptions,
  });
}
