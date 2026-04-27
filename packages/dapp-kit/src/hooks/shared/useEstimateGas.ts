import type { EstimateGasParams, GetEstimateGasReturnType } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useSodaxContext } from './useSodaxContext.js';

export function useEstimateGas<C extends SpokeChainKey>(): UseMutationResult<
  Result<GetEstimateGasReturnType<C>>,
  Error,
  EstimateGasParams<C>
> {
  const { sodax } = useSodaxContext();
  return useMutation<Result<GetEstimateGasReturnType<C>>, Error, EstimateGasParams<C>>({
    mutationFn: (params: EstimateGasParams<C>) => sodax.spokeService.estimateGas<C>(params),
  });
}
