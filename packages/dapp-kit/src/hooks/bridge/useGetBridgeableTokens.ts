import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { XToken, SpokeChainKey } from '@sodax/types';
import { useSodaxContext } from '../shared/index.js';

export function useGetBridgeableTokens(
  from: SpokeChainKey | undefined,
  to: SpokeChainKey | undefined,
  token: string | undefined,
): UseQueryResult<XToken[], Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['bridge', 'bridgeableTokens', from, to, token],
    queryFn: () => {
      if (!from || !to || !token) {
        return [];
      }

      const result = sodax.bridge.getBridgeableTokens(from, to, token);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    enabled: !!from && !!to && !!token,
  });
}
