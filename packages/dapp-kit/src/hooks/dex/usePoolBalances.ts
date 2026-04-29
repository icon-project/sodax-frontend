import { HubService, type PoolData, type PoolKey } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { erc20Abi } from 'viem';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UsePoolBalancesResponse = {
  token0Balance: bigint;
  token1Balance: bigint;
};

export type UsePoolBalancesProps = {
  poolData: PoolData | null;
  poolKey: PoolKey | null;
  spokeChainKey: SpokeChainKey | undefined;
  userAddress: string | undefined;
  queryOptions?: Omit<UseQueryOptions<UsePoolBalancesResponse, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to query the user's hub-side deposit balances for both pool tokens. Derives the hub
 * wallet once and reads both pool-token balances in parallel via the hub `publicClient`.
 */
export function usePoolBalances({
  poolData,
  poolKey,
  spokeChainKey,
  userAddress,
  queryOptions,
}: UsePoolBalancesProps): UseQueryResult<UsePoolBalancesResponse, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<UsePoolBalancesResponse, Error>({
    queryKey: ['dex', 'poolBalances', poolData?.poolId, spokeChainKey, userAddress],
    queryFn: async () => {
      if (!poolData || !poolKey || !spokeChainKey || !userAddress) {
        throw new Error('poolData, poolKey, spokeChainKey, and userAddress are required');
      }

      const hubWallet = await HubService.getUserHubWalletAddress(userAddress, spokeChainKey, sodax.hubProvider);

      const [token0Balance, token1Balance] = await Promise.all([
        sodax.hubProvider.publicClient.readContract({
          address: poolData.token0.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [hubWallet],
        }),
        sodax.hubProvider.publicClient.readContract({
          address: poolData.token1.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [hubWallet],
        }),
      ]);

      return { token0Balance, token1Balance };
    },
    enabled: !!poolData && !!poolKey && !!spokeChainKey && !!userAddress,
    staleTime: 5_000,
    refetchInterval: 10_000,
    ...queryOptions,
  });
}
