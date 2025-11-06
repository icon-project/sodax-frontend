// packages/sdk/src/services/staking/StakingLogic.ts
import { type Address, type Hex, type HttpTransport, type PublicClient, encodeFunctionData } from 'viem';
import { stakedSodaAbi } from '../shared/abis/stakedSoda.abi.js';
import { stakingRouterAbi } from '../shared/abis/stakingRouter.abi.js';
import type { EvmContractCall, UserUnstakeInfo } from '../shared/types.js';

export class StakingLogic {
  private constructor() {}

  /**
   * Retrieves all unstake requests for a specific user.
   * @param stakedSoda - The address of the StakedSoda contract.
   * @param user - The address of the user.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns Array of user unstake info for the user.
   */
  public static async getUnstakeSodaRequests(
    stakedSoda: Address,
    user: Address,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<readonly UserUnstakeInfo[]> {
    const requests = await publicClient.readContract({
      address: stakedSoda,
      abi: stakedSodaAbi,
      functionName: 'getUnstakeRequests',
      args: [user],
    });

    return requests;
  }

  /**
   * Encodes the depositFor transaction data.
   * @param stakedSoda - The address of the StakedSoda contract.
   * @param account - The address of the account to deposit for.
   * @param amount - The amount of tokens to deposit.
   * @returns The encoded contract call data.
   */
  static encodeDepositFor(stakedSoda: Address, account: Address, amount: bigint): EvmContractCall {
    return {
      address: stakedSoda,
      value: 0n,
      data: encodeFunctionData({
        abi: stakedSodaAbi,
        functionName: 'depositFor',
        args: [account, amount],
      }),
    };
  }

  /**
   * Encodes the withdrawTo transaction data.
   * @param stakedSoda - The address of the StakedSoda contract.
   * @param account - The address of the account to withdraw to.
   * @param value - The amount of tokens to withdraw.
   * @returns The encoded contract call data.
   */
  static encodeWithdrawTo(stakedSoda: Address, account: Address, value: bigint): EvmContractCall {
    return {
      address: stakedSoda,
      value: 0n,
      data: encodeFunctionData({
        abi: stakedSodaAbi,
        functionName: 'withdrawTo',
        args: [account, value],
      }),
    };
  }

  /**
   * Encodes the unstake transaction data.
   * @param stakedSoda - The address of the StakedSoda contract.
   * @param account - The address of the account to unstake for.
   * @param value - The amount of tokens to unstake.
   * @returns The encoded contract call data.
   */
  static encodeUnstake(stakedSoda: Address, account: Address, value: bigint): EvmContractCall {
    return {
      address: stakedSoda,
      value: 0n,
      data: encodeFunctionData({
        abi: stakedSodaAbi,
        functionName: 'unstake',
        args: [account, value],
      }),
    };
  }

  /**
   * Encodes the cancelUnstakeSodaRequest transaction data.
   * @param stakedSoda - The address of the StakedSoda contract.
   * @param requestId - The ID of the unstake request to cancel.
   * @returns The encoded contract call data.
   */
  static encodeCancelUnstakeSodaRequest(stakedSoda: Address, requestId: bigint): EvmContractCall {
    return {
      address: stakedSoda,
      value: 0n,
      data: encodeFunctionData({
        abi: stakedSodaAbi,
        functionName: 'cancelUnstakeRequest',
        args: [requestId],
      }),
    };
  }

  /**
   * Encodes the cancelUnstakeRequest transaction data (alias for encodeCancelUnstakeSodaRequest).
   * @param stakedSoda - The address of the StakedSoda contract.
   * @param requestId - The ID of the unstake request to cancel.
   * @returns The encoded contract call data.
   */
  static encodeCancelUnstakeRequest(stakedSoda: Address, requestId: bigint): EvmContractCall {
    return StakingLogic.encodeCancelUnstakeSodaRequest(stakedSoda, requestId);
  }

  /**
   * Encodes the claim transaction data.
   * @param stakedSoda - The address of the StakedSoda contract.
   * @param requestId - The ID of the unstake request to claim.
   * @returns The encoded contract call data.
   */
  static encodeClaim(stakedSoda: Address, requestId: bigint): EvmContractCall {
    return {
      address: stakedSoda,
      value: 0n,
      data: encodeFunctionData({
        abi: stakedSodaAbi,
        functionName: 'claim',
        args: [requestId],
      }),
    };
  }

  // xSoda ERC4626 Read Methods

  /**
   * Returns the total amount of SODA assets held by the xSoda vault.
   * @param xSoda - The address of the xSoda token contract.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns The total amount of SODA assets.
   */
  public static async getXSodaTotalAssets(xSoda: Address, publicClient: PublicClient<HttpTransport>): Promise<bigint> {
    return publicClient.readContract({
      address: xSoda,
      abi: stakedSodaAbi,
      functionName: 'totalAssets',
      args: [],
    });
  }

  /**
   * Calculates the number of xSoda shares equivalent to a given amount of SODA assets.
   * @param xSoda - The address of the xSoda token contract.
   * @param assets - The amount of SODA assets to convert.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns The number of xSoda shares.
   */
  public static async convertSodaToXSodaShares(
    xSoda: Address,
    assets: bigint,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<bigint> {
    return publicClient.readContract({
      address: xSoda,
      abi: stakedSodaAbi,
      functionName: 'convertToShares',
      args: [assets],
    });
  }

  /**
   * Calculates the amount of SODA assets corresponding to a specific number of xSoda shares.
   * @param xSoda - The address of the xSoda token contract.
   * @param shares - The number of xSoda shares to convert.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns The amount of SODA assets.
   */
  public static async convertXSodaSharesToSoda(
    xSoda: Address,
    shares: bigint,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<bigint> {
    return publicClient.readContract({
      address: xSoda,
      abi: stakedSodaAbi,
      functionName: 'convertToAssets',
      args: [shares],
    });
  }

  /**
   * Simulates the effects of depositing SODA into xSoda without executing it.
   * @param xSoda - The address of the xSoda token contract.
   * @param assets - The amount of SODA assets to deposit.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns The number of xSoda shares that would be minted.
   */
  public static async previewXSodaDeposit(
    xSoda: Address,
    assets: bigint,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<bigint> {
    return publicClient.readContract({
      address: xSoda,
      abi: stakedSodaAbi,
      functionName: 'previewDeposit',
      args: [assets],
    });
  }

  /**
   * Simulates the effects of minting xSoda shares without executing it.
   * @param xSoda - The address of the xSoda token contract.
   * @param shares - The number of xSoda shares to mint.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns The amount of SODA assets that would be deposited.
   */
  public static async previewXSodaMint(
    xSoda: Address,
    shares: bigint,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<bigint> {
    return publicClient.readContract({
      address: xSoda,
      abi: stakedSodaAbi,
      functionName: 'previewMint',
      args: [shares],
    });
  }

  /**
   * Simulates the effects of withdrawing SODA from xSoda without executing it.
   * @param xSoda - The address of the xSoda token contract.
   * @param assets - The amount of SODA assets to withdraw.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns The number of xSoda shares that would be burned.
   */
  public static async previewXSodaWithdraw(
    xSoda: Address,
    assets: bigint,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<bigint> {
    return publicClient.readContract({
      address: xSoda,
      abi: stakedSodaAbi,
      functionName: 'previewWithdraw',
      args: [assets],
    });
  }

  /**
   * Simulates the effects of redeeming xSoda shares without executing it.
   * @param xSoda - The address of the xSoda token contract.
   * @param shares - The number of xSoda shares to redeem.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns The amount of SODA assets that would be withdrawn.
   */
  public static async previewXSodaRedeem(
    xSoda: Address,
    shares: bigint,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<bigint> {
    return publicClient.readContract({
      address: xSoda,
      abi: stakedSodaAbi,
      functionName: 'previewRedeem',
      args: [shares],
    });
  }

  // xSoda ERC4626 Encoding Methods

  /**
   * Encodes the xSoda deposit transaction data (deposit SODA to get xSoda shares).
   * @param xSoda - The address of the xSoda token contract.
   * @param assets - The amount of SODA assets to deposit.
   * @param receiver - The address of the receiver.
   * @returns The encoded contract call data.
   */
  static encodeXSodaDeposit(xSoda: Address, assets: bigint, receiver: Address): EvmContractCall {
    return {
      address: xSoda,
      value: 0n,
      data: encodeFunctionData({
        abi: stakedSodaAbi,
        functionName: 'deposit',
        args: [assets, receiver],
      }),
    };
  }

  /**
   * Encodes the xSoda mint transaction data (mint xSoda shares by depositing SODA).
   * @param xSoda - The address of the xSoda token contract.
   * @param shares - The number of xSoda shares to mint.
   * @param receiver - The address of the receiver.
   * @returns The encoded contract call data.
   */
  static encodeXSodaMint(xSoda: Address, shares: bigint, receiver: Address): EvmContractCall {
    return {
      address: xSoda,
      value: 0n,
      data: encodeFunctionData({
        abi: stakedSodaAbi,
        functionName: 'mint',
        args: [shares, receiver],
      }),
    };
  }

  /**
   * Encodes the xSoda withdraw transaction data (withdraw SODA by burning xSoda shares).
   * @param xSoda - The address of the xSoda token contract.
   * @param assets - The amount of SODA assets to withdraw.
   * @param receiver - The address of the receiver.
   * @param owner - The address of the owner.
   * @returns The encoded contract call data.
   */
  static encodeXSodaWithdraw(xSoda: Address, assets: bigint, receiver: Address, owner: Address): EvmContractCall {
    return {
      address: xSoda,
      value: 0n,
      data: encodeFunctionData({
        abi: stakedSodaAbi,
        functionName: 'withdraw',
        args: [assets, receiver, owner],
      }),
    };
  }

  /**
   * Encodes the xSoda redeem transaction data (redeem xSoda shares to get SODA).
   * @param xSoda - The address of the xSoda token contract.
   * @param shares - The number of xSoda shares to redeem.
   * @param receiver - The address of the receiver.
   * @param owner - The address of the owner.
   * @returns The encoded contract call data.
   */
  static encodeXSodaRedeem(xSoda: Address, shares: bigint, receiver: Address, owner: Address): EvmContractCall {
    return {
      address: xSoda,
      value: 0n,
      data: encodeFunctionData({
        abi: stakedSodaAbi,
        functionName: 'redeem',
        args: [shares, receiver, owner],
      }),
    };
  }

  // StakingRouter Methods

  /**
   * Encodes the StakingRouter stake transaction data.
   * @param stakingRouter - The address of the StakingRouter contract.
   * @param amount - The amount of SODA to stake.
   * @param to - The address to receive the staked tokens.
   * @param minReceive - The minimum amount to receive.
   * @returns The encoded contract call data.
   */
  static encodeStakingRouterStake(
    stakingRouter: Address,
    amount: bigint,
    to: Address,
    minReceive: bigint,
  ): EvmContractCall {
    return {
      address: stakingRouter,
      value: 0n,
      data: encodeFunctionData({
        abi: stakingRouterAbi,
        functionName: 'stake',
        args: [amount, to, minReceive],
      }),
    };
  }

  /**
   * Encodes the StakingRouter unstake transaction data.
   * @param stakingRouter - The address of the StakingRouter contract.
   * @param amount - The amount of xSoda to unstake.
   * @param minAmount - The minimum amount of SODA to receive.
   * @param asset - The asset address to receive.
   * @param chainID - The destination chain ID.
   * @param to - The destination address as bytes.
   * @returns The encoded contract call data.
   */
  static encodeStakingRouterUnstake(
    stakingRouter: Address,
    amount: bigint,
    minAmount: bigint,
    asset: Address,
    chainID: bigint,
    to: Hex,
  ): EvmContractCall {
    return {
      address: stakingRouter,
      value: 0n,
      data: encodeFunctionData({
        abi: stakingRouterAbi,
        functionName: 'unstake',
        args: [amount, minAmount, asset, chainID, to],
      }),
    };
  }

  // Estimation Methods

  /**
   * Estimates the xSoda amount and preview deposit for a given SODA amount.
   * @param stakingRouter - The address of the StakingRouter contract.
   * @param amount - The amount of SODA to estimate.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns Tuple containing [xSodaAmount, previewDepositAmount].
   */
  public static async estimateXSodaAmount(
    stakingRouter: Address,
    amount: bigint,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<readonly [bigint, bigint]> {
    return publicClient.readContract({
      address: stakingRouter,
      abi: stakingRouterAbi,
      functionName: 'estimateXSodaAmount',
      args: [amount],
    });
  }

  /**
   * Estimates the instant unstake amount for a given xSoda amount.
   * @param stakingRouter - The address of the StakingRouter contract.
   * @param amount - The amount of xSoda to estimate unstake for.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns The estimated SODA amount from instant unstake.
   */
  public static async estimateInstantUnstake(
    stakingRouter: Address,
    amount: bigint,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<bigint> {
    return publicClient.readContract({
      address: stakingRouter,
      abi: stakingRouterAbi,
      functionName: 'estimateInstantUnstake',
      args: [amount],
    });
  }
}
