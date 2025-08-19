import type { Token, XToken } from '@sodax/types';
import { type Address, parseUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState, useRef, useEffect } from 'react';
import type { IcxCreateRevertMigrationParams, SpokeProvider } from '@sodax/sdk';
import { useSodaxContext } from '@sodax/dapp-kit';
import { useMigrationAllowance } from './useMigrationAllowance';

interface UseApproveReturn {
  approve: () => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
  isApproved: boolean;
  resetApproval: () => void;
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

export function useMigrationApprove(
  token: XToken | undefined,
  amount: string | undefined,
  iconAddress: string | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseApproveReturn {
  const { sodax } = useSodaxContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const { refetch: refetchAllowance } = useMigrationAllowance(token, amount, iconAddress, spokeProvider);

  // Track previous values to reset approval state when needed
  const prevTokenAddress = useRef<string | undefined>(undefined);
  const prevAmount = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (prevTokenAddress.current !== token?.address || prevAmount.current !== amount) {
      setIsApproved(false);
      prevTokenAddress.current = token?.address;
      prevAmount.current = amount;
    }
  }, [token?.address, amount]);

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
        setIsLoading(false);
        throw new Error('Failed to approve tokens');
      }

      // Immediately set approved state for instant UI feedback
      setIsApproved(true);

      // Refetch allowance in background to keep data in sync
      refetchAllowance();

      setIsLoading(false);
      return result.ok;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
    }
  }, [spokeProvider, token, amount, iconAddress, sodax, refetchAllowance]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const resetApproval = useCallback(() => {
    setIsApproved(false);
  }, []);

  return {
    approve,
    isLoading,
    error,
    resetError,
    isApproved,
    resetApproval,
  };
}
