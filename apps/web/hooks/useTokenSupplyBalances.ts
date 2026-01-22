import { formatUnits } from 'viem';
import type { XToken } from '@sodax/types';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { useATokensBalances, useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { isAddress, type Address } from 'viem';
import { useMemo } from 'react';
/**
 * React hook that calculates supply balances for multiple tokens,
 * supporting tokens across multiple chains.
 *
 * @param {XToken[]} tokens - Array of tokens to calculate supply balances for.
 * @param {FormatReserveUSDResponse[]} formattedReserves - USD-normalized reserve data.
 *
 * @returns {Array<XToken & { supplyBalance: string }>} Tokens enriched with supplyBalance.
 */
export function useTokenSupplyBalances(
  tokens: XToken[],
  formattedReserves: FormatReserveUSDResponse[],
): Array<XToken & { supplyBalance: string }> {
  const allBalances: Array<XToken & { supplyBalance: string }> = [];
  const aTokenAddresses = useMemo(() => {
    if (!formattedReserves) return [];
    return formattedReserves
      .map(reserve => reserve.aTokenAddress)
      .filter((address): address is `0x${string}` => isAddress(address));
  }, [formattedReserves]);

  tokens.map(t => {
    const { address } = useXAccount(t.xChainId);
    const walletProvider = useWalletProvider(t.xChainId);
    const spokeProvider = useSpokeProvider(t.xChainId, walletProvider);
    const { data: userReserves } = useUserReservesData({ spokeProvider, address });
    const { data: aTokenBalancesMap } = useATokensBalances({
      aTokens: aTokenAddresses,
      spokeProvider,
      userAddress: address,
    });

    const metrics = useReserveMetrics({
      token: t,
      formattedReserves: formattedReserves || [],
      userReserves: (userReserves?.[0] as UserReserveData[]) || [],
    });

    const aTokenAddress = metrics.formattedReserve?.aTokenAddress;
    const aTokenBalance =
      aTokenAddress && isAddress(aTokenAddress) && aTokenBalancesMap
        ? aTokenBalancesMap.get(aTokenAddress as Address)
        : undefined;

    const formattedBalance =
      aTokenBalance !== undefined ? Number(formatUnits(aTokenBalance, 18)).toFixed(4) : undefined;

    allBalances.push({
      ...t,
      supplyBalance: formattedBalance || '0',
    });
  });

  return allBalances;
}
