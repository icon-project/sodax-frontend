import type { ChainType } from '@sodax/types';
import type { XService } from '../core';
import { useXWalletStore } from '../useXWalletStore';

export function useXService(xChainType: ChainType | undefined): XService | undefined {
  const xService = useXWalletStore(state => (xChainType ? state.xServices[xChainType] : undefined));
  return xService;
}
