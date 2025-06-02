import type { Hex } from '@new-world/sdk';
import { useQuery } from '@tanstack/react-query';
import { useSodaxContext } from './useSodaxContext';

export const useStatus = (intent_tx_hash: Hex) => {
  const { sodax } = useSodaxContext();
  return useQuery({
    queryKey: [intent_tx_hash],
    queryFn: async () => {
      const intentResult = await sodax.solver.getStatus({ intent_tx_hash });
      return intentResult;
    },
    refetchInterval: 3000, // 3s
  });
};
