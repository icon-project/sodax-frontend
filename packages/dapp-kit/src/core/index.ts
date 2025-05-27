import type { XToken, XChainId } from '@new-world/xwagmi';

import { MAINNET_CHAIN_IDS, hubAssets } from '@new-world/sdk';

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
      xChainId: MAINNET_CHAIN_IDS.includes(xChainId as XChainId) ? 'sonic' : 'sonic-blaze',
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimal,
      address: token.address,
    });
  });
});
