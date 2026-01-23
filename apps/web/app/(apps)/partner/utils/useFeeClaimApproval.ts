import { useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import { isSonicSpokeProviderType } from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID, type Address } from '@sodax/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useFeeClaimApproval(token?: Address) {
  const { sodax } = useSodaxContext();
  const walletProvider = useWalletProvider(SONIC_MAINNET_CHAIN_ID);
  const spokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID, walletProvider);
  const queryClient = useQueryClient();

  // Check if it's the native token (e.g., Sonic/S)
  const isNative = useMemo(() => {
    if (!spokeProvider || !token) return false;
    return token.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase();
  }, [spokeProvider, token]);

  const check = useQuery({
    queryKey: ['feeClaimApproval', token],
    queryFn: async () => {
      if (isNative) return true; // Native is always "approved"
      if (!sodax || !spokeProvider || !token) throw new Error('Parameters missing');
      if (!isSonicSpokeProviderType(spokeProvider)) throw new Error('Unsupported provider');
      const result = await sodax.partners.feeClaim.isTokenApproved({
        token,
        spokeProvider,
      });
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!sodax && !!spokeProvider && !!token,
    // for better "returning user" experience:
    staleTime: 1000 * 60 * 5, // data fresh for 5 minutes
    refetchOnWindowFocus: true, // Re-check when they come back to the tab
  });

  const approve = useMutation({
    mutationFn: async () => {
      if (!sodax || !spokeProvider || !token) throw new Error('Parameters missing');
      if (!isSonicSpokeProviderType(spokeProvider)) throw new Error('Unsupported provider');
      const result = await sodax.partners.feeClaim.approveToken({
        token,
        spokeProvider,
      });
      if (!result.ok) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeClaimApproval', token] });
    },
  });

  return { isApproved: check.data, isLoading: check.isLoading, approve };
}
