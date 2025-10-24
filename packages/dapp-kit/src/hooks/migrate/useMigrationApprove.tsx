import { parseUnits } from 'viem';
import { useCallback, useState, useRef, useEffect } from 'react';
import type {
  IcxCreateRevertMigrationParams,
  UnifiedBnUSDMigrateParams,
  SpokeProvider,
  Result,
  ChainId,
} from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import { MIGRATION_MODE_BNUSD, MIGRATION_MODE_ICX_SODA, type MigrationIntentParams } from './types';
import { useQueryClient } from '@tanstack/react-query';

interface UseApproveReturn {
  approve: ({ params }: { params: MigrationIntentParams }) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
  isApproved: boolean;
}

/**
 * Hook for approving token spending for migration actions
 * @param params The parameters for the migration approval
 * @param spokeProvider The spoke provider instance for the chain
 * @returns Object containing approve function, loading state, error state and reset function
 * @example
 * ```tsx
 * const { approve, isLoading, error } = useMigrationApprove(params, spokeProvider);
 *
 * // Approve tokens for migration
 * await approve({ params });
 * ```
 */

export function useMigrationApprove(
  params: MigrationIntentParams | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseApproveReturn {
  const { sodax } = useSodaxContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const queryClient = useQueryClient();

  // Track previous values to reset approval state when needed
  const prevTokenAddress = useRef<string | undefined>(undefined);
  const prevAmount = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (prevTokenAddress.current !== params?.token?.address || prevAmount.current !== params?.amount) {
      setIsApproved(false);
      prevTokenAddress.current = params?.token?.address;
      prevAmount.current = params?.amount;
    }
  }, [params?.token?.address, params?.amount]);

  const approve = useCallback(
    async ({ params: approveParams }: { params: MigrationIntentParams }) => {
      try {
        setIsLoading(true);
        setError(null);

        if (!spokeProvider) {
          throw new Error('Spoke provider not found');
        }
        if (!approveParams) {
          throw new Error('Migration intent not found');
        }

        const { token, amount, migrationMode = MIGRATION_MODE_ICX_SODA, toToken, destinationAddress } = approveParams;
        const amountToMigrate = parseUnits(amount ?? '0', token?.decimals ?? 0);

        let result: Result<string, unknown>;
        if (migrationMode === MIGRATION_MODE_ICX_SODA) {
          // ICX/SODA migration approval
          const revertParams = {
            amount: amountToMigrate,
            to: destinationAddress as `hx${string}`,
          } satisfies IcxCreateRevertMigrationParams;

          result = await sodax.migration.approve(revertParams, 'revert', spokeProvider, false);
        } else if (migrationMode === MIGRATION_MODE_BNUSD) {
          // bnUSD migration approval
          if (!toToken) throw new Error('Destination token is required for bnUSD migration');

          const migrationParams = {
            srcChainId: token?.xChainId as ChainId,
            dstChainId: toToken?.xChainId as ChainId,
            srcbnUSD: token?.address as string,
            dstbnUSD: toToken?.address as string,
            amount: amountToMigrate,
            to: destinationAddress as `hx${string}` | `0x${string}`,
          } satisfies UnifiedBnUSDMigrateParams;

          result = await sodax.migration.approve(migrationParams, 'revert', spokeProvider, false);
        } else {
          throw new Error('Invalid migration mode');
        }
        if (!result.ok) {
          throw new Error('Failed to approve tokens');
        }

        setIsApproved(true);
        queryClient.invalidateQueries({ queryKey: ['migration-allowance', params] });
        return result.ok;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [spokeProvider, sodax, queryClient, params],
  );

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
