import type { ChainType } from '@sodax/types';
import type { XService } from '../core';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXService(xChainType: ChainType | undefined): XService | undefined {
  const xService = useXWagmiStore(state => (xChainType ? state.xServices[xChainType] : undefined));
  return xService;
}
