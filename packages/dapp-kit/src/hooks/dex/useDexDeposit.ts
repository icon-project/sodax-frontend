import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider, CreateAssetDepositParams, SpokeTxHash, HubTxHash } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseDexDepositParams = {
  params: CreateAssetDepositParams;
  spokeProvider: SpokeProvider;
};

/**
/**
 * React hook that provides a mutation to perform a deposit into a DEX pool using the provided parameters and SpokeProvider.
 *
 * The hook returns a mutation object for executing the deposit (`mutateAsync`), tracking its state (`isPending`), and any resulting error (`error`).
 * On successful deposit, all queries matching ['dex', 'poolBalances'] are invalidated and refetched.
 *
 * @returns {UseMutationResult<[SpokeTxHash, HubTxHash], Error, UseDexDepositParams>}
 *   React Query mutation result:
 *   - `mutateAsync({ params, spokeProvider })`: Triggers the deposit with {@link CreateDepositParams} and the target SpokeProvider.
 *   - `isPending`: True while the deposit transaction is pending.
 *   - `error`: Error if the mutation fails.
 *
 * @example
 * ```typescript
 * const { mutateAsync: deposit, isPending, error } = useDexDeposit();
 * await deposit({ params: { asset, amount, poolToken }, spokeProvider });
 * ```
 *
 * @remarks
 * - Throws if called with missing `spokeProvider` or `params`.
 * - Upon success, automatically refetches up-to-date pool balances.
 */
export function useDexDeposit(): UseMutationResult<[SpokeTxHash, HubTxHash], Error, UseDexDepositParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ params, spokeProvider }: UseDexDepositParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }

      if (!params) {
        throw new Error('Deposit params are required');
      }

      // Perform the deposit operation
      const depositResult = await sodax.dex.assetService.deposit({
        params,
        spokeProvider,
      });

      if (!depositResult.ok) {
        throw new Error(`Deposit failed: ${depositResult.error?.code || 'Unknown error'}`);
      }

      return depositResult.value;
    },
    onSuccess: () => {
      // Refetch pool balances after a successful deposit
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances'] });
    },
  });
}
