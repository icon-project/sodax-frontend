import { useXAccount, useXBalances, useWalletProvider } from '@sodax/wallet-sdk-react';
import { useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { formatUnits } from 'viem';
import { TokenAsset } from '@/components/shared/token-asset';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import type { XToken } from '@sodax/types';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';

export default function TokenAssetWithSupply({
  token,
  symbol,
  tokens,
  formattedReserves,
  isFormattedReservesLoading,
}: {
  token: XToken;
  symbol: string;
  tokens: XToken[];
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading: boolean;
}) {
  const { address } = useXAccount(token.xChainId);
  const walletProvider = useWalletProvider(token.xChainId);
  const spokeProvider = useSpokeProvider(token.xChainId, walletProvider);
  const { data: balances } = useXBalances({ xChainId: token.xChainId, xTokens: [token], address });

  const { data: userReserves } = useUserReservesData(spokeProvider, address);

  const walletBalance = balances?.[token.address]
    ? Number(formatUnits(balances[token.address] || 0n, token.decimals)).toFixed(4)
    : '0';

  const metrics = useReserveMetrics({
    token,
    formattedReserves: formattedReserves || [],
    userReserves: userReserves?.[0] as UserReserveData[],
  });

  const supplyBalance = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledATokenBalance, 18)).toFixed(4)
    : '0';

  return (
    <TokenAsset
      name={symbol}
      token={token}
      formattedBalance={supplyBalance}
      isHoldToken={true}
      isClickBlurred={false}
      isHoverDimmed={false}
      isHovered={false}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
      onClick={() => {}}
      tokens={tokens}
      onChainClick={() => {}}
      isClicked={false}
    />
  );
}
