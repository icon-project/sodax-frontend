// apps/web/constants/chains.ts
import { SPOKE_CHAIN_IDS } from '@sodax/types';

export interface ChainUI {
  id: string;
  name: string;
  icon: string;
}

/**
 * Available chains for UI components with display information
 * Maps SPOKE_CHAIN_IDS to human-readable names and icon paths
 */
export const availableChains: ChainUI[] = [
  { id: SPOKE_CHAIN_IDS[0], name: 'Sonic', icon: '/chain/sonic.png' },
  { id: SPOKE_CHAIN_IDS[1], name: 'Avalanche', icon: '/chain/0xa86a.avax.png' },
  { id: SPOKE_CHAIN_IDS[2], name: 'Arbitrum', icon: '/chain/0xa4b1.arbitrum.png' },
  { id: SPOKE_CHAIN_IDS[3], name: 'Base', icon: '/chain/0x2105.base.png' },
  { id: SPOKE_CHAIN_IDS[4], name: 'BSC', icon: '/chain/0x38.bsc.png' },
  { id: SPOKE_CHAIN_IDS[5], name: 'Injective', icon: '/chain/injective-1.png' },
  { id: SPOKE_CHAIN_IDS[6], name: 'Sui', icon: '/chain/sui.png' },
  { id: SPOKE_CHAIN_IDS[7], name: 'Optimism', icon: '/chain/0xa.optimism.png' },
  { id: SPOKE_CHAIN_IDS[8], name: 'Polygon', icon: '/chain/0x89.polygon.png' },
  { id: SPOKE_CHAIN_IDS[9], name: 'Solana', icon: '/chain/solana.png' },
  { id: SPOKE_CHAIN_IDS[11], name: 'Stellar', icon: '/chain/stellar.png' },
  { id: SPOKE_CHAIN_IDS[10], name: 'Icon', icon: '/chain/0x1.icon.png' },
  // { id: SPOKE_CHAIN_IDS[12], name: 'Nibiru', icon: '/chain/nibiru.png' },
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
