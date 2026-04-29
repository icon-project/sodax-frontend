import type { AssetDepositAction, HubTxHash, SpokeTxHash } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useDexDeposit}. Generic over `K extends SpokeChainKey` (defaults
 * to the full union). Sophisticated callers can lock K at the hook call site to narrow the
 * `walletProvider` and `params.srcChainKey` types.
 */
export type UseDexDepositVars<K extends SpokeChainKey = SpokeChainKey> = Omit<AssetDepositAction<K, false>, 'raw'>;

type DexDepositResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for depositing an asset into a DEX pool. Pure mutation: all inputs (params,
 * walletProvider) are passed to `mutate({...})`. Returns the SDK `Result<T>` as-is; callers branch
 * on `data?.ok`.
 *
 * @example
 * ```tsx
 * const walletProvider = useWalletProvider(chainKey);
 * const { mutateAsync: deposit } = useDexDeposit();
 * const result = await deposit({ params, walletProvider });
 * if (result.ok) { const [spokeTxHash, hubTxHash] = result.value; }
 * ```
 */
export function useDexDeposit<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  DexDepositResult,
  Error,
  UseDexDepositVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<DexDepositResult, Error, UseDexDepositVars<K>>({
    mutationFn: async vars => {
      return sodax.dex.assetService.deposit({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances', params.srcChainKey, params.srcAddress] });
      queryClient.invalidateQueries({
        queryKey: ['dex', 'allowance', params.srcChainKey, params.asset, params.amount.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.srcChainKey] });
    },
  });
}
