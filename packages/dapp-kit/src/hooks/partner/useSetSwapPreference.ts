import type { SetSwapPreferenceAction, TxReturnType } from '@sodax/sdk';
import type { HubChainKey, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useSetSwapPreference}. Generic over `K extends SpokeChainKey`
 * for compatibility with the SDK signature; at runtime the SDK enforces hub-only
 * (`isHubChainKeyType(srcChainKey)`).
 */
export type UseSetSwapPreferenceVars<K extends SpokeChainKey = SpokeChainKey> = Omit<
  SetSwapPreferenceAction<K, false>,
  'raw'
>;

type SetSwapPreferenceResult<K extends SpokeChainKey> = Result<TxReturnType<K, false>>;

/**
 * React hook to set the partner's auto-swap preferences (output token + destination chain +
 * destination address) on the protocol-intents contract. Pure mutation: returns the SDK
 * `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useSetSwapPreference<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  SetSwapPreferenceResult<K>,
  Error,
  UseSetSwapPreferenceVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<SetSwapPreferenceResult<K>, Error, UseSetSwapPreferenceVars<K>>({
    mutationFn: async vars => {
      return sodax.partners.feeClaim.setSwapPreference({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({
        queryKey: ['partner', 'feeClaim', 'autoSwapPreferences', (params as { srcAddress: string }).srcAddress],
      });
    },
  });
}

// Helper alias for the common Sonic-only call shape.
export type UseSetSwapPreferenceVarsHub = UseSetSwapPreferenceVars<HubChainKey>;
