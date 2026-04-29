import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';
import type { BridgeLimit } from '@sodax/sdk';
import type { XToken } from '@sodax/types';

export function useGetBridgeableAmount(
  from: XToken | undefined,
  to: XToken | undefined,
): UseQueryResult<BridgeLimit, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['bridge', 'bridgeableAmount', from, to],
    queryFn: async () => {
      const result = await sodax.bridge.getBridgeableAmount(from as XToken, to as XToken);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    enabled: !!from && !!to,
  });
}
