/**
 * Spoke chain key constants only — no imports from tokens/chains to avoid ESM circular init.
 */
export const ChainTypeArr = [
  'ICON',
  'EVM',
  'INJECTIVE',
  'SUI',
  'STELLAR',
  'SOLANA',
  'STACKS',
  'NEAR',
  'BITCOIN',
] as const;

export const ChainKeys = {
  AVALANCHE_MAINNET: '0xa86a.avax',
  ARBITRUM_MAINNET: '0xa4b1.arbitrum',
  BASE_MAINNET: '0x2105.base',
  BSC_MAINNET: '0x38.bsc',
  INJECTIVE_MAINNET: 'injective-1',
  SONIC_MAINNET: 'sonic',
  ICON_MAINNET: '0x1.icon',
  SUI_MAINNET: 'sui',
  OPTIMISM_MAINNET: '0xa.optimism',
  POLYGON_MAINNET: '0x89.polygon',
  SOLANA_MAINNET: 'solana',
  STELLAR_MAINNET: 'stellar',
  HYPEREVM_MAINNET: 'hyper',
  LIGHTLINK_MAINNET: 'lightlink',
  NEAR_MAINNET: 'near',
  ETHEREUM_MAINNET: 'ethereum',
  BITCOIN_MAINNET: 'bitcoin',
  REDBELLY_MAINNET: 'redbelly',
  KAIA_MAINNET: '0x2019.kaia',
  STACKS_MAINNET: 'stacks',
} as const;

export type ChainKey = (typeof ChainKeys)[keyof typeof ChainKeys];

export const CHAIN_KEYS = Object.values(ChainKeys);
export const spokeChainKeysSet = new Set(CHAIN_KEYS);

export type ChainType = (typeof ChainTypeArr)[number];
