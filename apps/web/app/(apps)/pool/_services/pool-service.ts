import type { ChainId } from '@sodax/types';
import type { ChartDataPoint, EnrichedPosition, PoolPairConfig } from '../_mocks';
import {
  mockChartData,
  MOCK_CURRENT_PRICE,
  MOCK_POOL_PAIRS,
  MOCK_POSITIONS,
  MOCK_EMPTY_POSITIONS,
} from '../_mocks';

/**
 * Pool service abstraction layer.
 *
 * All pool-related data fetching and transaction execution goes through here.
 * Currently returns mock data — swap implementations for real SDK calls
 * when AMMService is available.
 *
 * Usage:
 *   const service = createPoolService();
 *   const positions = await service.getPositions(ownerAddress);
 */

export interface SupplyLiquidityParams {
  poolId: string;
  chainId: ChainId;
  token0Amount: string;
  token1Amount: string;
  minPrice: string;
  maxPrice: string;
  owner: string;
}

export interface WithdrawLiquidityParams {
  tokenId: string;
  chainId: ChainId;
  owner: string;
  percentage: number; // 0-100
}

export interface ClaimFeesParams {
  tokenId: string;
  chainId: ChainId;
  owner: string;
}

export interface PoolService {
  getPoolPairs(): Promise<PoolPairConfig[]>;
  getCurrentPrice(poolId: string): Promise<number>;
  getChartData(poolId: string, period: string): Promise<ChartDataPoint[]>;
  getPositions(owner: string): Promise<EnrichedPosition[]>;
  supplyLiquidity(params: SupplyLiquidityParams): Promise<{ txHash: string }>;
  withdrawLiquidity(params: WithdrawLiquidityParams): Promise<{ txHash: string }>;
  claimFees(params: ClaimFeesParams): Promise<{ txHash: string }>;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mockTxHash(): string {
  const hex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `0x${hex}`;
}

/** Mock pool service for development. Replace with SDK-backed service when ready. */
function createMockPoolService(): PoolService {
  return {
    async getPoolPairs() {
      await delay(200);
      return MOCK_POOL_PAIRS;
    },

    async getCurrentPrice(_poolId: string) {
      await delay(100);
      return MOCK_CURRENT_PRICE;
    },

    async getChartData(_poolId: string, period: string) {
      await delay(300);
      return mockChartData[period] ?? mockChartData['1D'] ?? [];
    },

    async getPositions(owner: string) {
      await delay(400);
      if (!owner) return MOCK_EMPTY_POSITIONS;
      return MOCK_POSITIONS;
    },

    async supplyLiquidity(_params: SupplyLiquidityParams) {
      // Simulate approval + supply TX
      await delay(2000);
      return { txHash: mockTxHash() };
    },

    async withdrawLiquidity(_params: WithdrawLiquidityParams) {
      await delay(1500);
      return { txHash: mockTxHash() };
    },

    async claimFees(_params: ClaimFeesParams) {
      await delay(1000);
      return { txHash: mockTxHash() };
    },
  };
}

/** Create the pool service. Uses mocks for now, will use SDK when AMMService is ready. */
export function createPoolService(): PoolService {
  // TODO: When AMMService is available in @sodax/sdk, add:
  // if (process.env.NEXT_PUBLIC_POOL_MOCKS !== 'true') {
  //   return createSdkPoolService(sodaxClient);
  // }
  return createMockPoolService();
}
