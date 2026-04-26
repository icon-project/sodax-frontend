import { normalizePsbtToBase64 } from '@sodax/sdk';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { IBitcoinWalletProvider } from '@sodax/types';
import { loadRadfiSession } from './useRadfiAuth.js';
import { useSodaxContext } from '../shared/useSodaxContext.js';

type RenewUtxosParams = {
  txIdVouts: string[];
};

export function useRenewUtxos(
  walletProvider: IBitcoinWalletProvider | undefined,
): UseMutationResult<string, Error, RenewUtxosParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<string, Error, RenewUtxosParams>({
    mutationFn: async ({ txIdVouts }: RenewUtxosParams) => {
      if (!walletProvider) {
        throw new Error('Bitcoin wallet provider not found');
      }
      const radfi = sodax.spokeService.bitcoinSpokeService.radfi;

      const userAddress = await walletProvider.getWalletAddress();
      const session = loadRadfiSession(userAddress);
      const accessToken = session?.accessToken || radfi.accessToken;

      if (!accessToken) {
        throw new Error('Radfi authentication required. Please login first.');
      }

      const buildResult = await radfi.buildRenewUtxoTransaction({ userAddress, txIdVouts }, accessToken);

      const signedTx = await walletProvider.signTransaction(buildResult.base64Psbt, false);

      const signedBase64Tx = normalizePsbtToBase64(signedTx);

      return radfi.signAndBroadcastRenewUtxo({ userAddress, signedBase64Tx }, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expired-utxos'] });
      queryClient.invalidateQueries({ queryKey: ['trading-wallet-balance'] });
    },
  });
}
