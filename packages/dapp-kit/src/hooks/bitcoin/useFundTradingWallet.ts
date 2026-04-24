import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { ChainKeys, type IBitcoinWalletProvider } from '@sodax/types';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export function useFundTradingWallet(
  walletProvider: IBitcoinWalletProvider | undefined,
): UseMutationResult<string, Error, bigint> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<string, Error, bigint>({
    mutationFn: async (amount: bigint) => {
      if (!walletProvider) {
        throw new Error('Bitcoin wallet provider not found');
      }
      const walletAddress = await walletProvider.getWalletAddress();
      return sodax.spokeService.bitcoinSpokeService.fundTradingWallet(amount, walletAddress, walletProvider);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['btc-balance'] });
      queryClient.invalidateQueries({ queryKey: ['trading-wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['xBalances', ChainKeys.BITCOIN_MAINNET] });
    },
  });
}
