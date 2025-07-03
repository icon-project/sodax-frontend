import { useQuery } from '@tanstack/react-query';
import type { SpokeChainId, XToken } from '@sodax/types';
import { useSodaxContext } from '../shared/useSodaxContext';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import { parseUnits } from 'viem';
import type { MoneyMarketAction } from '@sodax/sdk';

export function useAllowance(token: XToken, amount: string, action: MoneyMarketAction) {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(token.xChainId as SpokeChainId);

  return useQuery({
    queryKey: ['allowance', token.address, amount, action],
    queryFn: async () => {
      if (!spokeProvider) {
        return false;
      }
      const allowance = await sodax.moneyMarket.isAllowanceValid(
        {
          token: token.address,
          amount: parseUnits(amount, token.decimals),
          action,
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
