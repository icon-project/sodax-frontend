import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { XToken } from '@sodax/types';
import { useSodaxContext } from '@sodax/dapp-kit';
import { parseUnits } from 'viem';
import { IcxCreateRevertMigrationParams, UnifiedBnUSDMigrateParams, SpokeProvider, isLegacybnUSDToken, isNewbnUSDToken } from '@sodax/sdk';
import { ICON_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

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
 * @param {'icxsoda' | 'bnusd'} migrationMode - The migration mode to determine which allowance check to perform
 * @param {XToken} toToken - The destination token for bnUSD migrations
 *
 * @returns {UseQueryResult<boolean, Error>} A React Query result containing:
 *   - data: Boolean indicating if allowance is sufficient
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during the check
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useMigrationAllowance(token, "100", iconAddress, provider, 'icxsoda', toToken);
 * ```
 */
export function useMigrationAllowance(
  token: XToken | undefined,
  amount: string | undefined,
  iconAddress: string | undefined,
  spokeProvider: SpokeProvider | undefined,
  migrationMode: 'icxsoda' | 'bnusd' = 'icxsoda',
  toToken?: XToken,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['allowance', token?.xChainId, token?.address, amount, iconAddress, migrationMode],
    queryFn: async () => {
      if (!token) throw new Error('Token is required');
      if (!amount) throw new Error('Amount is required');

      // For ICON chain, no allowance is required (forward migrations)
      if (token.xChainId === ICON_MAINNET_CHAIN_ID) {
        return true;
      }

      if (!spokeProvider) throw new Error('Spoke provider is required');
      const amountToMigrate = parseUnits(amount, token.decimals);

      if (migrationMode === 'icxsoda') {
        // ICX/SODA migration allowance check
        const params = {
          amount: amountToMigrate,
          to: iconAddress as `hx${string}`,
        } satisfies IcxCreateRevertMigrationParams;

        const allowance = await sodax.migration.isAllowanceValid(params, 'revert', spokeProvider);
        if (allowance.ok) {
          return allowance.value;
        }
        return false;
      }

      if (migrationMode === 'bnusd') {
        if (!toToken) throw new Error('Destination token is required for bnUSD migration');

        const params = {
          srcChainId: token.xChainId,
          dstChainId: toToken.xChainId,
          srcbnUSD: token.address,
          dstbnUSD: toToken.address,
          amount: amountToMigrate,
          to: iconAddress as `hx${string}`,
        } satisfies UnifiedBnUSDMigrateParams;
        const allowance = await sodax.migration.isAllowanceValid(params, 'revert', spokeProvider);
        if (allowance.ok) {
          return allowance.value;
        }
        return false;
      }

      return false;
    },
    enabled: !!spokeProvider && !!token && !!amount,
    refetchInterval: 2000,
  });
}
