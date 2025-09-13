import type { Token, XToken } from '@sodax/types';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';
import { type Address, parseUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState, useRef, useEffect } from 'react';
import type { IcxCreateRevertMigrationParams, UnifiedBnUSDMigrateParams, SpokeProvider, Result } from '@sodax/sdk';
import { useSodaxContext } from '@sodax/dapp-kit';
import { useMigrationAllowance } from './useMigrationAllowance';

interface UseApproveReturn {
  approve: () => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
  isApproved: boolean;
}

/**
 * Hook for approving token spending for migration actions
 * @param token The token to approve spending for
 * @param amount The amount to approve
 * @param iconAddress The ICON address for the migration
 * @param spokeProvider The spoke provider instance for the chain
 * @param migrationMode The migration mode ('icxsoda' or 'bnusd')
 * @param toToken The destination token for bnUSD migrations
 * @returns Object containing approve function, loading state, error state and reset function
 * @example
 * ```tsx
 * const { approve, isLoading, error } = useMigrationApprove(token, "100", iconAddress, provider, 'icxsoda', toToken);
 *
 * // Approve tokens for migration
 * await approve();
 * ```
 */

export function useMigrationApprove(
  token: XToken | undefined,
  amount: string | undefined,
  sourceAddress: string | undefined,
  spokeProvider: SpokeProvider | undefined,
  migrationMode: 'icxsoda' | 'bnusd' = 'icxsoda',
  toToken?: XToken,
  destinationAddress?: string,
): UseApproveReturn {
  const { sodax } = useSodaxContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const { refetch: refetchAllowance } = useMigrationAllowance(
    token,
    amount,
    sourceAddress,
    spokeProvider,
    migrationMode,
    toToken,
  );

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

      let result: Result<string, Error>;
      if (migrationMode === 'icxsoda') {
        // ICX/SODA migration approval
        const revertParams = {
          amount: amountToMigrate,
          to: sourceAddress as `hx${string}`,
        } satisfies IcxCreateRevertMigrationParams;

        result = await sodax.migration.approve(revertParams, 'revert', spokeProvider, false);
      } else if (migrationMode === 'bnusd') {
        // bnUSD migration approval
        if (!toToken) throw new Error('Destination token is required for bnUSD migration');

        const params = {
          srcChainId: token.xChainId,
          dstChainId: toToken.xChainId,
          srcbnUSD: token.address,
          dstbnUSD: toToken.address,
          amount: amountToMigrate,
          to: destinationAddress as `hx${string}` | `0x${string}`,
        } satisfies UnifiedBnUSDMigrateParams;

        result = await sodax.migration.approve(params, 'revert', spokeProvider, false);
      } else {
        throw new Error('Invalid migration mode');
      }
      if (!result.ok) {
        throw new Error('Failed to approve tokens');
      }

      setIsApproved(true);
      refetchAllowance();
      return result.ok;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    spokeProvider,
    token,
    amount,
    sourceAddress,
    sodax,
    refetchAllowance,
    migrationMode,
    toToken,
    destinationAddress,
  ]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    approve,
    isLoading,
    error,
    resetError,
    isApproved,
  };
}
