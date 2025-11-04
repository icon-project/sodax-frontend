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
export const HYPEREVM_MAINNET_CHAIN_ID = 'hyper';
export const LIGHTLINK_MAINNET_CHAIN_ID = 'lightlink';
export const NEAR_MAINNET_CHAIN_ID = 'near';
export const ETHEREUM_MAINNET_CHAIN_ID = 'ethereum';

export const HUB_CHAIN_IDS = [SONIC_MAINNET_CHAIN_ID] as const;

// ordered with Sonic first as it can act as both hub and spoke
export const CHAIN_IDS = [
  SONIC_MAINNET_CHAIN_ID,
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
  HYPEREVM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
  NEAR_MAINNET_CHAIN_ID,
] as const;
