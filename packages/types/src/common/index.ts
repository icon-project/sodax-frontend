import type { HUB_CHAIN_IDS, CHAIN_IDS } from '../constants/index.js';

export type HubChainId = (typeof HUB_CHAIN_IDS)[number];

export type SpokeChainId = (typeof CHAIN_IDS)[number];

export type ChainId = (typeof CHAIN_IDS)[number];

export type ChainType = 'ICON' | 'EVM' | 'INJECTIVE' | 'SUI' | 'STELLAR' | 'SOLANA';

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
