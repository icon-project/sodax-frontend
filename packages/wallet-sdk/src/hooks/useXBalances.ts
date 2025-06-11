import { getXChainType } from '@/actions';
import { type UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import type { XChainId, XToken } from '@sodax/types';
import { useXService } from './useXService';

export function useXBalances({
  xChainId,
  xTokens,
  address,
}: { xChainId: XChainId; xTokens: XToken[]; address: string | undefined }): UseQueryResult<{
  [key: string]: bigint;
}> {
  const xService = useXService(getXChainType(xChainId));
  return useQuery({
    queryKey: ['xBalances', xChainId, xTokens.map(x => x.symbol), address],
    queryFn: async () => {
      if (!xService) {
        return {};
      }

      const balances = await xService.getBalances(address, xTokens, xChainId);

      return balances;
    },
    enabled: !!xService,
    placeholderData: keepPreviousData,
    refetchInterval: 5_000,
  });
}
