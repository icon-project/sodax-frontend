// apps/web/hooks/useAllChainBalances.ts
import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { SpokeChainId, ChainType, XToken } from '@sodax/types';
import { useXAccounts } from '@sodax/wallet-sdk-react';
import { getXChainType } from '@sodax/wallet-sdk-react';
import { useXWagmiStore } from '@sodax/wallet-sdk-react';
import { getSupportedSolverTokensForChain } from '@/lib/utils';
import { availableChains } from '@/constants/chains';

/**
 * Balance entry with token information for a specific chain
 */
export interface ChainBalanceEntry {
  balance: bigint;
  chainId: SpokeChainId;
  token: XToken;
}

/**
 * Hook to get balances for all available chains
 * Preserves token information including chain ID for each balance
 * Uses a single React Query to fetch all balances in parallel
 * @returns Object mapping token addresses to arrays of balance entries with chain and token info
 */
export function useAllChainBalances(): Record<string, ChainBalanceEntry[]> {
  const xAccounts = useXAccounts();
  const xServices = useXWagmiStore(state => state.xServices);

  // Create query parameters for all chains
  const chainQueries = useMemo(() => {
    return availableChains.map(chain => {
      const chainId = chain.id as SpokeChainId;
      const chainType = getXChainType(chainId);
      const account = chainType ? xAccounts[chainType] : undefined;
      const address = account?.address;

      return {
        chainId,
        chainType,
        address,
        tokens: getSupportedSolverTokensForChain(chainId),
      };
    });
  }, [xAccounts]);

  // Check if any wallet is connected
  const hasConnectedWallet = chainQueries.some(q => !!q.address);

  // Single query that fetches balances for all chains in parallel
  const { data: allBalances } = useQuery({
    queryKey: ['allChainBalances', chainQueries.map(q => ({ chainId: q.chainId, address: q.address }))],
    queryFn: async (): Promise<Record<string, ChainBalanceEntry[]>> => {
      const balancesByAddress: Record<string, ChainBalanceEntry[]> = {};

      // Fetch balances for all chains in parallel
      const balancePromises = chainQueries.map(async query => {
        if (!query.address || !query.chainType) {
          return { chainId: query.chainId, balances: {}, tokens: query.tokens };
        }

        // Get service for this chain type from the store
        const xService = xServices[query.chainType as ChainType];
        if (!xService) {
          return { chainId: query.chainId, balances: {}, tokens: query.tokens };
        }

        try {
          const balances = await xService.getBalances(query.address, query.tokens);
          return { chainId: query.chainId, balances, tokens: query.tokens };
        } catch (error) {
          console.warn(`Failed to fetch balances for chain ${query.chainId}:`, error);
          return { chainId: query.chainId, balances: {}, tokens: query.tokens };
        }
      });

      const balanceResults = await Promise.all(balancePromises);

      // Store balances with token info for each chain
      for (const { chainId, balances, tokens } of balanceResults) {
        // Create a map of token address to token info for quick lookup
        const tokenMap = new Map<string, XToken>();
        for (const token of tokens) {
          tokenMap.set(token.address, token);
        }

        // Store each balance with its token info
        for (const [tokenAddress, balance] of Object.entries(balances)) {
          const token = tokenMap.get(tokenAddress);
          if (!token) {
            continue;
          }

          if (!balancesByAddress[tokenAddress]) {
            balancesByAddress[tokenAddress] = [];
          }

          balancesByAddress[tokenAddress].push({
            balance: balance || 0n,
            chainId,
            token,
          });
        }
      }

      return balancesByAddress;
    },
    enabled: hasConnectedWallet,
    placeholderData: hasConnectedWallet ? keepPreviousData : undefined,
    refetchInterval: 5_000,
  });

  // Return empty object when no wallet is connected to prevent showing stale balances
  return hasConnectedWallet ? allBalances || {} : {};
}
