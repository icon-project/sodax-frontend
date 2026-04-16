import type { ChainType } from '@sodax/types';

import type { XService } from '../core/index.js';
import { useXWalletStore } from '../useXWalletStore.js';

export function getXService(xChainType: ChainType): XService {
  const service = useXWalletStore.getState().xServices[xChainType];
  if (!service) {
    throw new Error(`XService for chain type "${xChainType}" is not initialized. Is the chain enabled in config?`);
  }
  return service;
}
