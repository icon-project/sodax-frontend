import { type SolverConfigParams, spokeChainConfig } from '@sodax/sdk';
import { ChainKeys, type SpokeChainKey } from '@sodax/types';

declare global {
  interface Window {
    hanaWallet: { ethereum: unknown };
  }
}

export function chainIdToChainName(chainId: SpokeChainKey): string {
  return spokeChainConfig[chainId].chain.name;
}

export const stagingSolverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
  protocolIntentsContract: '0xaFf2EDb3057ed6f9C1dA6c930b8ddDf2beE573A5' as const,
} satisfies SolverConfigParams;

export const productionSolverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://api.sodax.com/v1/intent',
  protocolIntentsContract: '0xaFf2EDb3057ed6f9C1dA6c930b8ddDf2beE573A5' as const,
} satisfies SolverConfigParams;

export const devSolverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://sodax-solver-dev.iconblockchain.xyz',
} satisfies SolverConfigParams;

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
  '/chain/0x2019.kaia.png',
  '/chain/redbelly.png',
];

/**
 * Available chains for UI components with display information
 * Maps SPOKE_CHAIN_IDS to human-readable names and icon paths
 */
export const availableChains: ChainUI[] = [
  {
    id: ChainKeys.SONIC_MAINNET,
    name: 'Sonic',
    icon: '/chain/sonic.png',
    explorerTxUrl: 'https://sonicscan.org/tx/',
  },
  { id: ChainKeys.ETHEREUM_MAINNET, name: 'Ethereum', icon: '/chain/ethereum.png' },
  { id: ChainKeys.SOLANA_MAINNET, name: 'Solana', icon: '/chain/solana.png' },
  { id: ChainKeys.BASE_MAINNET, name: 'Base', icon: '/chain/0x2105.base.png' },
  {
    id: ChainKeys.ARBITRUM_MAINNET,
    name: 'Arbitrum',
    icon: '/chain/0xa4b1.arbitrum.png',
  },
  { id: ChainKeys.SUI_MAINNET, name: 'Sui', icon: '/chain/sui.png' },
  { id: ChainKeys.BSC_MAINNET, name: 'BNB Chain', icon: '/chain/0x38.bsc.png' },
  {
    id: ChainKeys.POLYGON_MAINNET,
    name: 'Polygon',
    icon: '/chain/0x89.polygon.png',
  },
  {
    id: ChainKeys.AVALANCHE_MAINNET,
    name: 'Avalanche',
    icon: '/chain/0xa86a.avax.png',
    explorerTxUrl: 'https://snowtrace.io/tx/',
  },
  {
    id: ChainKeys.OPTIMISM_MAINNET,
    name: 'Optimism',
    icon: '/chain/0xa.optimism.png',
  },
  { id: ChainKeys.STELLAR_MAINNET, name: 'Stellar', icon: '/chain/stellar.png' },
  { id: ChainKeys.ICON_MAINNET, name: 'ICON', icon: '/chain/0x1.icon.png' },
  {
    id: ChainKeys.LIGHTLINK_MAINNET,
    name: 'LightLink',
    icon: '/chain/lightlink.png',
    explorerTxUrl: 'https://phoenix.lightlink.io/tx/',
  },
  {
    id: ChainKeys.HYPEREVM_MAINNET,
    name: 'Hyper',
    icon: '/chain/hyper.png',
    explorerTxUrl: 'https://explorer.hyperchain.io/tx/',
  },
  { id: ChainKeys.KAIA_MAINNET, name: 'Kaia', icon: '/chain/0x2019.kaia.png' },
  { id: ChainKeys.REDBELLY_MAINNET, name: 'Redbelly', icon: '/chain/redbelly.png' },
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
