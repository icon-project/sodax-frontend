import type { SpokeChainId } from '@sodax/sdk';
import type { XToken } from '@sodax/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import { useSodaxContext } from '../shared/useSodaxContext';

interface WithdrawResponse {
  ok: true;
  value: [`0x${string}`, `0x${string}`];
}

/**
 * Hook for withdrawing supplied tokens from the Sodax money market.
 *
 * This hook provides functionality to withdraw previously supplied tokens from the money market protocol,
 * handling the entire withdrawal process including transaction creation, submission,
 * and cross-chain communication.
 *
 * @example
 * ```typescript
 * const { mutateAsync: withdraw, isPending, error } = useWithdraw(spokeToken);
 * await withdraw('100');
 * ```
 *
 * @throws {Error} When:
 *   - spokeProvider is not available
 *   - Transaction execution fails
 */
export function useWithdraw(spokeToken: XToken): UseMutationResult<WithdrawResponse, Error, string> {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(spokeToken.xChainId as SpokeChainId);

  return useMutation<WithdrawResponse, Error, string>({
    mutationFn: async (amount: string) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.withdrawAndSubmit(
        {
          token: spokeToken.address,
          // vault token on hub chain decimals is 18
          amount: parseUnits(amount, 18),
          action: 'withdraw',
        },
        spokeProvider,
      );

      if (!response.ok) {
        throw new Error('Failed to withdraw tokens');
      }

      console.log('Withdraw transaction submitted:', response);
      return response;
    },
  });
}
