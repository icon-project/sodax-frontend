import type { XChain, ChainId } from '@sodax/types';

export const icon: XChain = {
  id: 1,
  name: 'ICON',
  xChainId: '0x1.icon',
  xChainType: 'ICON',
  testnet: false,
};

export const avalanche: XChain = {
  id: 43_114,
  name: 'Avalanche',
  xChainId: '0xa86a.avax',
  xChainType: 'EVM',
  testnet: false,
};

export const bsc: XChain = {
  id: 56,
  name: 'BNB Chain',
  xChainId: '0x38.bsc',
  xChainType: 'EVM',
  testnet: false,
};

export const arbitrum: XChain = {
  id: 42161,
  name: 'Arbitrum',
  xChainId: '0xa4b1.arbitrum',
  xChainType: 'EVM',
  testnet: false,
};

export const base: XChain = {
  id: 8453,
  name: 'Base',
  xChainId: '0x2105.base',
  xChainType: 'EVM',
  testnet: false,
};

export const injective: XChain = {
  id: 'injective-1',
  name: 'Injective',
  xChainId: 'injective-1',
  xChainType: 'INJECTIVE',
  testnet: false,
};

export const stellar: XChain = {
  id: 'stellar',
  name: 'Stellar',
  xChainId: 'stellar',
  xChainType: 'STELLAR',
  testnet: false,
};

export const sui: XChain = {
  id: 'sui',
  name: 'Sui',
  xChainId: 'sui',
  xChainType: 'SUI',
  testnet: false,
};

export const solana: XChain = {
  id: 'solana',
  name: 'Solana',
  xChainId: 'solana',
  xChainType: 'SOLANA',
  testnet: false,
};

export const optimism: XChain = {
  id: 10,
  name: 'Optimism',
  xChainId: '0xa.optimism',
  xChainType: 'EVM',
  testnet: false,
};

export const sonic: XChain = {
  id: 146,
  name: 'Sonic',
  xChainId: 'sonic',
  xChainType: 'EVM',
  testnet: false,
};

export const polygon: XChain = {
  id: 137,
  name: 'Polygon',
  xChainId: '0x89.polygon',
  xChainType: 'EVM',
  testnet: false,
};

export const nibiru: XChain = {
  id: 6900,
  name: 'Nibiru',
  xChainId: 'nibiru',
  xChainType: 'EVM',
  testnet: false,
};

export const hyper: XChain = {
  id: 999,
  name: 'HyperEVM',
  xChainId: 'hyper',
  xChainType: 'EVM',
  testnet: false,
};

export const lightlink: XChain = {
  id: 1890,
  name: 'Lightlink',
  xChainId: 'lightlink',
  xChainType: 'EVM',
  testnet: false,
};

export const ethereum: XChain = {
  id: 1,
  name: 'Ethereum',
  xChainId: 'ethereum',
  xChainType: 'EVM',
  testnet: false,
};

// the order is important, using manual order to display in the UI
export const xChainMap: { [key in ChainId]: XChain } = {
  '0x1.icon': icon,
  '0xa4b1.arbitrum': arbitrum,
  '0xa86a.avax': avalanche,
  '0x38.bsc': bsc,
  '0x2105.base': base,
  '0xa.optimism': optimism,
  'injective-1': injective,
  stellar: stellar,
  sui: sui,
  solana: solana,
  sonic: sonic,
  '0x89.polygon': polygon,
  nibiru: nibiru,
  hyper: hyper,
  lightlink: lightlink,
  ethereum: ethereum,
};

/**
 * List of all supported chains in Sodax ecosystem
 *
 * Currently supported chains:
 * - EVM chains:
 *   - Arbitrum (0xa4b1.arbitrum)
 *   - Avalanche (0xa86a.avax)
 *   - Base (0x2105.base)
 *   - BSC (0x38.bsc)
 *   - Optimism (0xa.optimism)
 *   - Polygon (0x89.polygon)
 *   - Sonic (sonic)
 *   - Nibiru (nibiru)
 *   - Ethereum (ethereum)
 * - ICON chain: 0x1.icon
 * - Sui chain: sui
 * - Solana chain: solana
 * - Stellar chain: stellar
 * - Injective chain: injective-1
 * - Nibiru chain: nibiru
 * - HyperEVM chain: hyper
 */

export const xChains = Object.values(xChainMap);
