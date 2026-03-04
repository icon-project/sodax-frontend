import { baseChainInfo, type ChainId, type ChainType } from '@sodax/types';

export function getXChainType(xChainId: ChainId | undefined): ChainType | undefined {
  if (!xChainId) {
    return undefined;
  }
  return baseChainInfo[xChainId].type;
}
