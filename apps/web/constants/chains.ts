import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
} from '@sodax/types';

export interface ChainUI {
  id: string;
  name: string;
  icon: string;
  explorerTxUrl?: string;
}

export const EVM_CHAIN_ICONS = [
  '/chain/ethereum.png',
  '/chain/0x2105.base.png',
  '/chain/0x38.bsc.png',
  '/chain/0xa86a.avax.png',
  '/chain/0x89.polygon.png',
  '/chain/0xa.optimism.png',
  '/chain/0xa4b1.arbitrum.png',
  '/chain/sonic.png',
  '/chain/lightlink.png',
  '/chain/hyper.png',
];

/**
 * Available chains for UI components with display information
 * Maps SPOKE_CHAIN_IDS to human-readable names and icon paths
 */
export const availableChains: ChainUI[] = [
  {
    id: SONIC_MAINNET_CHAIN_ID,
    name: 'Sonic',
    icon: '/chain/sonic.png',
    explorerTxUrl: 'https://sonicscan.org/tx/',
  },
  {
    id: AVALANCHE_MAINNET_CHAIN_ID,
    name: 'Avalanche',
    icon: '/chain/0xa86a.avax.png',
    explorerTxUrl: 'https://snowtrace.io/tx/',
  },
  {
    id: ARBITRUM_MAINNET_CHAIN_ID,
    name: 'Arbitrum',
    icon: '/chain/0xa4b1.arbitrum.png',
    explorerTxUrl: 'https://arbiscan.io/tx/',
  },
  {
    id: BASE_MAINNET_CHAIN_ID,
    name: 'Base',
    icon: '/chain/0x2105.base.png',
    explorerTxUrl: 'https://basescan.org/tx/',
  },
  {
    id: BSC_MAINNET_CHAIN_ID,
    name: 'BNB Chain',
    icon: '/chain/0x38.bsc.png',
    explorerTxUrl: 'https://bscscan.com/tx/',
  },
  {
    id: POLYGON_MAINNET_CHAIN_ID,
    name: 'Polygon',
    icon: '/chain/0x89.polygon.png',
    explorerTxUrl: 'https://polygonscan.com/tx/',
  },
  {
    id: OPTIMISM_MAINNET_CHAIN_ID,
    name: 'Optimism',
    icon: '/chain/0xa.optimism.png',
    explorerTxUrl: 'https://optimistic.etherscan.io/tx/',
  },
  {
    id: ETHEREUM_MAINNET_CHAIN_ID,
    name: 'Ethereum',
    icon: '/chain/ethereum.png',
    explorerTxUrl: 'https://etherscan.io/tx/',
  },

  // non-EVM
  {
    id: SOLANA_MAINNET_CHAIN_ID,
    name: 'Solana',
    icon: '/chain/solana.png',
    explorerTxUrl: 'https://solscan.io/tx/',
  },
  {
    id: SUI_MAINNET_CHAIN_ID,
    name: 'Sui',
    icon: '/chain/sui.png',
    explorerTxUrl: 'https://suiexplorer.com/tx/',
  },
  {
    id: STELLAR_MAINNET_CHAIN_ID,
    name: 'Stellar',
    icon: '/chain/stellar.png',
    explorerTxUrl: 'https://stellar.expert/explorer/public/tx/',
  },
  {
    id: ICON_MAINNET_CHAIN_ID,
    name: 'ICON',
    icon: '/chain/0x1.icon.png',
    explorerTxUrl: 'https://tracker.icon.community/transaction/',
  },
  {
    id: LIGHTLINK_MAINNET_CHAIN_ID,
    name: 'LightLink',
    icon: '/chain/lightlink.png',
    explorerTxUrl: 'https://phoenix.lightlink.io/tx/',
  },
  {
    id: HYPEREVM_MAINNET_CHAIN_ID,
    name: 'Hyper',
    icon: '/chain/hyper.png',
    explorerTxUrl: 'https://explorer.hyperchain.io/tx/',
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
