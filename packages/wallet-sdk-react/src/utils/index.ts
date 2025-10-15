import { xChainMap } from '@/constants/xChains';
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

export const getWagmiChainId = (xChainId: ChainId): number => {
  return xChainMap[xChainId].id as number;
};
