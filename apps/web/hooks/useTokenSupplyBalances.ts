import { formatUnits } from 'viem';
import type { XToken } from '@sodax/types';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';

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

  tokens.map(t => {
    const { address } = useXAccount(t.xChainId);
    const walletProvider = useWalletProvider(t.xChainId);
    const spokeProvider = useSpokeProvider(t.xChainId, walletProvider);
    const { data: userReserves } = useUserReservesData({ spokeProvider, address });

    const metrics = useReserveMetrics({
      token: t,
      formattedReserves: formattedReserves || [],
      userReserves: (userReserves?.[0] as UserReserveData[]) || [],
    });

    const supplyBalance = metrics.userReserve
      ? Number(formatUnits(metrics.userReserve.scaledATokenBalance, 18)).toFixed(4)
      : '0';

    allBalances.push({
      ...t,
      supplyBalance,
    });
  });

  return allBalances;
}
