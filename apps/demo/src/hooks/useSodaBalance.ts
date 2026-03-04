// apps/demo/src/hooks/useSodaBalance.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { erc20Abi } from 'viem';
import type { SpokeChainId } from '@sodax/types';
import { EvmSpokeProvider, SonicSpokeProvider, type SpokeProvider } from '@sodax/sdk';
import { useSodaxContext } from '@sodax/dapp-kit';

/**
 * Hook for getting the SODA token balance of the connected wallet on a specific chain.
 *
 * @param {SpokeChainId} chainId - The chain ID to get the balance for
 * @param {string | undefined} userAddress - The user's wallet address
 *
 * @returns {UseQueryResult<bigint, Error>} A React Query result containing:
 *   - data: The SODA token balance (bigint)
 *   - error: Any error that occurred during the fetch
 *   - isLoading: Loading state indicator
 *
 * @example
 * ```typescript
 * const { data: sodaBalance, isLoading } = useSodaBalance(chainId, userAddress);
 *
 * if (sodaBalance) {
 *   console.log('SODA balance:', sodaBalance.toString());
 * }
 * ```
 */
export function useSodaBalance(
  chainId: SpokeChainId,
  userAddress: string | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<bigint, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['soda-balance', chainId, userAddress],
    queryFn: async () => {
      if (!userAddress || !spokeProvider) {
        return 0n;
      }

      const sodaToken = sodax.config.findSupportedTokenBySymbol(chainId, 'SODA');

      if (!sodaToken) {
        return 0n;
      }

      try {
        // For EVM chains, use the public client to read the balance
        if (spokeProvider instanceof EvmSpokeProvider || spokeProvider instanceof SonicSpokeProvider) {
          return await spokeProvider.publicClient.readContract({
            address: sodaToken.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [userAddress as `0x${string}`],
          });
        }

        // For non-EVM chains, we might need different approaches
        // For now, return 0n as a placeholder
        return 0n;
      } catch (error) {
        console.error('Failed to fetch SODA balance:', error);
        return 0n;
      }
    },
    enabled: !!userAddress && !!spokeProvider,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
