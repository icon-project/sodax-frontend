import type { StellarRpcConfig } from '@sodax/sdk';

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
  stellar?: StellarRpcConfig;
};
