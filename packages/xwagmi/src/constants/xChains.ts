import type { XChain, XChainId } from '@/types';

export const archway: XChain = {
  id: 'archway-1',
  name: 'Archway',
  xChainId: 'archway-1',
  xChainType: 'ARCHWAY',
  nativeCurrency: {
    decimals: 18,
    name: 'Archway',
    symbol: 'ARCH',
  },
  tracker: { tx: 'https://www.mintscan.io/archway/tx' },
  rpc: {
    http: 'https://rpc.mainnet.archway.io',
    ws: 'wss://rpc.mainnet.archway.io:443/websocket',
  },
  testnet: false,
};

export const archwayTestnet: XChain = {
  id: 'archway',
  name: 'archway testnet',
  xChainId: 'archway',
  xChainType: 'ARCHWAY',
  nativeCurrency: {
    decimals: 18,
    name: 'Archway',
    symbol: 'ARCH',
  },
  tracker: { tx: 'https://www.mintscan.io/archway/tx' },
  rpc: {
    http: 'https://rpc.mainnet.archway.io',
    ws: 'wss://rpc.mainnet.archway.io:443/websocket',
  },
  testnet: true,
};

export const icon: XChain = {
  id: 1,
  name: 'ICON',
  xChainId: '0x1.icon',
  xChainType: 'ICON',
  tracker: { tx: 'https://tracker.icon.community/transaction' },
  nativeCurrency: {
    decimals: 18,
    name: 'ICON',
    symbol: 'ICX',
  },
  rpc: {
    http: '',
    ws: 'wss://ctz.solidwallet.io/api/v3/icon_dex/block',
  },
  testnet: false,
};

export const lisbon: XChain = {
  id: 2,
  name: 'Lisbon Testnet',
  xChainId: '0x2.icon',
  xChainType: 'ICON',
  tracker: { tx: '' },
  nativeCurrency: {
    decimals: 18,
    name: 'ICON',
    symbol: 'ICX',
  },
  rpc: {
    http: '',
    ws: 'wss://ctz.solidwallet.io/api/v3/icon_dex/block',
  },
  testnet: true,
};

export const avalanche: XChain = {
  id: 43_114,
  name: 'Avalanche',
  xChainId: '0xa86a.avax',
  xChainType: 'EVM',
  tracker: { tx: 'https://snowscan.xyz/tx' },
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpc: {
    http: 'https://api.avax.network/ext/bc/C/rpc',
  },
  testnet: false,
};

export const fuji: XChain = {
  id: 43_113,
  name: 'Fuji Testnet',
  xChainId: '0xa869.fuji',
  xChainType: 'EVM',
  tracker: { tx: 'https://snowscan.xyz' },
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpc: {
    http: 'https://api.avax.network/ext/bc/C/rpc',
  },
  testnet: true,
};

export const havah: XChain = {
  id: 'havah',
  name: 'Havah',
  xChainId: '0x100.icon',
  xChainType: 'HAVAH',
  tracker: { tx: 'https://scan.havah.io/txn' },
  nativeCurrency: {
    decimals: 18,
    name: 'Havah',
    symbol: 'HVH',
  },
  rpc: {
    http: 'https://ctz.havah.io/api/v3',
  },
  testnet: false,
};

export const bsc: XChain = {
  id: 56,
  name: 'BNB Chain',
  xChainId: '0x38.bsc',
  xChainType: 'EVM',
  tracker: { tx: 'https://bscscan.com/tx' },
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpc: {
    http: 'https://bsc-dataseed.bnbchain.org',
  },
  testnet: false,
};

export const arbitrum: XChain = {
  id: 42161,
  name: 'Arbitrum',
  xChainId: '0xa4b1.arbitrum',
  xChainType: 'EVM',
  tracker: { tx: 'https://arbiscan.io/tx' },
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpc: {
    http: 'https://arb1.arbitrum.io/rpc',
  },
  testnet: false,
};

export const base: XChain = {
  id: 8453,
  name: 'Base',
  xChainId: '0x2105.base',
  xChainType: 'EVM',
  tracker: { tx: 'https://basescan.org/tx' },
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpc: {
    http: 'https://mainnet.base.org',
  },
  testnet: false,
};

export const injective: XChain = {
  id: 'injective-1',
  name: 'Injective',
  xChainId: 'injective-1',
  xChainType: 'INJECTIVE',
  tracker: { tx: 'https://explorer.injective.network/transaction' },
  nativeCurrency: {
    decimals: 18,
    name: 'INJ',
    symbol: 'INJ',
  },
  rpc: {
    http: 'https://sentry.tm.injective.network',
  },
  testnet: false,
};

export const stellar: XChain = {
  id: 'stellar',
  name: 'Stellar',
  xChainId: 'stellar',
  xChainType: 'STELLAR',
  tracker: { tx: 'https://stellar.expert/explorer/public/tx' },
  nativeCurrency: {
    decimals: 7,
    name: 'XLM',
    symbol: 'XLM',
  },
  rpc: {
    http: 'https://horizon.stellar.org',
  },
  testnet: false,
};

// TODO: complete SUI chain
export const sui: XChain = {
  id: 'sui',
  name: 'Sui',
  xChainId: 'sui',
  xChainType: 'SUI',
  tracker: { tx: 'https://suiscan.xyz/mainnet/tx' },
  nativeCurrency: {
    decimals: 9,
    name: 'SUI',
    symbol: 'SUI',
  },
  rpc: {
    http: 'https://sentry.tm.sui.network',
  },
  testnet: false,
};

// TODO: complete solana chain
export const solana: XChain = {
  id: 'solana',
  name: 'Solana',
  xChainId: 'solana',
  xChainType: 'SOLANA',
  tracker: { tx: 'https://solscan.io/tx' },
  nativeCurrency: {
    decimals: 9,
    name: 'SOL',
    symbol: 'SOL',
  },
  rpc: {
    http: 'https://sentry.tm.solana.network',
  },
  testnet: false,
};

export const optimism: XChain = {
  id: 10,
  name: 'Optimism',
  xChainId: '0xa.optimism',
  xChainType: 'EVM',
  tracker: { tx: 'https://optimistic.etherscan.io/tx' },
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpc: {
    http: 'https://mainnet.optimism.io',
  },
  testnet: false,
};

export const sonicBlaze: XChain = {
  id: 57_054,
  name: 'Sonic Blaze',
  xChainId: 'sonic-blaze',
  xChainType: 'EVM',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpc: {
    http: 'https://rpc.sonic.blaze.xyz',
  },
  testnet: false,
  tracker: { tx: 'https://sonic.blaze.xyz/tx' },
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
};

export const xChains = Object.values(xChainMap);
