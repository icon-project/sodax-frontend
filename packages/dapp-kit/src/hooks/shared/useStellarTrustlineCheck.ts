import { ChainKeys, type IStellarWalletProvider, type SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from './useSodaxContext.js';

export function useStellarTrustlineCheck(
  token: string | undefined,
  amount: bigint | undefined,
  chainId: SpokeChainKey | undefined,
  walletProvider: IStellarWalletProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();
  return useQuery({
    queryKey: ['stellar-trustline-check', token],
    queryFn: async () => {
      if (chainId !== ChainKeys.STELLAR_MAINNET) return true;
      if (!walletProvider || !token || !amount) return false;
      const walletAddress = await walletProvider.getWalletAddress();
      return sodax.spokeService.stellarSpokeService.hasSufficientTrustline(token, amount, walletAddress);
    },
    enabled: !!walletProvider && !!token && !!amount,
  });
}
