import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';
import type { CreateBridgeIntentParams } from '@sodax/sdk';
import type { GetWalletProviderType, SpokeChainKey } from '@sodax/types';

export function useBridgeAllowance<K extends SpokeChainKey>(
  params: CreateBridgeIntentParams<K> | undefined,
  walletProvider: GetWalletProviderType<K> | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['bridge', 'allowance', params],
    queryFn: async () => {
      if (!params || !walletProvider) {
        return false;
      }
      const result = await sodax.bridge.isAllowanceValid({
        params,
        raw: false,
        walletProvider,
      });
      return result.ok ? result.value : false;
    },
    enabled: !!params && !!walletProvider,
    refetchInterval: 2000,
    gcTime: 0,
  });
}
