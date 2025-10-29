import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { useSpokeProvider, useUserReservesData, useReservesData } from '@sodax/dapp-kit';
import { useAppStore } from '@/zustand/useAppStore';
import { useFormattedReserves } from '@/hooks/useFormattedReserves';
import { useSupportedTokens } from './useSupportedToken';
import type { AggregatedReserveData, UserReserveData } from '@sodax/sdk';

/**
 * React hook that aggregates data for the Money Market "Markets" table.
 *
 * Fetches supported tokens, wallet balances, user reserves, and
 * global reserve metrics (liquidity, debt, rates) for the active chain.
 *
 * @returns {object} Data for rendering the markets table:
 * - `selectedChainId`: Active chain ID
 * - `tokens`: Supported tokens
 * - `balances`: User wallet balances
 * - `userReserves`: User lending/borrowing data
 * - `reserves`: Raw reserve data
 * - `formattedReserves`: USD-normalized reserves
 *
 * @example
 * const { tokens, balances, reserves } = useSupplyAssetsData();
 */

export function useSupplyAssetsData() {
  const { selectedChainId } = useAppStore();
  const { address } = useXAccount(selectedChainId);
  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);

  const tokens = useSupportedTokens(selectedChainId);
  const { data: balances } = useXBalances({ xChainId: selectedChainId, xTokens: tokens, address });

  // user reserves
  const { data: userReservesRaw } = useUserReservesData(spokeProvider, address);
  const [userReserves] = (userReservesRaw ?? [[], 0]) as [UserReserveData[], number];

  // all reserves
  const { data } = useReservesData();
  const [reserves] = (data ?? [[], undefined]) as [AggregatedReserveData[], unknown];

  const formattedReserves = useFormattedReserves();

  return { selectedChainId, tokens, balances, userReserves, reserves, formattedReserves };
}
