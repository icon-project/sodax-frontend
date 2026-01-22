import { useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import { SONIC_MAINNET_CHAIN_ID, type Address } from '@sodax/types';
import { useQuery, useMutation } from '@tanstack/react-query';

export function useFeeClaimApproval(token?: Address) {
  const { sodax } = useSodaxContext();
  const walletProvider = useWalletProvider(SONIC_MAINNET_CHAIN_ID);
  const spokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID, walletProvider);

  const check = useQuery({
    queryKey: ['feeClaimApproval', token],
    queryFn: async () => {
      if (!sodax || !spokeProvider || !token) throw new Error('Parameters missing');
      const result = await sodax.partners.feeClaim.isTokenApproved({
        token,
        //TODO
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        spokeProvider: spokeProvider as any,
      });
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!sodax && !!spokeProvider && !!token,
  });

  const approve = useMutation({
    mutationFn: async () => {
      if (!sodax || !spokeProvider || !token) throw new Error('Parameters missing');
      const result = await sodax.partners.feeClaim.approveToken({
        token,
        //TODO
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        spokeProvider: spokeProvider as any,
      });
      if (!result.ok) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      check.refetch();
    },
  });

  return { isApproved: check.data, isLoading: check.isLoading, approve };
}
