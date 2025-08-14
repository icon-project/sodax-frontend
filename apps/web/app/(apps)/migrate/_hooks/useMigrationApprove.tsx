import type { Token, XToken } from '@sodax/types';
import { type Address, parseUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import type { IcxCreateRevertMigrationParams, SpokeProvider } from '@sodax/sdk';
import { useSodaxContext } from '@sodax/dapp-kit';
import { useMigrationAllowance } from './useMigrationAllowance';

interface UseApproveReturn {
  approve: () => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Hook for approving token spending for money market actions
 * @param token The token to approve spending for
 * @param spokeProvider The spoke provider instance for the chain
 * @returns Object containing approve function, loading state, error state and reset function
 * @example
 * ```tsx
 * const { approve, isLoading, error } = useApprove(token, spokeProvider);
 *
 * // Approve tokens for supply action
 * await approve({ amount: "100", action: "supply" });
 * ```
 */

export function useMigrationApprove(token: XToken | undefined, amount: string | undefined, iconAddress: string | undefined, spokeProvider: SpokeProvider | undefined): UseApproveReturn {
  const { sodax } = useSodaxContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { refetch: refetchAllowance } = useMigrationAllowance(
    token,
    amount,
    iconAddress,
    spokeProvider,
  );

  const approve = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      if (!token) {
        throw new Error('Token not found');
      }
      if (!amount) {
        throw new Error('Amount not found');
      }

      const amountToMigrate = parseUnits(amount, token.decimals);
      const revertParams = {
        amount: amountToMigrate,
        to: iconAddress as `hx${string}`,
      } satisfies IcxCreateRevertMigrationParams;

      const result = await sodax.migration.approve(revertParams, 'revert', spokeProvider, false);
      if (!result.ok) {
        throw new Error('Failed to approve tokens');
      }

      await refetchAllowance();
      return result.ok;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [spokeProvider, token, amount, iconAddress, sodax, refetchAllowance]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    approve,
    isLoading,
    error,
    resetError,
  };
}
