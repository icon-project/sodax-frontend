// import { BitcoinSpokeService, type BitcoinSpokeProvider } from '@sodax/sdk';
// import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
//
// /**
//  * Hook to fund the Radfi trading wallet by sending BTC from the user's personal wallet.
//  *
//  * @param {BitcoinSpokeProvider | undefined} spokeProvider - The Bitcoin spoke provider with signing capability
//  * @returns {UseMutationResult} Mutation result — input is amount in satoshis, output is transaction ID
//  *
//  * @example
//  * ```tsx
//  * const { mutateAsync: fundWallet, isPending } = useFundTradingWallet(spokeProvider);
//  *
//  * const handleFund = async () => {
//  *   const txId = await fundWallet(100_000n); // fund 100,000 satoshis
//  *   console.log('Funded:', txId);
//  * };
//  * ```
//  */
// export function useFundTradingWallet(
//   spokeProvider: BitcoinSpokeProvider | undefined,
// ): UseMutationResult<string, Error, bigint> {
//   const queryClient = useQueryClient();
//
//   return useMutation<string, Error, bigint>({
//     mutationFn: async (amount: bigint) => {
//       if (!spokeProvider) {
//         throw new Error('Bitcoin spoke provider not found');
//       }
//
//       return BitcoinSpokeService.fundTradingWallet(amount, spokeProvider);
//     },
//     onSuccess: () => {
//       // Invalidate balance queries to reflect the fund transfer
//       queryClient.invalidateQueries({ queryKey: ['btc-balance'] });
//       queryClient.invalidateQueries({ queryKey: ['xBalances'] });
//     },
//   });
// }
//
