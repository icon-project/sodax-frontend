import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
} from '@sodax/types';

export interface ChainUI {
  id: string;
  name: string;
  icon: string;
  icon16: string;
}

/**
 * Available chains for UI components with display information
 * Maps SPOKE_CHAIN_IDS to human-readable names and icon paths
 */
export const availableChains: ChainUI[] = [
  { id: SONIC_MAINNET_CHAIN_ID, name: 'Sonic', icon: '/chain/sonic.png', icon16: '/chain/sonic_16.png' },
  {
    id: AVALANCHE_MAINNET_CHAIN_ID,
    name: 'Avalanche',
    icon: '/chain/0xa86a.avax.png',
    icon16: '/chain/0xa86a.avax_16.png',
  },
  {
    id: ARBITRUM_MAINNET_CHAIN_ID,
    name: 'Arbitrum',
    icon: '/chain/0xa4b1.arbitrum.png',
    icon16: '/chain/0xa4b1.arbitrum_16.png',
  },
  { id: BASE_MAINNET_CHAIN_ID, name: 'Base', icon: '/chain/0x2105.base.png', icon16: '/chain/0x2105.base_16.png' },
  { id: BSC_MAINNET_CHAIN_ID, name: 'BSC', icon: '/chain/0x38.bsc.png', icon16: '/chain/0x38.bsc_16.png' },
  {
    id: INJECTIVE_MAINNET_CHAIN_ID,
    name: 'Injective',
    icon: '/chain/injective-1.png',
    icon16: '/chain/injective-1_16.png',
  },
  { id: SUI_MAINNET_CHAIN_ID, name: 'Sui', icon: '/chain/sui.png', icon16: '/chain/sui_16.png' },
  {
    id: OPTIMISM_MAINNET_CHAIN_ID,
    name: 'Optimism',
    icon: '/chain/0xa.optimism.png',
    icon16: '/chain/0xa.optimism_16.png',
  },
  {
    id: POLYGON_MAINNET_CHAIN_ID,
    name: 'Polygon',
    icon: '/chain/0x89.polygon.png',
    icon16: '/chain/0x89.polygon_16.png',
  },
  { id: SOLANA_MAINNET_CHAIN_ID, name: 'Solana', icon: '/chain/solana.png', icon16: '/chain/solana_16.png' },
  { id: STELLAR_MAINNET_CHAIN_ID, name: 'Stellar', icon: '/chain/stellar.png', icon16: '/chain/stellar_16.png' },
  { id: ICON_MAINNET_CHAIN_ID, name: 'Icon', icon: '/chain/0x1.icon.png', icon16: '/chain/0x1.icon_16.png' },
  {
    id: LIGHTLINK_MAINNET_CHAIN_ID,
    name: 'Lightlink',
    icon: '/chain/lightlink.png',
    icon16: '/chain/lightlink_16.png',
  },
];

/**
 * Helper function to get chain UI data by chain ID
 */
export const getChainUI = (chainId: string): ChainUI | undefined => {
  return availableChains.find(chain => chain.id === chainId);
};

/**
 * Helper function to get chain name by chain ID
 */
export const getChainName = (chainId: string): string | undefined => {
  return getChainUI(chainId)?.name;
};

/**
 * Helper function to get chain icon by chain ID
 */
export const getChainIcon = (chainId: string): string | undefined => {
  return getChainUI(chainId)?.icon;
};

/**
 * Helper function to get chain icon by chain name
 * Searches for a chain by its display name and returns the icon path
 */
export const getChainIconByName = (chainName: string): string | undefined => {
  const chain = availableChains.find(chain => chain.name.toLowerCase() === chainName.toLowerCase());
  return chain?.icon;
};
