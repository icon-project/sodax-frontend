import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { RadfiWalletBalance } from '@sodax/sdk';
import type { IBitcoinWalletProvider } from '@sodax/types';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export function useTradingWalletBalance(
  walletProvider: IBitcoinWalletProvider | undefined,
  tradingAddress: string | undefined,
): UseQueryResult<RadfiWalletBalance, Error> {
  const { sodax } = useSodaxContext();
  return useQuery<RadfiWalletBalance, Error>({
    queryKey: ['trading-wallet-balance', tradingAddress],
    queryFn: () => {
      if (!walletProvider || !tradingAddress) {
        throw new Error('walletProvider and tradingAddress are required');
      }
      return sodax.spokeService.bitcoinSpokeService.radfi.getBalance(tradingAddress);
    },
    enabled: !!walletProvider && !!tradingAddress,
  });
}
