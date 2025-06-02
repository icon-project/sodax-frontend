import { createContext } from 'react';
import type { Sodax, SONIC_MAINNET_CHAIN_ID, SONIC_TESTNET_CHAIN_ID } from '@new-world/sdk';

export interface SodaxContextType {
  sodax: Sodax;
  testnet: boolean;
  hubChainId: typeof SONIC_TESTNET_CHAIN_ID | typeof SONIC_MAINNET_CHAIN_ID;
  hubRpcUrl: string;
}

export const SodaxContext = createContext<SodaxContextType | null>(null);
