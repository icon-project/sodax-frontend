import { useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import { SONIC_MAINNET_CHAIN_ID, type Address } from '@sodax/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SetSwapPreferenceParams, SonicSpokeProvider } from '../../../../../../packages/sdk/dist';

/**
 * Handles partner auto-swap preferences (destination).
 *
 * WHAT IT DOES:
 * - Fetches the current auto-swap destination (chain, token, address)
 * - Allows updating that destination via the SDK
 *
 * WHAT IT DOES NOT DO:
 * - Does not decide if fees are claimable
 * - Does not format balances
 *
 * Think of this as:
 * "Where should claimed fees be sent?"
 */
export function useFeeClaimPreferences(address?: Address) {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();
  const walletProvider = useWalletProvider(SONIC_MAINNET_CHAIN_ID);
  const spokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID, walletProvider);

  // FETCH current preferences
  const query = useQuery({
    queryKey: ['feeClaimPrefs', address],
    queryFn: async () => {
      if (!address || !sodax) throw new Error('SDK or Address missing');
      const result = await sodax.partners.feeClaim.getAutoSwapPreferences({ address });
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!sodax && !!address,
  });

  // UPDATE preferences
  const updateMutation = useMutation({
    mutationFn: async (params: SetSwapPreferenceParams) => {
      if (!sodax || !spokeProvider) throw new Error('SDK or Provider not ready');
      const result = await sodax.partners.feeClaim.setSwapPreference({
        params,
        spokeProvider: spokeProvider as SonicSpokeProvider,
      });
      if (!result.ok) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      // Re-fetch preferences after update
      queryClient.invalidateQueries({ queryKey: ['feeClaimPrefs', address] });
    },
  });

  return { ...query, updateMutation };
}
