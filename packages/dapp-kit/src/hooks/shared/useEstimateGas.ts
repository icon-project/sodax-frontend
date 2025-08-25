import { type GetEstimateGasReturnType, type SpokeProvider, SpokeService, type TxReturnType } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

export function useEstimateGas<T extends SpokeProvider = SpokeProvider>(
  spokeProvider: T | undefined,
): UseMutationResult<GetEstimateGasReturnType<T>, Error, TxReturnType<T, true>> {
  return useMutation<GetEstimateGasReturnType<T>, Error, TxReturnType<T, true>>({
    mutationFn: async (rawTx: TxReturnType<T, true>) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await SpokeService.estimateGas(rawTx, spokeProvider);

      return response;
    },
  });
}
