import type { ChainId, ChainType } from '@sodax/types';

import { xChainMap } from '@/constants/xChains';

export function getXChainType(xChainId: ChainId | undefined): ChainType | undefined {
  if (!xChainId) {
    return undefined;
  }
  return xChainMap[xChainId].xChainType;
}
