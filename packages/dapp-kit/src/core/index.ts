import type { XToken, XChainId } from '@sodax/wallet-sdk';

import { CHAIN_IDS, hubAssets } from '@sodax/sdk';

export const allXTokens: XToken[] = [];

Object.keys(hubAssets).forEach(xChainId => {
  const tokens = hubAssets[xChainId];

  Object.keys(tokens).forEach(tokenAddress => {
    const token = tokens[tokenAddress];
    allXTokens.push({
      xChainId: xChainId as XChainId,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimal,
      address: tokenAddress,
    });

    allXTokens.push({
      // @ts-ignore
      xChainId: CHAIN_IDS.includes(xChainId as XChainId) ? 'sonic' : 'sonic-blaze',
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimal,
      address: token.vault,
    });
  });
});

export const getSpokeTokenAddressByVault = (spokeChainId: XChainId, vault: string) => {
  const tokens = hubAssets[spokeChainId];

  const token = Object.keys(tokens).find(tokenAddress => tokens[tokenAddress].vault === vault);

  if (!token) {
    throw new Error('Token not found');
  }

  return token;
};
