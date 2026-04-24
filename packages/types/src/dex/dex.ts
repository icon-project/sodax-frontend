import type { Address } from '../shared/shared.js';
import { StatATokenAddresses } from '../chains/tokens.js';
import type { PoolKey } from './pancakeswap-infinity.js';

// Re-export imported types for external usage with explicit type definitions for clarity.
export type {
  EncodedPoolKey,
  PoolKey,
  Slot0,
  CLPositionConfig,
} from './pancakeswap-infinity.js';

export type ConcentratedLiquidityConfig = {
  permit2: Address;
  clPoolManager: Address;
  router: Address;
  clPositionManager: Address;
  clPositionDescriptor: Address;
  clQuoter: Address;
  clTickLens: Address;
  defaultHook: Address;
  stataTokenFactory: Address;
  defaultTickSpacing: number;
  defaultBitmap: bigint;
};

export const concentratedLiquidityConfig = {
  permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  clPoolManager: '0xA3256ab552A271A16AcDfdB521B32ef82d481F43',
  router: '0x5bFB058c65E4c1DEC1cFF0Ff2cBd8522b4c3feBB',
  clPositionManager: '0xcc08a04d9E5766c7A20FE6bb32cAa40EA0e7e9e1',
  clPositionDescriptor: '0x83Ff9FC474DBe927BA5BB822571e0814122655bB',
  clQuoter: '0x5f46CB668D39496b41CE8E19D6A7fE893826E363',
  clTickLens: '0xb3e77dD9b1f206A2b797B3fE900b50cC92A38d26',
  defaultHook: '0x598448d8f8553b9c6f27E52a92E2cCf27cDEF229',
  stataTokenFactory: '0x9120956787FcE7D7082C52CDCAafb7F4B88272d4',
  defaultTickSpacing: 10,
  defaultBitmap: 16383n,
} as const satisfies ConcentratedLiquidityConfig;

export const dexPools = {
  AETH_BNUSD: {
    currency0: '0x3E102c7D9b46c92aBcd4c2e1C70f362B47a201A6', // AsodaETH
    currency1: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // bnuSD
    hooks: '0x598448d8f8553b9c6f27E52a92E2cCf27cDEF229', // defaultHook
    poolManager: '0xA3256ab552A271A16AcDfdB521B32ef82d481F43', // clPoolManager
    fee: 8388608, // DYNAMIC_FEE
    parameters: {
      tickSpacing: 10,
      hooksRegistration: {
        beforeInitialize: true,
        afterInitialize: true,
        beforeAddLiquidity: true,
        afterAddLiquidity: true,
        beforeRemoveLiquidity: true,
        afterRemoveLiquidity: true,
        beforeSwap: true,
        afterSwap: true,
        beforeDonate: true,
        afterDonate: true,
        beforeSwapReturnsDelta: true,
        afterSwapReturnsDelta: true,
        afterMintReturnsDelta: true,
        afterBurnReturnsDelta: true,
      },
    },
  },

  BTC_BNUSD: {
    currency0: '0x8aDe79C255761971f4057253712b916AB2494275', // sodaBTC
    currency1: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // bnUSD
    hooks: '0x598448d8f8553b9c6f27E52a92E2cCf27cDEF229', // defaultHook
    poolManager: '0xA3256ab552A271A16AcDfdB521B32ef82d481F43', // clPoolManager
    fee: 8388608, // DYNAMIC_FEE
    parameters: {
      tickSpacing: 10,
      hooksRegistration: {
        beforeInitialize: true,
        afterInitialize: true,
        beforeAddLiquidity: true,
        afterAddLiquidity: true,
        beforeRemoveLiquidity: true,
        afterRemoveLiquidity: true,
        beforeSwap: true,
        afterSwap: true,
        beforeDonate: true,
        afterDonate: true,
        beforeSwapReturnsDelta: true,
        afterSwapReturnsDelta: true,
        afterMintReturnsDelta: true,
        afterBurnReturnsDelta: true,
      },
    },
  },

  // SODA/ETH pool
  ASODA_BNUSD: {
    currency0: '0xac8540fee419c7ceb985889EaBa1e84B42a53e8a', // sodaSODA
    currency1: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // sodaETH
    hooks: '0x598448d8f8553b9c6f27E52a92E2cCf27cDEF229', // defaultHook
    poolManager: '0xA3256ab552A271A16AcDfdB521B32ef82d481F43', // clPoolManager
    fee: 8388608, // DYNAMIC_FEE
    parameters: {
      tickSpacing: 10,
      hooksRegistration: {
        beforeInitialize: true,
        afterInitialize: true,
        beforeAddLiquidity: true,
        afterAddLiquidity: true,
        beforeRemoveLiquidity: true,
        afterRemoveLiquidity: true,
        beforeSwap: true,
        afterSwap: true,
        beforeDonate: true,
        afterDonate: true,
        beforeSwapReturnsDelta: true,
        afterSwapReturnsDelta: true,
        afterMintReturnsDelta: true,
        afterBurnReturnsDelta: true,
      },
    },
  },

  // SODA/USDC pool
  ASODA_XSODA: {
    currency0: '0xac8540fee419c7ceb985889EaBa1e84B42a53e8a', // sodaSODA
    currency1: '0xADC6561Cc8FC31767B4917CCc97F510D411378d9', // xSODA
    hooks: '0x598448d8f8553b9c6f27E52a92E2cCf27cDEF229', // defaultHook
    poolManager: '0xA3256ab552A271A16AcDfdB521B32ef82d481F43', // clPoolManager
    fee: 8388608, // DYNAMIC_FEE
    parameters: {
      tickSpacing: 10,
      hooksRegistration: {
        beforeInitialize: true,
        afterInitialize: true,
        beforeAddLiquidity: true,
        afterAddLiquidity: true,
        beforeRemoveLiquidity: true,
        afterRemoveLiquidity: true,
        beforeSwap: true,
        afterSwap: true,
        beforeDonate: true,
        afterDonate: true,
        beforeSwapReturnsDelta: true,
        afterSwapReturnsDelta: true,
        afterMintReturnsDelta: true,
        afterBurnReturnsDelta: true,
      },
    },
  },
} as const satisfies Record<string, PoolKey>;

export type DexConfig = {
  concentratedLiquidityConfig: ConcentratedLiquidityConfig;
  dexPools: Record<string, PoolKey>;
  statATokenAddresses: Record<Address, Address> & typeof StatATokenAddresses;
};

export const dexConfig = {
  concentratedLiquidityConfig: concentratedLiquidityConfig,
  dexPools: dexPools,
  statATokenAddresses: StatATokenAddresses,
} as const satisfies DexConfig;