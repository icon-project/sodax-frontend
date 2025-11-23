// apps/demo/src/components/dex/hooks/index.ts
/**
 * DEX Hooks
 *
 * This module exports all hooks for interacting with the DEX (Decentralized Exchange) service.
 * These hooks provide a React-friendly interface to Uniswap v4-style concentrated liquidity operations,
 * including pool management, position management, and liquidity operations.
 */

export { usePools } from './usePools';
export { usePoolData } from './usePoolData';
export { usePoolBalances } from './usePoolBalances';
export { usePositionInfo } from './usePositionInfo';
export { useDexDeposit } from './useDexDeposit';
export { useDexWithdraw } from './useDexWithdraw';
export { useDexAllowance } from './useDexAllowance';
export { useDexApprove } from './useDexApprove';
export { useLiquidityAmounts } from './useLiquidityAmounts';
export { useSupplyLiquidity } from './useSupplyLiquidity';
export { useDecreaseLiquidity } from './useDecreaseLiquidity';
export { useBurnPosition } from './useBurnPosition';

