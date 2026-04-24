import { normalizePsbtToBase64 } from '@sodax/sdk';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { ChainKeys, type IBitcoinWalletProvider } from '@sodax/types';
import { loadRadfiSession } from './useRadfiAuth.js';
import { useSodaxContext } from '../shared/useSodaxContext.js';

type WithdrawToUserParams = {
  amount: string;
  tokenId: string;
  withdrawTo: string;
};

type WithdrawResult = {
  txId: string;
  fee: number;
};

export function useRadfiWithdraw(
  walletProvider: IBitcoinWalletProvider | undefined,
): UseMutationResult<WithdrawResult, Error, WithdrawToUserParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<WithdrawResult, Error, WithdrawToUserParams>({
    mutationFn: async ({ amount, tokenId, withdrawTo }: WithdrawToUserParams) => {
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

      const buildResult = await radfi.withdrawToUser({ userAddress, amount, tokenId, withdrawTo }, accessToken);

      const signedTx = await walletProvider.signTransaction(buildResult.base64Psbt, false);

      const signedBase64Tx = normalizePsbtToBase64(signedTx);

      const txId = await radfi.signAndBroadcastWithdraw({ userAddress, signedBase64Tx }, accessToken);

      return { txId, fee: buildResult.fee.totalFee };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['btc-balance'] });
      queryClient.invalidateQueries({ queryKey: ['xBalances', ChainKeys.BITCOIN_MAINNET] });
    },
  });
}
