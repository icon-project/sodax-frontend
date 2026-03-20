import { normalizePsbtToBase64, type BitcoinSpokeProvider } from '@sodax/sdk';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { loadRadfiSession } from './useRadfiAuth';

type WithdrawToUserParams = {
  amount: string;
  tokenId: string;
  withdrawTo: string;
};

type WithdrawResult = {
  txId: string;
  fee: number;
};

/**
 * Hook to withdraw BTC from Radfi trading wallet to user's personal wallet.
 *
 * Flow:
 * 1. Build withdraw transaction via Radfi API (returns unsigned PSBT)
 * 2. User signs the PSBT with their wallet
 * 3. Submit signed PSBT back to Radfi for co-signing and broadcasting
 *
 * @example
 * ```tsx
 * const { mutateAsync: withdraw, isPending } = useRadfiWithdraw(spokeProvider);
 *
 * const handleWithdraw = async () => {
 *   const result = await withdraw({
 *     amount: '10000',
 *     tokenId: '0:0',
 *     withdrawTo: 'bc1q...', // user's segwit address
 *   });
 *   console.log('Withdrawn:', result.txId);
 * };
 * ```
 */
export function useRadfiWithdraw(
  spokeProvider: BitcoinSpokeProvider | undefined,
): UseMutationResult<WithdrawResult, Error, WithdrawToUserParams> {
  const queryClient = useQueryClient();

  return useMutation<WithdrawResult, Error, WithdrawToUserParams>({
    mutationFn: async ({ amount, tokenId, withdrawTo }: WithdrawToUserParams) => {
      if (!spokeProvider) {
        throw new Error('Bitcoin spoke provider not found');
      }

      const userAddress = await spokeProvider.walletProvider.getWalletAddress();
      const session = loadRadfiSession(userAddress);
      const accessToken = session?.accessToken || spokeProvider.radfiAccessToken;

      if (!accessToken) {
        throw new Error('Radfi authentication required. Please login first.');
      }

      // Step 1: Build the withdraw transaction
      const buildResult = await spokeProvider.radfi.withdrawToUser(
        { userAddress, amount, tokenId, withdrawTo },
        accessToken,
      );

      // Step 2: Sign the PSBT with user's wallet
      const signedTx = await spokeProvider.walletProvider.signTransaction(
        buildResult.base64Psbt,
        false,
      );

      const signedBase64Tx = normalizePsbtToBase64(signedTx);

      // Step 3: Submit to Radfi for co-signing and broadcasting
      const txId = await spokeProvider.radfi.signAndBroadcastWithdraw(
        { userAddress, signedBase64Tx },
        accessToken,
      );

      return { txId, fee: buildResult.fee.totalFee };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['btc-balance'] });
      queryClient.invalidateQueries({ queryKey: ['xBalances'] });
    },
  });
}
