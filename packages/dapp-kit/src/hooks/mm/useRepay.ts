import type { SpokeChainId } from '@sodax/sdk';
import type { ChainId, XToken } from '@sodax/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import { useSodaxContext } from '../shared/useSodaxContext';

interface RepayResponse {
  ok: true;
  value: [`0x${string}`, `0x${string}`];
}

/**
 * Hook for repaying borrowed tokens to the Sodax money market.
 *
 * This hook provides functionality to repay borrowed tokens back to the money market protocol,
 * handling the entire repayment process including transaction creation, submission,
 * and cross-chain communication.
 *
 * @example
 * ```typescript
 * const { mutateAsync: repay, isPending, error } = useRepay(hubToken, spokeChainId);
 * await repay('100');
 * ```
 *
 * @throws {Error} When:
 *   - spokeProvider is not available
 *   - Transaction execution fails
 */
export function useRepay(hubToken: XToken, spokeChainId: ChainId): UseMutationResult<RepayResponse, Error, string> {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(spokeChainId as SpokeChainId);

  return useMutation<RepayResponse, Error, string>({
    mutationFn: async (amount: string) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.repayAndSubmit(
        {
          token: hubToken.address,
          amount: parseUnits(amount, hubToken.decimals),
        },
        spokeProvider,
      );

      if (!response.ok) {
        throw new Error('Failed to repay tokens');
      }

      console.log('Repay transaction submitted:', response);
      return response;
    },
  });
}
