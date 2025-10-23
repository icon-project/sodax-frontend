import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { XToken } from '@sodax/types';
import { useSodaxContext } from '../shared/useSodaxContext';
import { parseUnits } from 'viem';
import type { IcxCreateRevertMigrationParams, UnifiedBnUSDMigrateParams, SpokeProvider } from '@sodax/sdk';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';
import { MIGRATION_MODE_ICX_SODA, type MigrationMode } from './types';

/**
 * Hook for checking token allowance for migration operations.
 *
 * This hook verifies if the user has approved enough tokens for migration operations.
 * It handles both ICX/SODA and bnUSD migration allowance checks.
 *
 * @param {XToken} token - The token to check allowance for. Must be an XToken with valid address and chain information.
 * @param {string} amount - The amount to check allowance for, as a decimal string
 * @param {string} iconAddress - The ICON address for the migration
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for allowance checks
 * @param {MigrationMode} migrationMode - The migration mode to determine which allowance check to perform
 * @param {XToken} toToken - The destination token for bnUSD migrations
 *
 * @returns {UseQueryResult<boolean, Error>} A React Query result containing:
 *   - data: Boolean indicating if allowance is sufficient
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during the check
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useMigrationAllowance(token, "100", iconAddress, provider, MIGRATION_MODE_ICX_SODA, toToken);
 * ```
 */
export function useMigrationAllowance(
  token: XToken | undefined,
  amount: string | undefined,
  sourceAddress: string | undefined,
  spokeProvider: SpokeProvider | undefined,
  migrationMode: MigrationMode = MIGRATION_MODE_ICX_SODA,
  toToken?: XToken,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['allowance', token?.xChainId, token?.address, amount, sourceAddress, migrationMode],
    queryFn: async () => {
      if (!token) throw new Error('Token is required');
      if (!amount) throw new Error('Amount is required');

      // For ICON chain, no allowance is required (forward migrations)
      if (token.xChainId === ICON_MAINNET_CHAIN_ID) {
        return true;
      }

      if (!spokeProvider) throw new Error('Spoke provider is required');
      const amountToMigrate = parseUnits(amount, token.decimals);

      let params: IcxCreateRevertMigrationParams | UnifiedBnUSDMigrateParams;
      if (migrationMode === MIGRATION_MODE_ICX_SODA) {
        params = {
          amount: amountToMigrate,
          to: sourceAddress as `hx${string}`,
        } satisfies IcxCreateRevertMigrationParams;
      } else {
        if (!toToken) throw new Error('Destination token is required for bnUSD migration');

        params = {
          srcChainId: token.xChainId,
          dstChainId: toToken.xChainId,
          srcbnUSD: token.address,
          dstbnUSD: toToken.address,
          amount: amountToMigrate,
          to: sourceAddress as `hx${string}` | `0x${string}`,
        } satisfies UnifiedBnUSDMigrateParams;
      }

      const allowance = await sodax.migration.isAllowanceValid(params, 'revert', spokeProvider);
      if (allowance.ok) {
        return allowance.value;
      }
      return false;
    },
    enabled: !!spokeProvider && !!token && !!amount,
    refetchInterval: 2000,
  });
}
