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
    mutationFn: async ({ fromToken, amount }: { fromToken: Address; amount: bigint }) => {
      if (!sodax || !spokeProvider) {
        throw new Error('SDK or Wallet not ready');
      }

      const result = await sodax.partners.feeClaim.swap({
        params: { fromToken, amount },
        spokeProvider: spokeProvider as SonicSpokeProvider,
      });

      if (!result.ok) {
        throw result.error;
      }

      return result.value; // { srcTxHash, intentTxHash, solverExecutionResponse }
    },
  });
}
