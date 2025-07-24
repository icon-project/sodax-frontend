// packages/sdk/src/services/concentratedLiquidity/ConcentratedLiquidityService.test.ts
import { describe, it, expect } from 'vitest';
import { ConcentratedLiquidityService } from './ConcentratedLiquidityService.js';
import type {
  ConcentratedLiquiditySupplyParams,
  ConcentratedLiquidityCreatePoolParams,
  ConcentratedLiquiditySwapParams,
  ConcentratedLiquidityWithdrawParams,
} from './ConcentratedLiquidityService.js';
import type { EvmHubProvider } from '../../entities/index.js';

describe('ConcentratedLiquidityService', () => {
  const mockConfig = {
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const,
    clPoolManager: '0xA3256ab552A271A16AcDfdB521B32ef82d481F43' as const,
    router: '0x5bFB058c65E4c1DEC1cFF0Ff2cBd8522b4c3feBB' as const,
    clPositionManager: '0xcc08a04d9E5766c7A20FE6bb32cAa40EA0e7e9e1' as const,
    clPositionDescriptor: '0x83Ff9FC474DBe927BA5BB822571e0814122655bB' as const,
    clQuoter: '0x5f46CB668D39496b41CE8E19D6A7fE893826E363' as const,
    clTickLens: '0xb3e77dD9b1f206A2b797B3fE900b50cC92A38d26' as const,
  };

  const mockHubProvider = {
    chainConfig: {
      chain: {
        id: 146n,
        name: 'Sonic',
        type: 'EVM' as const,
      },
    },
    publicClient: {} as any,
    walletClient: {} as any,
  } as EvmHubProvider;

  describe('Encoding Methods', () => {
    it('should encode supply liquidity parameters correctly', () => {
      const params: ConcentratedLiquiditySupplyParams = {
        token0: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
        token1: '0xB1b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
        fee: 3000n,
        tickLower: -887220n,
        tickUpper: 887220n,
        amount0Desired: 1000000000000000000n,
        amount1Desired: 1000000000000000000n,
        amount0Min: 900000000000000000n,
        amount1Min: 900000000000000000n,
        recipient: '0xC1b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
        deadline: 1700000000n,
      };

      const encodedData = ConcentratedLiquidityService.encodeSupplyLiquidity(params, mockConfig.clPositionManager);

      expect(encodedData.address).toBe(mockConfig.clPositionManager);
      expect(encodedData.value).toBe(0n);
      expect(encodedData.data).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should encode create pool parameters correctly', () => {
      const params: ConcentratedLiquidityCreatePoolParams = {
        token0: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
        token1: '0xB1b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
        fee: 3000n,
        tickSpacing: 60n,
        sqrtPriceX96: 79228162514264337593543950336n, // 1:1 price
      };

      const encodedData = ConcentratedLiquidityService.encodeCreatePool(params, mockConfig.clPoolManager);

      expect(encodedData.address).toBe(mockConfig.clPoolManager);
      expect(encodedData.value).toBe(0n);
      expect(encodedData.data).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should encode swap parameters correctly', () => {
      const params: ConcentratedLiquiditySwapParams = {
        tokenIn: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
        tokenOut: '0xB1b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
        fee: 3000n,
        recipient: '0xC1b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
        deadline: 1700000000n,
        amountIn: 1000000000000000000n,
        amountOutMinimum: 900000000000000000n,
        sqrtPriceLimitX96: 0n,
      };

      const encodedData = ConcentratedLiquidityService.encodeSwap(params, mockConfig.router);

      expect(encodedData.address).toBe(mockConfig.router);
      expect(encodedData.value).toBe(0n);
      expect(encodedData.data).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should encode withdraw liquidity parameters correctly', () => {
      const params: ConcentratedLiquidityWithdrawParams = {
        tokenId: 1n,
        liquidity: 1000000000000000000n,
        amount0Min: 900000000000000000n,
        amount1Min: 900000000000000000n,
        deadline: 1700000000n,
      };

      const encodedData = ConcentratedLiquidityService.encodeWithdrawLiquidity(params, mockConfig.clPositionManager);

      expect(encodedData.address).toBe(mockConfig.clPositionManager);
      expect(encodedData.value).toBe(0n);
      expect(encodedData.data).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should encode collect fees parameters correctly', () => {
      const tokenId = 1n;
      const recipient = '0xC1b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8' as const;
      const amount0Max = 1000000000000000000n;
      const amount1Max = 1000000000000000000n;

      const encodedData = ConcentratedLiquidityService.encodeCollectFees(
        tokenId,
        recipient,
        amount0Max,
        amount1Max,
        mockConfig.clPositionManager,
      );

      expect(encodedData.address).toBe(mockConfig.clPositionManager);
      expect(encodedData.value).toBe(0n);
      expect(encodedData.data).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should encode get pool parameters correctly', () => {
      const token0 = '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8' as const;
      const token1 = '0xB1b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8' as const;
      const fee = 3000n;

      const encodedData = ConcentratedLiquidityService.encodeGetPool(token0, token1, fee, mockConfig.clPoolManager);

      expect(encodedData.address).toBe(mockConfig.clPoolManager);
      expect(encodedData.value).toBe(0n);
      expect(encodedData.data).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should encode quote exact input single parameters correctly', () => {
      const tokenIn = '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8' as const;
      const tokenOut = '0xB1b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8' as const;
      const fee = 3000n;
      const amountIn = 1000000000000000000n;
      const sqrtPriceLimitX96 = 0n;

      const encodedData = ConcentratedLiquidityService.encodeQuoteExactInputSingle(
        tokenIn,
        tokenOut,
        fee,
        amountIn,
        sqrtPriceLimitX96,
        mockConfig.clQuoter,
      );

      expect(encodedData.address).toBe(mockConfig.clQuoter);
      expect(encodedData.value).toBe(0n);
      expect(encodedData.data).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should encode get position parameters correctly', () => {
      const tokenId = 1n;

      const encodedData = ConcentratedLiquidityService.encodeGetPosition(tokenId, mockConfig.clPositionManager);

      expect(encodedData.address).toBe(mockConfig.clPositionManager);
      expect(encodedData.value).toBe(0n);
      expect(encodedData.data).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should encode get slot0 parameters correctly', () => {
      const pool = '0xD1b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8' as const;

      const encodedData = ConcentratedLiquidityService.encodeGetSlot0(pool);

      expect(encodedData.address).toBe(pool);
      expect(encodedData.value).toBe(0n);
      expect(encodedData.data).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should encode get liquidity parameters correctly', () => {
      const pool = '0xD1b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8' as const;

      const encodedData = ConcentratedLiquidityService.encodeGetLiquidity(pool);

      expect(encodedData.address).toBe(pool);
      expect(encodedData.value).toBe(0n);
      expect(encodedData.data).toMatch(/^0x[a-fA-F0-9]+$/);
    });
  });

  describe('Service Instance', () => {
    it('should create service instance with default config', () => {
      const service = new ConcentratedLiquidityService(undefined, mockHubProvider);

      expect(service.config).toBeDefined();
      expect(service.config.permit2).toBeDefined();
      expect(service.config.clPoolManager).toBeDefined();
      expect(service.config.router).toBeDefined();
      expect(service.config.clPositionManager).toBeDefined();
    });

    it('should create service instance with custom config', () => {
      const service = new ConcentratedLiquidityService(mockConfig, mockHubProvider);

      expect(service.config.permit2).toBe(mockConfig.permit2);
      expect(service.config.clPoolManager).toBe(mockConfig.clPoolManager);
      expect(service.config.router).toBe(mockConfig.router);
      expect(service.config.clPositionManager).toBe(mockConfig.clPositionManager);
    });
  });
});
