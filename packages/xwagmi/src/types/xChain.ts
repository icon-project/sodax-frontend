export type XChainId =
  | 'archway'
  | '0x1.icon'
  | '0x2.icon'
  | '0xa86a.avax'
  | '0xa869.fuji'
  | '0x38.bsc'
  | '0xa4b1.arbitrum'
  | '0x2105.base'
  | '0xa.optimism'
  | 'injective-1'
  | 'sui'
  | 'stellar'
  | 'solana'
  | 'sonic-blaze'
  | 'sonic'
  | '0x89.polygon';

export type XChainType = 'ICON' | 'EVM' | 'ARCHWAY' | 'HAVAH' | 'INJECTIVE' | 'SUI' | 'STELLAR' | 'SOLANA';

export type Chain = {
  id: string | number;
  name: string;
  testnet: boolean;
};

export type XChain = Chain & {
  xChainId: XChainId;
  xChainType: XChainType;
};
