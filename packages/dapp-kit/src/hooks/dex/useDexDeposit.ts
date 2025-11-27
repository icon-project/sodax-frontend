import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider, CreateDepositParams, SpokeTxHash, HubTxHash } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * React hook to perform a token deposit into a DEX pool.
 *
 * This hook wraps the deposit action for a pool on the active chain. The user must have approved
 * enough token allowance for the DEX before calling this (see {@link useDexAllowance}, {@link useDexApprove}).
 *
 * On success, the pool balances will be refetched for UI updates.
 *
 * @param {SpokeProvider | null} spokeProvider
 *   The SpokeProvider instance for the desired chain. Pass `null` to disable/defer the mutation.
 *
 * @returns {UseMutationResult<[SpokeTxHash, HubTxHash], Error, CreateDepositParams>}
 *   A React Query mutation object with:
 *   - `mutateAsync(depositParams)`: Executes the deposit using {@link CreateDepositParams}.
 *   - `isPending`: Boolean state for mutation loading.
 *   - `error`: Any error thrown by the deposit attempt.
 *
 * @example
 * ```typescript
 * const { mutateAsync: deposit, isPending, error } = useDexDeposit(spokeProvider);
 *
 * await deposit({
 *   asset,             // Asset address being deposited
 *   amount,            // Amount as bigint (in base units)
 *   poolToken,         // Pool token/contract address
 *   ...                // (other fields required by CreateDepositParams)
 * });
 * ```
 *
 * @remarks
 * - The returned tuple is: [spokeTxHash, hubTxHash] from the Sodax SDK after deposit.
 * - Throws if `spokeProvider` or `depositParams` are missing.
 * - Automatically refetches pool balances after a successful deposit.
 */
export function useDexDeposit(
  spokeProvider: SpokeProvider | null,
): UseMutationResult<[SpokeTxHash, HubTxHash], Error, CreateDepositParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (depositParams: CreateDepositParams): Promise<[SpokeTxHash, HubTxHash]> => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }

      if (!depositParams) {
        throw new Error('Deposit params are required');
      }

      // Perform the deposit operation
      const depositResult = await sodax.dex.assetService.deposit({
        depositParams,
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
