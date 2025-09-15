import { type SpokeProvider, StellarSpokeProvider, StellarSpokeService, type TxReturnType } from '@sodax/sdk';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';

export function useRequestTrustline<T extends SpokeProvider = SpokeProvider>(
  token: string | undefined,
): UseMutationResult<
  TxReturnType<StellarSpokeProvider, false>,
  Error,
  {
    token: string;
    amount: bigint;
    spokeProvider: T;
  }
> {
  const queryClient = useQueryClient();

  return useMutation<
    TxReturnType<StellarSpokeProvider, false>,
    Error,
    {
      token: string;
      amount: bigint;
      spokeProvider: T;
    }
  >({
    mutationFn: async ({
      token,
      amount,
      spokeProvider,
    }: {
      token: string;
      amount: bigint;
      spokeProvider: T;
    }) => {
      if (!spokeProvider || !token || !amount || !(spokeProvider instanceof StellarSpokeProvider)) {
        throw new Error('Spoke provider, token or amount not found');
      }

      return StellarSpokeService.requestTrustline(token, amount, spokeProvider);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stellar-trustline-check', token] });
    },
  });
}
