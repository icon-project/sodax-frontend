import type { GetWalletProviderType, SpokeChainKey } from '@sodax/types';

/**
 * @deprecated The SDK no longer uses `SpokeProvider` objects. Prefer `useWalletProvider(chainId)` from
 * `@sodax/wallet-sdk-react` and pass `(srcChainKey, walletProvider)` into dapp-kit hooks.
 *
 * This helper only returns the wallet provider you pass in, so existing call sites can migrate
 * incrementally before removing the extra call.
 */
export function useSpokeProvider<K extends SpokeChainKey>(
  _chainId: K | undefined,
  walletProvider: GetWalletProviderType<K> | undefined,
): GetWalletProviderType<K> | undefined {
  return walletProvider;
}
