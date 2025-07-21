import type { ChainId } from '@sodax/types';

import { hubAssets } from '@sodax/sdk';

export const getSpokeTokenAddressByVault = (spokeChainId: ChainId, vault: string) => {
  const tokens = hubAssets[spokeChainId];
  const address = Object.keys(tokens).find(
    tokenAddress => tokens[tokenAddress].vault.toLowerCase() === vault.toLowerCase(),
  );

  return address;
};
