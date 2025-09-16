// packages/dapp-kit/src/hooks/staking/useUnstakingInfoWithPenalty.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { UnstakingInfo, UnstakeRequestWithPenalty, StakingError, StakingErrorCode } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SpokeProvider } from '@sodax/sdk';

export type UnstakingInfoWithPenalty = UnstakingInfo & {
  requestsWithPenalty: UnstakeRequestWithPenalty[];
};

/**
 * Hook for fetching unstaking information with penalty calculations from the stakedSoda contract.
 * Uses React Query for efficient caching and state management.
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider instance
 * @param {number} refetchInterval - The interval in milliseconds to refetch data (default: 5000)
 * @returns {UseQueryResult} Query result object containing unstaking info with penalties and state
 *
 * @example
 * ```typescript
 * const { data: unstakingInfo, isLoading, error } = useUnstakingInfoWithPenalty(spokeProvider);
 *
 * if (isLoading) return <div>Loading unstaking info...</div>;
 * if (unstakingInfo) {
 *   console.log('Total unstaking:', unstakingInfo.totalUnstaking);
 *   unstakingInfo.requestsWithPenalty.forEach(request => {
 *     console.log('Penalty:', request.penaltyPercentage + '%');
 *     console.log('Claimable amount:', request.claimableAmount);
 *   });
 * }
 * ```
 */
export function useUnstakingInfoWithPenalty(
  spokeProvider: SpokeProvider | undefined,
  refetchInterval = 5000,
): UseQueryResult<UnstakingInfoWithPenalty, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['unstakingInfoWithPenalty', spokeProvider?.chainConfig.chain.id],
    queryFn: async () => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.getUnstakingInfoFromSpoke(spokeProvider);

      if (!result.ok) {
        throw new Error(`Failed to fetch unstaking info: ${result.error.code}`);
      }

      // Get the user's hub wallet address for penalty calculations
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      let hubWallet: string;

      // For Sonic chain, use the wallet address directly
      if (spokeProvider.chainConfig.chain.id === 'sonic') {
        hubWallet = walletAddress as string;
      } else {
        // For other chains, get the abstracted wallet address
        const { WalletAbstractionService } = await import('@sodax/sdk');
        const hubWalletResult = await WalletAbstractionService.getUserAbstractedWalletAddress(
          walletAddress as `0x${string}`,
          spokeProvider,
          sodax.hubProvider,
        );
        hubWallet = hubWalletResult;
      }

      // Get unstaking info with penalty calculations
      const penaltyResult = await sodax.staking.getUnstakingInfoWithPenalty(hubWallet as `0x${string}`);

      if (!penaltyResult.ok) {
        throw new Error(`Failed to fetch unstaking info with penalty: ${penaltyResult.error.code}`);
      }

      return penaltyResult.value;
    },
    enabled: !!spokeProvider,
    refetchInterval,
  });
}
