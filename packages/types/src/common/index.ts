import type { HUB_CHAIN_IDS, SPOKE_CHAIN_IDS, CHAIN_IDS } from "../constants/index.js";

export type HubChainId = (typeof HUB_CHAIN_IDS)[number];

export type SpokeChainId = (typeof SPOKE_CHAIN_IDS)[number];

export type ChainId = (typeof CHAIN_IDS)[number];

export type ChainType = 'ICON' | 'EVM' | 'ARCHWAY' | 'HAVAH' | 'INJECTIVE' | 'SUI' | 'STELLAR' | 'SOLANA';

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
  getWalletAddressBytes(): Promise<Hex>; // The wallet address as a hex string
}