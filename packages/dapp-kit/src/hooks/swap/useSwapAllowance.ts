import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';
import type { CreateIntentParams, CreateLimitOrderParams } from '@sodax/sdk';
import type { GetWalletProviderType, SpokeChainKey } from '@sodax/types';

export function useSwapAllowance<K extends SpokeChainKey>(
  params: CreateIntentParams | CreateLimitOrderParams | undefined,
  srcChainKey: K | undefined,
  walletProvider: GetWalletProviderType<K> | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['allowance', params],
    queryFn: async () => {
      if (!srcChainKey || !walletProvider || !params) {
        return false;
      }
      const allowance = await sodax.swaps.isAllowanceValid({
        params: params as CreateIntentParams,
        raw: false,
        walletProvider,
      });
      return allowance.ok ? allowance.value : false;
    },
    enabled: !!srcChainKey && !!walletProvider && !!params,
    refetchInterval: 2000,
  });
}
