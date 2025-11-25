import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SpokeProvider, OriginalAssetAddress } from '@sodax/sdk';
import type { Address } from 'viem';
import { useSodaxContext } from '../shared/useSodaxContext';

interface AllowanceParams {
  asset: OriginalAssetAddress;
  amount: bigint;
  poolToken: Address;
}

/**
 * Hook for checking token allowance for DEX operations.
 *
 * This hook verifies if the user has approved enough tokens for a specific deposit operation.
 * It automatically queries and tracks the allowance status.
 *
 * @param {AllowanceParams | null} params - The allowance parameters (asset, amount, poolToken)
 * @param {SpokeProvider | null} spokeProvider - The spoke provider to use for allowance checks
 * @param {boolean} enabled - Whether the query should be enabled (default: true)
 * @returns {UseQueryResult<boolean, Error>} Query result containing allowance status
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useDexAllowance(
 *   { asset, amount: parseUnits('100', 18), poolToken },
 *   spokeProvider
 * );
 * ```
 */
export function useDexAllowance(
  params: AllowanceParams | null,
  spokeProvider: SpokeProvider | null,
  enabled = true,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: [
      'dex',
      'allowance',
      params?.asset,
      params?.poolToken,
      params?.amount.toString(),
      spokeProvider?.chainConfig.chain.id,
    ],
    queryFn: async () => {
      if (!params || !spokeProvider) {
        throw new Error('Params and spoke provider are required');
      }

      const allowanceResult = await sodax.dex.assetService.isAllowanceValid({
        depositParams: {
          asset: params.asset,
          amount: params.amount,
          poolToken: params.poolToken,
        },
        spokeProvider,
      });

      if (!allowanceResult.ok) {
        return false;
      }

      return allowanceResult.value;
    },
    enabled: enabled && params !== null && spokeProvider !== null,
    staleTime: 5000, // Consider data stale after 5 seconds
  });
}
