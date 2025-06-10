import { useSodaxContext } from './useSodaxContext';
import type { CreateIntentParams, SpokeChainId } from '@sodax/sdk';
import { useSpokeProvider } from './useSpokeProvider';

export function useCreateIntentOrder(chainId: SpokeChainId) {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(chainId);

  const createIntentOrder = async (createIntentParams: CreateIntentParams) => {
    if (!spokeProvider) {
      throw new Error('Spoke provider not found');
    }
    const result = await sodax.solver.createAndSubmitIntent(createIntentParams, spokeProvider);
    return result;
  };

  return { createIntentOrder };
}
