import { baseChainInfo, type SpokeChainKey, type ChainType } from '@sodax/types';

export function getXChainType(xChainId: SpokeChainKey | undefined): ChainType | undefined {
  if (!xChainId) {
    return undefined;
  }
  return baseChainInfo[xChainId].type;
}
