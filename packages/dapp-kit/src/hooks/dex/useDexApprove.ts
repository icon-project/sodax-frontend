import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider, CreateDepositParams, SpokeTxHash } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * React hook to approve token allowance for DEX deposits.
 *
 * Handles the user approval process for a given token before making a deposit through the DEX.
 * After successful approval, this hook automatically triggers an invalidation and refetch for queries
 * related to the token allowance, ensuring up-to-date UI state.
 *
 * @param {SpokeProvider | null} spokeProvider
 *   The spoke provider instance for the active chain. Approval is not possible if this is null.
 * @returns {UseMutationResult<SpokeTxHash, Error, CreateDepositParams | undefined>}
 *   A React Query mutation result for the approve operation, where:
 *   - `mutateAsync(params)` triggers the approval
 *   - `data` is the raw transaction hash (as returned by SDK) upon success
 *   - `error` is set if approval fails
 *   - `isPending` indicates mutation is in progress
 *
 * @example
 * ```typescript
 * const { mutateAsync: approve, isPending, error } = useDexApprove(spokeProvider);
 * 
 * await approve({
 *   asset,                // Asset address for approval
 *   amount: parseUnits('100', 18), // Token amount in base units as a bigint
 *   poolToken             // DEX pool contract address
 * });
 * ```
 * @remarks
 * - Use before attempting a pooled token deposit, after allowance check (`useDexAllowance`) fails.
 * - The transaction returned is on the spoke (local chain).
 * - Throws errors if called without a valid `spokeProvider` or `depositParams`.
 * - Automatically refetches allowance after success to update UI.
 */
export function useDexApprove(
  spokeProvider: SpokeProvider | null,
): UseMutationResult<SpokeTxHash, Error, CreateDepositParams | undefined> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (depositParams: CreateDepositParams | undefined) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }
      if (!depositParams) {
        throw new Error('Deposit params are required');
      }

      const approveResult = await sodax.dex.assetService.approve({
        depositParams,
        spokeProvider,
        raw: false,
      });

      if (!approveResult.ok) {
        throw new Error('Approval failed');
      }

      return approveResult.value;
    },
    onSuccess: () => {
      // Invalidate allowance query to refetch the new allowance
      queryClient.invalidateQueries({ queryKey: ['dex', 'allowance'] });
    },
  });
}
