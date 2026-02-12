// apps/web/hooks/useAllChainXSodaBalances.ts
import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { SpokeChainId } from '@sodax/types';
import { useXAccounts } from '@sodax/wallet-sdk-react';
import { getXChainType } from '@sodax/wallet-sdk-react';
import { useSodaxContext } from '@sodax/dapp-kit';
import {
  EvmRawSpokeProvider,
  SuiRawSpokeProvider,
  IconRawSpokeProvider,
  InjectiveRawSpokeProvider,
  StellarRawSpokeProvider,
  SolanaRawSpokeProvider,
  SonicRawSpokeProvider,
  spokeChainConfig,
  SONIC_MAINNET_CHAIN_ID,
  type EvmSpokeChainConfig,
  type SuiSpokeChainConfig,
  type IconSpokeChainConfig,
  type InjectiveSpokeChainConfig,
  type StellarSpokeChainConfig,
  type SolanaChainConfig,
  type SonicSpokeChainConfig,
  type SpokeProviderType,
} from '@sodax/sdk';
import type { Address } from '@sodax/types';

/**
 * Helper function to create raw spoke provider for a chain
 */
function createRawSpokeProvider(
  chainId: SpokeChainId,
  address: string,
  rpcConfig: { stellar?: unknown; solana?: string } | undefined,
): SpokeProviderType | undefined {
  const xChainType = getXChainType(chainId);

  if (xChainType === 'EVM') {
    if (chainId === SONIC_MAINNET_CHAIN_ID) {
      return new SonicRawSpokeProvider(address as Address, spokeChainConfig[chainId] as SonicSpokeChainConfig);
    }
    return new EvmRawSpokeProvider(address as Address, spokeChainConfig[chainId] as EvmSpokeChainConfig);
  }
  if (xChainType === 'SUI') {
    return new SuiRawSpokeProvider(spokeChainConfig[chainId] as SuiSpokeChainConfig, address);
  }
  if (xChainType === 'ICON') {
    return new IconRawSpokeProvider(spokeChainConfig[chainId] as IconSpokeChainConfig, address);
  }
  if (xChainType === 'INJECTIVE') {
    return new InjectiveRawSpokeProvider(spokeChainConfig[chainId] as InjectiveSpokeChainConfig, address);
  }
  if (xChainType === 'STELLAR') {
    const stellarConfig = spokeChainConfig[chainId] as StellarSpokeChainConfig;
    return new StellarRawSpokeProvider(address, stellarConfig, rpcConfig?.stellar as never);
  }
  if (xChainType === 'SOLANA') {
    const solanaConfig = rpcConfig?.solana
      ? ({
          ...spokeChainConfig[chainId],
          rpcUrl: rpcConfig.solana,
        } as SolanaChainConfig)
      : (spokeChainConfig[chainId] as SolanaChainConfig);
    return new SolanaRawSpokeProvider({
      connection: { rpcUrl: solanaConfig.rpcUrl },
      walletAddress: address,
      chainConfig: solanaConfig,
    });
  }

  return undefined;
}

/**
 * Hook to get xSODA balance for all chains in parallel
 * Fetches xSODA balance for each chain using raw spoke providers
 * @param chainIds - Array of chain IDs to get xSODA balance for
 * @returns Map of chain ID to xSODA balance
 */
export function useAllChainXSodaBalances(chainIds: SpokeChainId[]): Map<SpokeChainId, bigint> {
  const { sodax, rpcConfig } = useSodaxContext();
  const xAccounts = useXAccounts();

  // Create query parameters for all chains
  const chainQueries = useMemo(() => {
    return chainIds.map(chainId => {
      const chainType = getXChainType(chainId);
      const account = chainType ? xAccounts[chainType] : undefined;
      const address = account?.address;

      return {
        chainId,
        chainType,
        address,
      };
    });
  }, [chainIds, xAccounts]);

  // Check if any wallet is connected
  const hasConnectedWallet = chainQueries.some(q => !!q.address);

  // Single query that fetches xSODA balances for all chains in parallel
  const { data: allXSodaBalances } = useQuery({
    queryKey: ['allChainXSodaBalances', chainQueries.map(q => ({ chainId: q.chainId, address: q.address }))],
    queryFn: async (): Promise<Map<SpokeChainId, bigint>> => {
      const balances = new Map<SpokeChainId, bigint>();

      // Fetch xSODA balances for all chains in parallel
      const balancePromises = chainQueries.map(async query => {
        if (!query.address || !query.chainType) {
          return { chainId: query.chainId, balance: 0n };
        }

        try {
          // For Sonic (hub chain), use getStakingInfo directly with address
          // For other chains, use getStakingInfoFromSpoke with raw spoke provider
          let result: Awaited<ReturnType<typeof sodax.staking.getStakingInfo>>;
          if (query.chainId === SONIC_MAINNET_CHAIN_ID) {
            result = await sodax.staking.getStakingInfo(query.address as Address);
          } else {
            const rawSpokeProvider = createRawSpokeProvider(query.chainId, query.address, rpcConfig);

            if (!rawSpokeProvider) {
              return { chainId: query.chainId, balance: 0n };
            }

            result = await sodax.staking.getStakingInfoFromSpoke(rawSpokeProvider);
          }

          if (!result.ok) {
            console.warn(`Failed to fetch xSODA balance for chain ${query.chainId}:`, result.error);
            return { chainId: query.chainId, balance: 0n };
          }

          return { chainId: query.chainId, balance: result.value.userXSodaBalance };
        } catch (error) {
          console.warn(`Failed to fetch xSODA balance for chain ${query.chainId}:`, error);
          return { chainId: query.chainId, balance: 0n };
        }
      });

      const balanceResults = await Promise.all(balancePromises);

      // Store balances in map
      for (const { chainId, balance } of balanceResults) {
        balances.set(chainId, balance);
      }

      return balances;
    },
    enabled: hasConnectedWallet,
    placeholderData: hasConnectedWallet ? keepPreviousData : undefined,
    refetchInterval: 5_000,
  });

  // Return empty map when no wallet is connected to prevent showing stale balances
  return hasConnectedWallet ? allXSodaBalances || new Map() : new Map();
}
