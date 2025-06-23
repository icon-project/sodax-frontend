import type { XToken, ChainId } from '@sodax/types';

import { hubAssets } from '@sodax/sdk';

export const allXTokens: XToken[] = [];

Object.keys(hubAssets).forEach(xChainId => {
  const tokens = hubAssets[xChainId];

  Object.keys(tokens).forEach(tokenAddress => {
    const token = tokens[tokenAddress];
    allXTokens.push({
      xChainId: xChainId as ChainId,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimal,
      address: tokenAddress,
    });

    allXTokens.push({
      xChainId: 'sonic',
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimal,
      address: token.vault,
    });
  });
});

export const getSpokeTokenAddressByVault = (spokeChainId: ChainId, vault: string) => {
  const tokens = hubAssets[spokeChainId];
  const address = Object.keys(tokens).find(tokenAddress => tokens[tokenAddress].vault === vault);

  return address;
};
