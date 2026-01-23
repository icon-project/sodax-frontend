import { useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { useMutation } from '@tanstack/react-query';
import type { Address, SonicSpokeProvider } from '@sodax/sdk';

export function useFeeClaimExecute() {
  const { sodax } = useSodaxContext();
  const walletProvider = useWalletProvider(SONIC_MAINNET_CHAIN_ID);
  const spokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID, walletProvider);

  return useMutation({
    mutationFn: async ({ fromToken, amount }: { fromToken: string; amount: bigint }) => {
      if (!sodax || !spokeProvider) throw new Error('SDK or Wallet not ready');

      // Uses the 'swap' method Robi added for executing the claim
      const result = await sodax.partners.feeClaim.swap({
        params: {
          fromToken: fromToken as Address,
          amount,
        },
        spokeProvider: spokeProvider as SonicSpokeProvider,
      });

      if (!result.ok) throw result.error;
      return result.value;
    },
  });
}
