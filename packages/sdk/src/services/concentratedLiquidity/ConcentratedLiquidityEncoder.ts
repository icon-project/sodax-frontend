import { type Hex, maxUint48 } from 'viem';
import type { EvmContractCall } from '../../types.js';
import {
  type PoolKey,
  ActionsPlanner,
  ACTIONS,
  CLPositionManagerAbi,
  type InfinityABIParametersToValuesType,
  type CLPositionConfig,
} from '@pancakeswap/infinity-sdk';
import type { Address } from '@sodax/types';
import { encodeFunctionData } from 'viem';

export class ConcentratedLiquidityEncoder {
  /**
   * Encode supply liquidity parameters for contract calls using planner pattern
   *
   * @example
   * ```typescript
   * const call = ConcentratedLiquidityEncoder.encodeSupplyLiquidity(
   *   poolKey,
   *   tickLower,
   *   tickUpper,
   *   liquidity,
   *   amount0,
   *   amount1,
   *   recipient,
   *   positionManager
   * );
   *
   * // Use the call in a transaction
   * await walletClient.writeContract({
   *   address: call.address,
   *   abi: CLPositionManagerAbi,
   *   functionName: 'modifyLiquidities',
   *   args: [call.data, maxUint48],
   *   data: call.data,
   *   value: call.value,
   * });
   * ```
   */
  public static encodeSupplyLiquidity(
    poolKey: PoolKey,
    tickLower: bigint,
    tickUpper: bigint,
    liquidity: bigint,
    amount0: bigint,
    amount1: bigint,
    recipient: Address,
    positionManager: Address,
  ): EvmContractCall {
    // Create planner and add CL_MINT_POSITION action
    const planner = new ActionsPlanner();

    // Based on the PancakeSwap SDK, CL_MINT_POSITION expects PositionConfig and other parameters
    const positionConfig: CLPositionConfig = {
      poolKey,
      tickLower: Number(tickLower), // Convert to number for int24
      tickUpper: Number(tickUpper), // Convert to number for int24
    };

    // CL_MINT_POSITION (action 2) parameters: [PositionConfig, uint128, uint128, uint128, address, bytes]
    const mintParams: InfinityABIParametersToValuesType<2> = [
      positionConfig,
      liquidity,
      amount0,
      amount1,
      recipient,
      '0x' as Hex, // Empty bytes for no hook data
    ];

    // Add the CL_MINT_POSITION action with the parameters
    planner.add(ACTIONS.CL_MINT_POSITION, mintParams);

    // Finalize the plan with close (matches Solidity version)
    const payload = planner.finalizeModifyLiquidityWithClose(poolKey);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: CLPositionManagerAbi,
      functionName: 'modifyLiquidities',
      args: [payload, maxUint48],
    });

    return {
      address: positionManager,
      value: 0n,
      data: modifyLiquiditiesData,
    };
  }

  /**
   * Encode increase liquidity parameters for contract calls using planner pattern
   *
   * @example
   * ```typescript
   * const call = encoder.encodeIncreaseLiquidity(
   *   currency0,
   *   currency1,
   *   tokenId,
   *   liquidity,
   *   amount0Max,
   *   amount1Max,
   *   positionManager
   * );
   *
   * // Use the call in a transaction
   * await walletClient.writeContract({
   *   address: call.address,
   *   abi: CLPositionManagerAbi,
   *   functionName: 'modifyLiquidities',
   *   args: [call.data, maxUint48],
   *   data: call.data,
   *   value: call.value,
   * });
   * ```
   */
  public encodeIncreaseLiquidity(
    poolKey: PoolKey,
    tokenId: bigint,
    liquidity: bigint,
    amount0Max: bigint,
    amount1Max: bigint,
    positionManager: Address,
  ): EvmContractCall {
    // Create planner and add CL_INCREASE_LIQUIDITY action
    const planner = new ActionsPlanner();
    // CL_INCREASE_LIQUIDITY (action 0) parameters: [uint256, uint128, uint128, uint128, bytes]
    const increaseParams: InfinityABIParametersToValuesType<0> = [
      tokenId,
      liquidity,
      amount0Max,
      amount1Max,
      '0x' as Hex, // Empty bytes for no hook data
    ];

    // Add the CL_INCREASE_LIQUIDITY action with the parameters
    planner.add(ACTIONS.CL_INCREASE_LIQUIDITY, increaseParams);

    const payload = planner.finalizeModifyLiquidityWithClose(poolKey);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: CLPositionManagerAbi,
      functionName: 'modifyLiquidities',
      args: [payload, maxUint48],
    });

    return {
      address: positionManager,
      value: 0n,
      data: modifyLiquiditiesData,
    };
  }

  /**
   * Encode decrease liquidity parameters for contract calls using planner pattern
   *
   * @example
   * ```typescript
   * const call = encoder.encodeDecreaseLiquidity(
   *   currency0,
   *   currency1,
   *   tokenId,
   *   liquidity,
   *   amount0Min,
   *   amount1Min,
   *   positionManager
   * );
   *
   * // Use the call in a transaction
   * await walletClient.writeContract({
   *   address: call.address,
   *   abi: CLPositionManagerAbi,
   *   functionName: 'modifyLiquidities',
   *   args: [call.data, maxUint48],
   *   data: call.data,
   *   value: call.value,
   * });
   * ```
   */
  public encodeDecreaseLiquidity(
    poolKey: PoolKey,
    tokenId: bigint,
    liquidity: bigint,
    amount0Min: bigint,
    amount1Min: bigint,
    positionManager: Address,
  ): EvmContractCall {
    // Create planner and add CL_DECREASE_LIQUIDITY action
    const planner = new ActionsPlanner();

    // CL_DECREASE_LIQUIDITY (action 1) parameters: [uint256, uint128, uint128, uint128, bytes]
    const decreaseParams: InfinityABIParametersToValuesType<1> = [
      tokenId,
      liquidity,
      amount0Min,
      amount1Min,
      '0x' as Hex, // Empty bytes for no hook data
    ];

    // Add the CL_DECREASE_LIQUIDITY action with the parameters
    planner.add(ACTIONS.CL_DECREASE_LIQUIDITY, decreaseParams);

    const payload = planner.finalizeModifyLiquidityWithClose(poolKey);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: CLPositionManagerAbi,
      functionName: 'modifyLiquidities',
      args: [payload, maxUint48],
    });

    return {
      address: positionManager,
      value: 0n,
      data: modifyLiquiditiesData,
    };
  }

  /**
   * Encode burn position parameters for contract calls using planner pattern
   *
   * @example
   * ```typescript
   * const call = encoder.encodeBurnPosition(
   *   currency0,
   *   currency1,
   *   tokenId,
   *   amount0Min,
   *   amount1Min,
   *   positionManager
   * );
   *
   * // Use the call in a transaction
   * await walletClient.writeContract({
   *   address: call.address,
   *   abi: CLPositionManagerAbi,
   *   functionName: 'modifyLiquidities',
   *   args: [call.data, maxUint48],
   *   data: call.data,
   *   value: call.value,
   * });
   * ```
   */
  public encodeBurnPosition(
    poolKey: PoolKey,
    tokenId: bigint,
    amount0Min: bigint,
    amount1Min: bigint,
    positionManager: Address,
  ): EvmContractCall {
    // Create planner and add CL_BURN_POSITION action
    const planner = new ActionsPlanner();

    // CL_BURN_POSITION (action 3) parameters: [uint256, PositionConfig, uint128, uint128, bytes]
    const positionConfig: CLPositionConfig = {
      poolKey,
      tickLower: 0, // These will be set by the contract based on tokenId
      tickUpper: 0, // These will be set by the contract based on tokenId
    };

    const burnParams: InfinityABIParametersToValuesType<3> = [
      tokenId,
      positionConfig,
      amount0Min,
      amount1Min,
      '0x' as Hex, // Empty bytes for no hook data
    ];

    // Add the CL_BURN_POSITION action with the parameters
    planner.add(ACTIONS.CL_BURN_POSITION, burnParams);

    const payload = planner.finalizeModifyLiquidityWithClose(poolKey);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: CLPositionManagerAbi,
      functionName: 'modifyLiquidities',
      args: [payload, maxUint48],
    });

    return {
      address: positionManager,
      value: 0n,
      data: modifyLiquiditiesData,
    };
  }
}
