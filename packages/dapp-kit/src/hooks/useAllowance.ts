import { useSodaxContext } from '@/hooks/useSodaxContext';
import { useSpokeProvider } from './useSpokeProvider';
import type { XToken } from '@sodax/types';
import { useQuery } from '@tanstack/react-query';
import type { SpokeChainId } from '@sodax/sdk';
import { parseUnits } from 'viem';

export function useAllowance(token: XToken, amount: string) {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(token.xChainId as SpokeChainId);

  return useQuery({
    queryKey: ['allowance', token.address, amount],
    queryFn: async () => {
      if (!spokeProvider) {
        return false;
      }
      const allowance = await sodax.moneyMarket.isAllowanceValid(
        {
          token: token.address,
          amount: parseUnits(amount, token.decimals),
        },
        spokeProvider,
      );
      if (allowance.ok) {
        return allowance.value;
      }
      return false;
    },
    enabled: !!spokeProvider,
  });
}
