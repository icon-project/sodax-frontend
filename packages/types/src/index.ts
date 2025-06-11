// chain ids (actual for evm chains), custom for other chains not having native ids
export const AVALANCHE_MAINNET_CHAIN_ID = '0xa86a.avax';
export const ARBITRUM_MAINNET_CHAIN_ID = '0xa4b1.arbitrum';
export const BASE_MAINNET_CHAIN_ID = '0x2105.base';
export const BSC_MAINNET_CHAIN_ID = '0x38.bsc';
export const INJECTIVE_MAINNET_CHAIN_ID = 'injective-1';
export const SONIC_MAINNET_CHAIN_ID = 'sonic';
export const ICON_MAINNET_CHAIN_ID = '0x1.icon';
export const SUI_MAINNET_CHAIN_ID = 'sui';
export const OPTIMISM_MAINNET_CHAIN_ID = '0xa.optimism';
export const POLYGON_MAINNET_CHAIN_ID = '0x89.polygon';
export const SOLANA_MAINNET_CHAIN_ID = 'solana';
export const STELLAR_MAINNET_CHAIN_ID = 'stellar';
export const NIBIRU_MAINNET_CHAIN_ID = 'nibiru';

// currently supported spoke chains
export const SPOKE_CHAIN_IDS = [
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
] as const;

export const HUB_CHAIN_IDS = [SONIC_MAINNET_CHAIN_ID] as const;

export const CHAIN_IDS = [
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
] as const;

export type HubChainId = (typeof HUB_CHAIN_IDS)[number];

export type SpokeChainId = (typeof SPOKE_CHAIN_IDS)[number];

export type ChainId = (typeof CHAIN_IDS)[number];

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

export type ChainType = 'evm' | 'cosmos' | 'stellar' | 'icon' | 'sui' | 'solana';

export type Chain = {
  id: string | number;
  name: string;
  testnet: boolean;
};

export type XChain = Chain & {
  xChainId: XChainId;
  xChainType: XChainType;
};

export type Token = {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
};

export type XToken = Token & {
  xChainId: XChainId;
};
