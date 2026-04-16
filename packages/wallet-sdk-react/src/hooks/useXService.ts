import type { ChainType } from '@sodax/types';
import type { XService } from '../core/index.js';
import { useXWalletStore } from '../useXWalletStore.js';

export function useXService(xChainType: ChainType | undefined): XService | undefined {
  const xService = useXWalletStore(state => (xChainType ? state.xServices[xChainType] : undefined));
  return xService;
}
