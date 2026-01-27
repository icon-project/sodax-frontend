import { useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { useMutation } from '@tanstack/react-query';
import type { Address, SonicSpokeProvider } from '@sodax/sdk';

/**
 * Executes the partner fee claim (swap + send).
 *
 * WHAT IT DOES:
 * - Calls the SDK swap method to claim fees
 * - Uses the connected wallet & Sonic provider
 *
 * WHAT IT DOES NOT DO:
 * - No validation
 * - No approval checks
 * - No UI state decisions
 *
 * Think of this as:
 * "Do the blockchain transaction."
 */
export function useFeeClaimExecute() {
  const { sodax } = useSodaxContext();
  const walletProvider = useWalletProvider(SONIC_MAINNET_CHAIN_ID);
  const spokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID, walletProvider);

  return useMutation({
    mutationFn: async ({ fromToken, amount }: { fromToken: string; amount: bigint }) => {
      // MOCK CHECK
      if (process.env.NEXT_PUBLIC_USE_PARTNER_MOCKS === 'true') {
        console.log('🛠️ Mock Partner Mode: Simulating Swap Intent...');
        // Wait 2 seconds to simulate blockchain/solver delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { hash: '0xMOCK_TRANSACTION_HASH_FOR_TESTING' };
      }

      // REAL SDK CALL
      if (!sodax || !spokeProvider) throw new Error('SDK or Wallet not ready');
      const result = await sodax.partners.feeClaim.swap({
        params: { fromToken: fromToken as Address, amount },
        spokeProvider: spokeProvider as SonicSpokeProvider,
      });

      if (!result.ok) throw result.error;
      return result.value;
    },
  });
}
