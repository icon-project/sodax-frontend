import type { HUB_CHAIN_IDS, CHAIN_IDS } from '../constants/index.js';
import {
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
} from '../constants/index.js';

export const EVM_CHAIN_IDS = [
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
] as const;

export type HubChainId = (typeof HUB_CHAIN_IDS)[number];

export type SpokeChainId = (typeof CHAIN_IDS)[number];

export type ChainId = (typeof CHAIN_IDS)[number];

export type ChainType = 'ICON' | 'EVM' | 'INJECTIVE' | 'SUI' | 'STELLAR' | 'SOLANA';

export type EvmSpokeChainId = (typeof EVM_CHAIN_IDS)[number];

export type EvmChainId = (typeof EVM_CHAIN_IDS)[number];

export type GetSpokeChainIdType<T extends ChainType> = T extends 'EVM' ? EvmSpokeChainId : SpokeChainId;

export type BaseSpokeChainInfo<T extends ChainType> = {
  name: string;
  id: GetSpokeChainIdType<T>;
  chainId: string | number;
  type: T;
};

export type Chain = {
  id: string | number;
  name: string;
  testnet: boolean;
};

export type XChain = Chain & {
  xChainId: ChainId;
  xChainType: ChainType;
};

export type Token = {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
};

export type XToken = Token & {
  xChainId: ChainId;
};

export type ByteArray = Uint8Array;
export type Hex = `0x${string}`;
export type Hash = `0x${string}`;
export type Address = `0x${string}`;
export type HubAddress = Address;
export type OriginalAssetAddress = string;

export interface WalletAddressProvider {
  getWalletAddress(): Promise<string>; // The wallet address as a string
}

export type HttpUrl = `http://${string}` | `https://${string}`;

export type RpcConfig = {
  // EVM chains - all use string RPC URLs
  sonic?: string;
  '0xa86a.avax'?: string;
  '0xa4b1.arbitrum'?: string;
  '0x2105.base'?: string;
  '0x38.bsc'?: string;
  '0xa.optimism'?: string;
  '0x89.polygon'?: string;
  nibiru?: string;

  // Other chains - all use string RPC URLs
  'injective-1'?: string;
  sui?: string;
  solana?: string;
  '0x1.icon'?: string;

  // Stellar - uses object with horizon and soroban RPC URLs
  stellar?: {
    horizonRpcUrl?: HttpUrl;
    sorobanRpcUrl?: HttpUrl;
  };
};

export const baseChainInfo: Record<ChainId, BaseSpokeChainInfo<ChainType>> = {
  [SONIC_MAINNET_CHAIN_ID]: {
    name: 'Sonic',
    id: SONIC_MAINNET_CHAIN_ID,
    type: 'EVM',
    chainId: 146,
  },
  [SOLANA_MAINNET_CHAIN_ID]: {
    name: 'Solana',
    id: SOLANA_MAINNET_CHAIN_ID,
    type: 'SOLANA',
    chainId: 'solana',
  },
  [AVALANCHE_MAINNET_CHAIN_ID]: {
    name: 'Avalanche',
    id: AVALANCHE_MAINNET_CHAIN_ID,
    type: 'EVM',
    chainId: 43_114,
  },
  [NIBIRU_MAINNET_CHAIN_ID]: {
    name: 'Nibiru',
    id: NIBIRU_MAINNET_CHAIN_ID,
    type: 'EVM',
    chainId: 6_900,
  },
  [ARBITRUM_MAINNET_CHAIN_ID]: {
    name: 'Arbitrum',
    id: ARBITRUM_MAINNET_CHAIN_ID,
    type: 'EVM',
    chainId: 42_161,
  },
  [BASE_MAINNET_CHAIN_ID]: {
    name: 'Base',
    id: BASE_MAINNET_CHAIN_ID,
    type: 'EVM',
    chainId: 8453,
  },
  [OPTIMISM_MAINNET_CHAIN_ID]: {
    name: 'Optimism',
    id: OPTIMISM_MAINNET_CHAIN_ID,
    type: 'EVM',
    chainId: 10,
  },
  [BSC_MAINNET_CHAIN_ID]: {
    name: 'BSC',
    id: BSC_MAINNET_CHAIN_ID,
    type: 'EVM',
    chainId: 56,
  },
  [POLYGON_MAINNET_CHAIN_ID]: {
    name: 'Polygon',
    id: POLYGON_MAINNET_CHAIN_ID,
    type: 'EVM',
    chainId: 137,
  },
  [HYPEREVM_MAINNET_CHAIN_ID]: {
    name: 'Hyper',
    id: HYPEREVM_MAINNET_CHAIN_ID,
    type: 'EVM',
    chainId: 999,
  },
  [LIGHTLINK_MAINNET_CHAIN_ID]: {
    name: 'Lightlink',
    id: LIGHTLINK_MAINNET_CHAIN_ID,
    type: 'EVM',
    chainId: 1890,
  },
  [INJECTIVE_MAINNET_CHAIN_ID]: {
    name: 'Injective',
    id: INJECTIVE_MAINNET_CHAIN_ID,
    type: 'INJECTIVE',
    chainId: 'injective-1',
  },
  [STELLAR_MAINNET_CHAIN_ID]: {
    name: 'Stellar',
    id: STELLAR_MAINNET_CHAIN_ID,
    type: 'STELLAR',
    chainId: 'stellar',
  },
  [SUI_MAINNET_CHAIN_ID]: {
    name: 'SUI',
    id: SUI_MAINNET_CHAIN_ID,
    type: 'SUI',
    chainId: 'sui',
  },
  [ICON_MAINNET_CHAIN_ID]: {
    name: 'ICON',
    id: ICON_MAINNET_CHAIN_ID,
    type: 'ICON',
    chainId: '0x1.icon',
  },
  [ETHEREUM_MAINNET_CHAIN_ID]: {
    name: 'Ethereum',
    id: ETHEREUM_MAINNET_CHAIN_ID,
    type: 'EVM',
    chainId: 1,
  },
};
