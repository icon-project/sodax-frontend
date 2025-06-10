import type { XChainId, XChainType } from '@/types';

import { xChainMap } from '@/constants/xChains';

export function getXChainType(xChainId: XChainId | undefined): XChainType | undefined {
  if (!xChainId) {
    return undefined;
  }
  return xChainMap[xChainId].xChainType;
}
