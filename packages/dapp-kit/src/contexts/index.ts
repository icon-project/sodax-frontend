import { createContext } from 'react';
import type { Sodax } from '@sodax/sdk';
import type { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

export interface SodaxContextType {
  sodax: Sodax;
  testnet: boolean;
  hubChainId: typeof SONIC_MAINNET_CHAIN_ID;
  hubRpcUrl: string;
}

export const SodaxContext = createContext<SodaxContextType | null>(null);
