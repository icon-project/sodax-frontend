import { baseChainInfo, type SpokeChainKey, type GetChainType, type ChainType } from '@sodax/types';

/**
 * `GetChainType` only accepts `SpokeChainKey | ChainType` — it cannot be given `undefined`.
 * When the generic may include `undefined`, narrow with `Exclude` and only union `undefined` on the result.
 */
export type GetXChainReturnType<K extends SpokeChainKey | undefined> = K extends SpokeChainKey
  ? GetChainType<K>
  : K extends undefined
    ? undefined
    : ChainType | undefined;

export function getXChainType<K extends SpokeChainKey>(xChainId: K | undefined): GetXChainReturnType<K | undefined> {
  if (!xChainId) {
    return undefined as GetXChainReturnType<K | undefined>;
  }
  return baseChainInfo[xChainId].type as GetXChainReturnType<K | undefined>;
}