import type { XToken } from '@sodax/types';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

/**
 * Mock pool pair configuration for SODA/xSODA.
 * Replace with real pool config from backend API when available.
 */

export const MOCK_SODA_TOKEN: XToken = {
  symbol: 'SODA',
  name: 'SODA Token',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000001',
  xChainId: SONIC_MAINNET_CHAIN_ID,
};

export const MOCK_XSODA_TOKEN: XToken = {
  symbol: 'xSODA',
  name: 'Staked SODA',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000002',
  xChainId: SONIC_MAINNET_CHAIN_ID,
};

export interface PoolPairConfig {
  id: string;
  token0: XToken;
  token1: XToken;
  feeTier: number; // basis points, e.g. 3000 = 0.3%
  tickSpacing: number;
  currentPrice: number;
  estimatedAPY: number;
}

export const MOCK_POOL_PAIR: PoolPairConfig = {
  id: 'soda-xsoda-3000',
  token0: MOCK_SODA_TOKEN,
  token1: MOCK_XSODA_TOKEN,
  feeTier: 3000,
  tickSpacing: 60,
  currentPrice: 0.790455,
  estimatedAPY: 12.31,
};

/** All available pool pairs (Phase 1: only SODA/xSODA) */
export const MOCK_POOL_PAIRS: PoolPairConfig[] = [MOCK_POOL_PAIR];
