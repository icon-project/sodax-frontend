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
      if (!sodax || !spokeProvider) {
        throw new Error('SDK or Wallet not ready');
      }

      // 1️⃣ Create intent → THIS returns the tx hash
      const txResult = await sodax.partners.feeClaim.createIntentAutoSwap({
        params: { fromToken: fromToken as Address, amount },
        spokeProvider: spokeProvider as SonicSpokeProvider,
      });

      if (!txResult.ok) throw txResult.error;

      const txHash = txResult.value; // ✅ REAL hash

      // 2️⃣ Fire-and-forget solver execution
      sodax.partners.feeClaim
        .swap({
          params: { fromToken: fromToken as Address, amount },
          spokeProvider: spokeProvider as SonicSpokeProvider,
        })
        .catch(err => {
          console.error('Solver execution failed (post-tx):', err);
        });

      return {
        txHash,
      };
    },
  });
}
