import type { XChain, XChainId } from '@/types';

export const archway: XChain = {
  id: 'archway-1',
  name: 'Archway',
  xChainId: 'archway-1',
  xChainType: 'ARCHWAY',
  testnet: false,
};

export const archwayTestnet: XChain = {
  id: 'archway',
  name: 'archway testnet',
  xChainId: 'archway',
  xChainType: 'ARCHWAY',
  testnet: true,
};

export const icon: XChain = {
  id: 1,
  name: 'ICON',
  xChainId: '0x1.icon',
  xChainType: 'ICON',
  testnet: false,
};

export const lisbon: XChain = {
  id: 2,
  name: 'Lisbon Testnet',
  xChainId: '0x2.icon',
  xChainType: 'ICON',
  testnet: true,
};

export const avalanche: XChain = {
  id: 43_114,
  name: 'Avalanche',
  xChainId: '0xa86a.avax',
  xChainType: 'EVM',
  testnet: false,
};

export const fuji: XChain = {
  id: 43_113,
  name: 'Fuji Testnet',
  xChainId: '0xa869.fuji',
  xChainType: 'EVM',
  testnet: true,
};

export const havah: XChain = {
  id: 'havah',
  name: 'Havah',
  xChainId: '0x100.icon',
  xChainType: 'HAVAH',
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

export const sonicBlaze: XChain = {
  id: 57_054,
  name: 'Sonic Blaze',
  xChainId: 'sonic-blaze',
  xChainType: 'EVM',
  testnet: true,
};

export const sonic: XChain = {
  id: 57_054,
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

// the order is important, using manual order to display in the UI
export const xChainMap: { [key in XChainId]: XChain } = {
  '0x1.icon': icon,
  '0x2.icon': lisbon,
  archway: archwayTestnet,
  'archway-1': archway,
  '0xa4b1.arbitrum': arbitrum,
  '0xa86a.avax': avalanche,
  '0x100.icon': havah,
  '0xa869.fuji': fuji,
  '0x38.bsc': bsc,
  '0x2105.base': base,
  '0xa.optimism': optimism,
  'injective-1': injective,
  stellar: stellar,
  sui: sui,
  solana: solana,
  'sonic-blaze': sonicBlaze,
  sonic: sonic,
  '0x89.polygon': polygon,
};

export const xChains = Object.values(xChainMap);
