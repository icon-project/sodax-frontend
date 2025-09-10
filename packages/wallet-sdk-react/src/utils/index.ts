import type { ChainId, XToken } from '@sodax/types';

export const isNativeToken = (xToken: XToken) => {
  const nativeAddresses = [
    'cx0000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000',
    'inj',
    '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    'hx0000000000000000000000000000000000000000',
    '11111111111111111111111111111111', // solana
    'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA', // stellar,
  ];

  return nativeAddresses.includes(xToken.address);
};

// TODO: remove this? move to dapp-kit?
export const getWagmiChainId = (xChainId: ChainId): number => {
  const xChainMap = {
    '0xa869.fuji': 43113,
    'sonic-blaze': 57054,
    sonic: 146,
    '0xa86a.avax': 43114,
    '0x38.bsc': 56,
    '0xa4b1.arbitrum': 42161,
    '0x2105.base': 8453,
    '0xa.optimism': 10,
    '0x89.polygon': 137,
  } as const;

  return xChainMap[xChainId] ?? 0;
};
