import type { ChainId } from '../chain/index.js';
import type { EvmAddress } from '../shared/index.js';

export type Token = {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
};

export type XToken = Token & {
  xChainId: ChainId;
};

export type HubAssetInfo = { asset: EvmAddress; decimal: number; vault: EvmAddress };

export type VaultReserves = {
  tokens: readonly EvmAddress[];
  balances: readonly bigint[];
};

export type VaultType = {
  address: EvmAddress; // vault address
  reserves: EvmAddress[]; // hub asset addresses contained in the vault
};

export type VaultTokenInfo = {
  decimals: number;
  depositFee: bigint;
  withdrawalFee: bigint;
  maxDeposit: bigint;
  isSupported: boolean;
};

export type AssetInfo = {
  chainId: bigint;
  spokeAddress: EvmAddress;
};
