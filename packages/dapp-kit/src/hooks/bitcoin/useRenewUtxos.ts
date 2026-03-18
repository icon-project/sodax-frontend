import { normalizePsbtToBase64, type BitcoinSpokeProvider } from '@sodax/sdk';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { loadRadfiSession } from './useRadfiAuth';

type RenewUtxosParams = {
  txIdVouts: string[];
};

/**
 * Hook to renew expired UTXOs in the Radfi trading wallet.
 *
 * Flow:
 * 1. Build renew-utxo transaction via Radfi API (returns unsigned PSBT)
 * 2. User signs the PSBT with their wallet
 * 3. Submit signed PSBT back to Radfi for co-signing and broadcasting
 *
 * @example
 * ```tsx
 * const { mutateAsync: renewUtxos, isPending } = useRenewUtxos(spokeProvider);
 *
 * const handleRenew = async (expiredUtxos: RadfiUtxo[]) => {
 *   const txIdVouts = expiredUtxos.map(u => `${u.txId}:${u.vout}`);
 *   const txId = await renewUtxos({ txIdVouts });
 *   console.log('Renewed:', txId);
 * };
 * ```
 */
export function useRenewUtxos(
  spokeProvider: BitcoinSpokeProvider | undefined,
): UseMutationResult<string, Error, RenewUtxosParams> {
  const queryClient = useQueryClient();

  return useMutation<string, Error, RenewUtxosParams>({
    mutationFn: async ({ txIdVouts }: RenewUtxosParams) => {
      if (!spokeProvider) {
        throw new Error('Bitcoin spoke provider not found');
      }

      const userAddress = await spokeProvider.walletProvider.getWalletAddress();
      const session = loadRadfiSession(userAddress);
      const accessToken = session?.accessToken || spokeProvider.radfiAccessToken;

      if (!accessToken) {
        throw new Error('Radfi authentication required. Please login first.');
      }

      // Step 1: Build the renew-utxo transaction
      const buildResult = await spokeProvider.radfi.buildRenewUtxoTransaction(
        { userAddress, txIdVouts },
        accessToken,
      );

      // Step 2: Sign the PSBT with user's wallet
      const signedTx = await spokeProvider.walletProvider.signTransaction(
        buildResult.base64Psbt,
        false,
      );

      const signedBase64Tx = normalizePsbtToBase64(signedTx);

      // Step 3: Submit to Radfi for co-signing and broadcasting
      return spokeProvider.radfi.signAndBroadcastRenewUtxo(
        { userAddress, signedBase64Tx },
        accessToken,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expired-utxos'] });
      queryClient.invalidateQueries({ queryKey: ['trading-wallet-balance'] });
    },
  });
}
