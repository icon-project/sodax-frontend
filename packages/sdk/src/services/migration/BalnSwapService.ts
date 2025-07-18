// packages/sdk/src/services/hub/BalnSwapService.ts
import { type Address, type Hex, type HttpTransport, type PublicClient, encodeFunctionData } from 'viem';
import { balnSwapAbi } from '../../abis/balnSwap.abi.js';
import type { EvmContractCall, EvmHubChainConfig, EvmReturnType, PromiseEvmTxReturnType } from '../../types.js';
import { encodeContractCalls, Erc20Service } from '../../index.js';
import type { SonicSpokeProvider } from '../../entities/index.js';

/**
 * Lockup periods in seconds
 */
export enum LockupPeriod {
  NO_LOCKUP = 0,
  SIX_MONTHS = 6 * 30 * 24 * 60 * 60, // 6 months
  TWELVE_MONTHS = 12 * 30 * 24 * 60 * 60, // 12 months
  EIGHTEEN_MONTHS = 18 * 30 * 24 * 60 * 60, // 18 months
  TWENTY_FOUR_MONTHS = 24 * 30 * 24 * 60 * 60, // 24 months
}

/**
 * Reward multipliers (in basis points, 10000 = 1.0)
 */
export enum LockupMultiplier {
  NO_LOCKUP_MULTIPLIER = 5000, // 0.5x
  SIX_MONTHS_MULTIPLIER = 7500, // 0.75x
  TWELVE_MONTHS_MULTIPLIER = 10000, // 1.0x
  EIGHTEEN_MONTHS_MULTIPLIER = 12500, // 1.25x
  TWENTY_FOUR_MONTHS_MULTIPLIER = 15000, // 1.5x
}

/**
 * Unstake request information from the staked SODA contract.
 */
export type UnstakeRequest = {
  /** The amount being unstaked */
  amount: bigint;
  /** The start time of the unstake request */
  startTime: bigint;
  /** The address to receive the unstaked tokens */
  to: Address;
};

/**
 * Detailed lock information structure returned by the BALN swap contract.
 */
export type DetailedLock = {
  /** The amount of BALN tokens in the lock */
  balnAmount: bigint;
  /** The amount of SODA tokens in the lock */
  sodaAmount: bigint;
  /** The unlock time for the lock */
  unlockTime: bigint;
  /** The amount of xSODA tokens in the lock */
  xSodaAmount: bigint;
  /** The unstaking ID for the lock */
  unstakingId: bigint;
  /** The unstake request information */
  unstakeRequest: UnstakeRequest;
  /** The amount of staked SODA tokens */
  stakedSodaAmount: bigint;
};

/**
 * Parameters for BALN swap operations.
 */
export type BalnSwapParams = {
  /** The amount of BALN tokens to swap */
  amount: bigint;
  /** The lockup period for the swap */
  lockupPeriod: LockupPeriod;
  /** The address that will receive the swapped SODA tokens */
  to: Address;
  /** Whether to stake the SODA tokens */
  stake: boolean;
};

/**
 * Parameters for BALN lock operations.
 */
export type BalnLockParams = {
  /** The lock ID to operate on */
  lockId: bigint;
};

/**
 * Service for handling BALN swap operations on the hub chain.
 * Provides functionality to interact directly with the BALN swap contract.
 */
export namespace BalnSwapService {
  /**
   * Gets the multiplier for a given lockup period.
   * @param lockupPeriod - The lockup period
   * @returns The multiplier in basis points
   */
  export function getMultiplierForPeriod(lockupPeriod: LockupPeriod): bigint {
    switch (lockupPeriod) {
      case LockupPeriod.NO_LOCKUP:
        return BigInt(LockupMultiplier.NO_LOCKUP_MULTIPLIER);
      case LockupPeriod.SIX_MONTHS:
        return BigInt(LockupMultiplier.SIX_MONTHS_MULTIPLIER);
      case LockupPeriod.TWELVE_MONTHS:
        return BigInt(LockupMultiplier.TWELVE_MONTHS_MULTIPLIER);
      case LockupPeriod.EIGHTEEN_MONTHS:
        return BigInt(LockupMultiplier.EIGHTEEN_MONTHS_MULTIPLIER);
      case LockupPeriod.TWENTY_FOUR_MONTHS:
        return BigInt(LockupMultiplier.TWENTY_FOUR_MONTHS_MULTIPLIER);
      default:
        throw new Error(`Invalid lockup period: ${lockupPeriod}`);
    }
  }

  /**
   * Calculates the SODA amount for a given BALN amount and lockup period without calling the contract.
   * @param balnAmount - The amount of BALN tokens
   * @param lockupPeriod - The lockup period
   * @returns The calculated SODA amount
   */
  export function calculateSodaAmount(balnAmount: bigint, lockupPeriod: LockupPeriod): bigint {
    const multiplier = getMultiplierForPeriod(lockupPeriod);
    const basisPoints = 10000n;

    // SODA amount = BALN amount * multiplier / basis points
    return (balnAmount * multiplier) / basisPoints;
  }

  /**
   * Generates transaction data for swapping BALN tokens to SODA tokens.
   * This method creates the necessary contract calls to:
   * 1. Approve the BALN swap contract to spend the BALN tokens
   * 2. Execute the BALN swap with lockup period
   *
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param balnToken - The address of the BALN token
   * @param params - The BALN swap parameters including amount, lockup period, and recipient
   * @returns Encoded transaction data for the BALN swap operation
   */
  export async function swapData(
    hubChainConfig: EvmHubChainConfig,
    balnToken: Address,
    params: BalnSwapParams,
  ): Promise<Hex> {
    const calls: EvmContractCall[] = [];

    // Approve BALN tokens for the swap contract
    calls.push(Erc20Service.encodeApprove(balnToken, hubChainConfig.addresses.balnSwap, params.amount));
    calls.push(encodeSwap(hubChainConfig, params.amount, params.lockupPeriod, params.to, params.stake));

    return encodeContractCalls(calls);
  }

  /**
   * Executes a claim operation directly through the wallet provider.
   * @param hubChainConfig - The hub chain configuration
   * @param params - The lock parameters including lock ID
   * @param spokeProvider - The Sonic spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns The transaction hash or raw transaction data
   */
  export async function claim<R extends boolean = false>(
    hubChainConfig: EvmHubChainConfig,
    params: BalnLockParams,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const claimTx = encodeClaim(hubChainConfig, params.lockId);
    return await call(spokeProvider, claimTx, raw);
  }

  /**
   * Executes a claim unstaked operation directly through the wallet provider.
   * @param hubChainConfig - The hub chain configuration
   * @param params - The lock parameters including lock ID
   * @param spokeProvider - The Sonic spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns The transaction hash or raw transaction data
   */
  export async function claimUnstaked<R extends boolean = false>(
    hubChainConfig: EvmHubChainConfig,
    params: BalnLockParams,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const claimUnstakedTx = encodeClaimUnstaked(hubChainConfig, params.lockId);
    return await call(spokeProvider, claimUnstakedTx, raw);
  }

  /**
   * Executes a stake operation directly through the wallet provider.
   * @param hubChainConfig - The hub chain configuration
   * @param params - The lock parameters including lock ID
   * @param spokeProvider - The Sonic spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns The transaction hash or raw transaction data
   */
  export async function stake<R extends boolean = false>(
    hubChainConfig: EvmHubChainConfig,
    params: BalnLockParams,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const stakeTx = encodeStake(hubChainConfig, params.lockId);
    return await call(spokeProvider, stakeTx, raw);
  }

  /**
   * Executes an unstake operation directly through the wallet provider.
   * @param hubChainConfig - The hub chain configuration
   * @param params - The lock parameters including lock ID
   * @param spokeProvider - The Sonic spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns The transaction hash or raw transaction data
   */
  export async function unstake<R extends boolean = false>(
    hubChainConfig: EvmHubChainConfig,
    params: BalnLockParams,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const unstakeTx = encodeUnstake(hubChainConfig, params.lockId);
    return await call(spokeProvider, unstakeTx, raw);
  }

  /**
   * Gets detailed locks for a specific user including unstake requests and staked amounts.
   *
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param publicClient - The public client for reading contract state
   * @param user - The user address
   * @returns Array of detailed lock information for the user
   */
  export async function getDetailedUserLocks(
    hubChainConfig: EvmHubChainConfig,
    publicClient: PublicClient<HttpTransport>,
    user: Address,
  ): Promise<readonly DetailedLock[]> {
    return await publicClient.readContract({
      address: hubChainConfig.addresses.balnSwap,
      abi: balnSwapAbi,
      functionName: 'getDetailedUserLocks',
      args: [user],
    });
  }

  // ===== ENCODING METHODS =====

  /**
   * Encodes a swap transaction for the BALN swap contract.
   *
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param amount - The amount of BALN tokens to swap
   * @param lockupPeriod - The lockup period for the swap
   * @param to - The address that will receive the swapped SODA tokens
   * @param stake - Whether to stake the SODA tokens
   * @returns The encoded contract call for the swap operation
   */
  export function encodeSwap(
    hubChainConfig: EvmHubChainConfig,
    amount: bigint,
    lockupPeriod: LockupPeriod,
    to: Address,
    stake: boolean,
  ): EvmContractCall {
    return {
      address: hubChainConfig.addresses.balnSwap,
      value: 0n,
      data: encodeFunctionData({
        abi: balnSwapAbi,
        functionName: 'swap',
        args: [amount, BigInt(lockupPeriod), to, stake],
      }),
    };
  }

  /**
   * Encodes a claim transaction for the BALN swap contract.
   *
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param lockId - The lock ID to claim from
   * @returns The encoded contract call for the claim operation
   */
  export function encodeClaim(hubChainConfig: EvmHubChainConfig, lockId: bigint): EvmContractCall {
    return {
      address: hubChainConfig.addresses.balnSwap,
      value: 0n,
      data: encodeFunctionData({
        abi: balnSwapAbi,
        functionName: 'claim',
        args: [lockId],
      }),
    };
  }

  /**
   * Encodes a claim unstaked transaction for the BALN swap contract.
   *
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param lockId - The lock ID to claim unstaked tokens from
   * @returns The encoded contract call for the claim unstaked operation
   */
  export function encodeClaimUnstaked(hubChainConfig: EvmHubChainConfig, lockId: bigint): EvmContractCall {
    return {
      address: hubChainConfig.addresses.balnSwap,
      value: 0n,
      data: encodeFunctionData({
        abi: balnSwapAbi,
        functionName: 'claimUnstaked',
        args: [lockId],
      }),
    };
  }

  /**
   * Encodes a stake transaction for the BALN swap contract.
   *
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param lockId - The lock ID to stake
   * @returns The encoded contract call for the stake operation
   */
  export function encodeStake(hubChainConfig: EvmHubChainConfig, lockId: bigint): EvmContractCall {
    return {
      address: hubChainConfig.addresses.balnSwap,
      value: 0n,
      data: encodeFunctionData({
        abi: balnSwapAbi,
        functionName: 'stake',
        args: [lockId],
      }),
    };
  }

  /**
   * Encodes an unstake transaction for the BALN swap contract.
   *
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param lockId - The lock ID to unstake
   * @returns The encoded contract call for the unstake operation
   */
  export function encodeUnstake(hubChainConfig: EvmHubChainConfig, lockId: bigint): EvmContractCall {
    return {
      address: hubChainConfig.addresses.balnSwap,
      value: 0n,
      data: encodeFunctionData({
        abi: balnSwapAbi,
        functionName: 'unstake',
        args: [lockId],
      }),
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Executes a contract call through the Sonic wallet provider.
   * @param spokeProvider - The Sonic spoke provider
   * @param rawTx - The raw contract call to execute
   * @param raw - Whether to return raw transaction data
   * @returns The transaction hash or raw transaction data
   */
  async function call<R extends boolean = false>(
    spokeProvider: SonicSpokeProvider,
    rawTx: EvmContractCall,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const from = await spokeProvider.walletProvider.getWalletAddress();

    const tx = {
      from,
      to: rawTx.address,
      value: rawTx.value,
      data: rawTx.data,
    } satisfies EvmReturnType<true>;

    if (raw) {
      return tx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(tx) as PromiseEvmTxReturnType<R>;
  }
}
