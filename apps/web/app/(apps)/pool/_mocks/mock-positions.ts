/**
 * Mock NFT positions for development.
 * Replace with real data from useBackendAMMNftPositions when available.
 */
import type { ChainId } from '@sodax/types';

export interface EnrichedPosition {
  tokenId: string;
  owner: string;
  poolId200: string;
  currency0: string;
  currency1: string;
  /** Resolved symbol for currency0 */
  symbol0?: string;
  /** Resolved symbol for currency1 */
  symbol1?: string;
  /** USD value of the position */
  valueUsd: number;
  /** Accumulated fees in USD */
  earnedFeesUsd: number;
  /** Lower price bound */
  priceLower: number;
  /** Upper price bound */
  priceUpper: number;
  /** Whether current price is within the position's range */
  inRange: boolean;
  /** Chain where the position lives */
  chainId: ChainId;
  /** Token 0 amount (formatted string) */
  amount0: string;
  /** Token 1 amount (formatted string) */
  amount1: string;
  /** Raw position liquidity (bigint as string for display) */
  liquidity?: string;
  /** Unclaimed fees for token 0 (formatted string) */
  fees0?: string;
  /** Unclaimed fees for token 1 (formatted string) */
  fees1?: string;
  /** Estimated APR as a decimal (e.g. 0.12 = 12%) */
  estimatedApr?: number;
}

export const MOCK_POSITIONS: EnrichedPosition[] = [
  {
    tokenId: '1',
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    poolId200: 'soda-xsoda-3000',
    currency0: '0x0000000000000000000000000000000000000001',
    currency1: '0x0000000000000000000000000000000000000002',
    valueUsd: 1245.67,
    earnedFeesUsd: 0.0278,
    priceLower: 0.7182,
    priceUpper: 0.9239,
    inRange: true,
    chainId: 'sonic',
    amount0: '750.5',
    amount1: '495.12',
  },
  {
    tokenId: '2',
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    poolId200: 'soda-xsoda-3000',
    currency0: '0x0000000000000000000000000000000000000001',
    currency1: '0x0000000000000000000000000000000000000002',
    valueUsd: 520.33,
    earnedFeesUsd: 0.0142,
    priceLower: 0.65,
    priceUpper: 0.8,
    inRange: false,
    chainId: 'solana',
    amount0: '320.0',
    amount1: '200.33',
  },
];

export const MOCK_EMPTY_POSITIONS: EnrichedPosition[] = [];
