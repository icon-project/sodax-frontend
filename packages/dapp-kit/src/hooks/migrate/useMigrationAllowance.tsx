import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ChainId } from '@sodax/types';
import { useSodaxContext } from '../shared/useSodaxContext';
import { parseUnits } from 'viem';
import type { IcxCreateRevertMigrationParams, UnifiedBnUSDMigrateParams, SpokeProvider } from '@sodax/sdk';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';
import { MIGRATION_MODE_ICX_SODA, type MigrationIntentParams } from './types';

/**
 * Hook for checking token allowance for migration operations.
 *
 * This hook verifies if the user has approved enough tokens for migration operations.
 * It handles both ICX/SODA and bnUSD migration allowance checks.
 *
 * @param {MigrationIntentParams} params - The parameters for the migration allowance check
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for allowance checks
 *
 * @returns {UseQueryResult<boolean, Error>} A React Query result containing:
 *   - data: Boolean indicating if allowance is sufficient
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during the check
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useMigrationAllowance(params, spokeProvider);
 * ```
 */
export function useMigrationAllowance(
  params: MigrationIntentParams | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['migration-allowance', params],
    queryFn: async () => {
      if (!spokeProvider || !params) {
        return false;
      }

      const { token, amount, migrationMode = MIGRATION_MODE_ICX_SODA, toToken, destinationAddress } = params;

      // For ICON chain, no allowance is required (forward migrations)
      if (token?.xChainId === ICON_MAINNET_CHAIN_ID) {
        return true;
      }

      if (!spokeProvider) throw new Error('Spoke provider is required');
      const amountToMigrate = parseUnits(amount ?? '0', token?.decimals ?? 0);

      let migrationParams: IcxCreateRevertMigrationParams | UnifiedBnUSDMigrateParams;
      if (migrationMode === MIGRATION_MODE_ICX_SODA) {
        migrationParams = {
          amount: amountToMigrate,
          to: destinationAddress as `hx${string}`,
        } satisfies IcxCreateRevertMigrationParams;
      } else {
        if (!toToken) throw new Error('Destination token is required for bnUSD migration');

        migrationParams = {
          srcChainId: token?.xChainId as ChainId,
          dstChainId: toToken?.xChainId as ChainId,
          srcbnUSD: token?.address as string,
          dstbnUSD: toToken?.address as string,
          amount: amountToMigrate,
          to: destinationAddress as `hx${string}` | `0x${string}`,
        } satisfies UnifiedBnUSDMigrateParams;
      }

      const allowance = await sodax.migration.isAllowanceValid(migrationParams, 'revert', spokeProvider);
      if (allowance.ok) {
        return allowance.value;
      }
      return false;
    },
    enabled: !!spokeProvider && !!params,
    refetchInterval: 2000,
  });
}
