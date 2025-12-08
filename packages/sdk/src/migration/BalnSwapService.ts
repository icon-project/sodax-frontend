import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';
// packages/sdk/src/services/hub/BalnSwapService.ts
import { type Address, type Hex, type HttpTransport, type PublicClient, encodeFunctionData } from 'viem';
import { balnSwapAbi } from '../shared/abis/balnSwap.abi.js';
import type {
  EvmContractCall,
  GetAddressType,
  IconContractAddress,
  SonicSpokeProviderType,
  TxReturnType,
} from '../shared/types.js';
import { encodeContractCalls, Erc20Service, isSonicRawSpokeProvider } from '../index.js';
import type { EvmHubProvider } from '../shared/entities/index.js';
import invariant from 'tiny-invariant';
import type { ConfigService } from '../shared/config/ConfigService.js';

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
export type BalnMigrateParams = {
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

export type BalnSwapServiceConstructorParams = {
  hubProvider: EvmHubProvider;
};

/**
 * Service for handling BALN swap operations on the hub chain.
 * Provides functionality to interact directly with the BALN swap contract.
 */
export class BalnSwapService {
  private readonly hubProvider: EvmHubProvider;

  constructor({ hubProvider }: BalnSwapServiceConstructorParams) {
    this.hubProvider = hubProvider;
  }

  /**
   * Gets the multiplier for a given lockup period.
   * @param lockupPeriod - The lockup period
   * @returns The multiplier in basis points
   */
  getMultiplierForPeriod(lockupPeriod: LockupPeriod): bigint {
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
  calculateSodaAmount(balnAmount: bigint, lockupPeriod: LockupPeriod): bigint {
    const multiplier = this.getMultiplierForPeriod(lockupPeriod);
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
   * @param balnToken - The address of the BALN token
   * @param params - The BALN swap parameters including amount, lockup period, and recipient
   * @param configService - The config service
   * @returns Encoded transaction data for the BALN swap operation
   */
  swapData(balnToken: IconContractAddress, params: BalnMigrateParams, configService: ConfigService): Hex {
    const assetConfig = configService.getHubAssetInfo(ICON_MAINNET_CHAIN_ID, balnToken);
    invariant(assetConfig, `hub asset not found for baln token: ${balnToken}`);

    const calls: EvmContractCall[] = [];

    // Approve BALN tokens for the swap contract
    calls.push(
      Erc20Service.encodeApprove(assetConfig.asset, this.hubProvider.chainConfig.addresses.balnSwap, params.amount),
    );
    calls.push(this.encodeSwap(params.amount, params.lockupPeriod, params.to, params.stake));

    return encodeContractCalls(calls);
  }

  /**
   * Executes a claim operation directly through the wallet provider.
   * @param params - The lock parameters including lock ID
   * @param spokeProvider - The Sonic spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns The transaction hash or raw transaction data
   */
  async claim<S extends SonicSpokeProviderType, R extends boolean = false>(
    params: BalnLockParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    const claimTx = this.encodeClaim(params.lockId);
    return await this.call(spokeProvider, claimTx, raw);
  }

  /**
   * Executes a claim unstaked operation directly through the wallet provider.
   * @param params - The lock parameters including lock ID
   * @param spokeProvider - The Sonic spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns The transaction hash or raw transaction data
   */
  async claimUnstaked<S extends SonicSpokeProviderType, R extends boolean = false>(
    params: BalnLockParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    const claimUnstakedTx = this.encodeClaimUnstaked(params.lockId);
    return await this.call(spokeProvider, claimUnstakedTx, raw);
  }

  /**
   * Executes a stake operation directly through the wallet provider.
   * @param params - The lock parameters including lock ID
   * @param spokeProvider - The Sonic spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns The transaction hash or raw transaction data
   */
  async stake<S extends SonicSpokeProviderType, R extends boolean = false>(
    params: BalnLockParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    const stakeTx = this.encodeStake(params.lockId);
    return await this.call(spokeProvider, stakeTx, raw);
  }

  /**
   * Executes an unstake operation directly through the wallet provider.
   * @param params - The lock parameters including lock ID
   * @param spokeProvider - The Sonic spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns The transaction hash or raw transaction data
   */
  async unstake<S extends SonicSpokeProviderType, R extends boolean = false>(
    params: BalnLockParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    const unstakeTx = this.encodeUnstake(params.lockId);
    return await this.call(spokeProvider, unstakeTx, raw);
  }

  /**
   * Executes a cancel unstake operation directly through the wallet provider.
   * @param params - The lock parameters including lock ID
   * @param spokeProvider - The Sonic spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns The transaction hash or raw transaction data
   */
  async cancelUnstake<S extends SonicSpokeProviderType, R extends boolean = false>(
    params: BalnLockParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    const cancelUnstakeTx = this.encodeCancelUnstake(params.lockId);
    return await this.call(spokeProvider, cancelUnstakeTx, raw);
  }

  /**
   * Gets detailed locks for a specific user including unstake requests and staked amounts.
   *
   * @param publicClient - The public client for reading contract state
   * @param user - The user address
   * @returns Array of detailed lock information for the user
   */
  async getDetailedUserLocks(
    publicClient: PublicClient<HttpTransport>,
    user: Address,
  ): Promise<readonly DetailedLock[]> {
    return await publicClient.readContract({
      address: this.hubProvider.chainConfig.addresses.balnSwap,
      abi: balnSwapAbi,
      functionName: 'getDetailedUserLocks',
      args: [user],
    });
  }

  // ===== ENCODING METHODS =====

  /**
   * Encodes a swap transaction for the BALN swap contract.
   *
   * @param amount - The amount of BALN tokens to swap
   * @param lockupPeriod - The lockup period for the swap
   * @param to - The address that will receive the swapped SODA tokens
   * @param stake - Whether to stake the SODA tokens
   * @returns The encoded contract call for the swap operation
   */
  encodeSwap(amount: bigint, lockupPeriod: LockupPeriod, to: Address, stake: boolean): EvmContractCall {
    return {
      address: this.hubProvider.chainConfig.addresses.balnSwap,
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
   * @param lockId - The lock ID to claim from
   * @returns The encoded contract call for the claim operation
   */
  encodeClaim(lockId: bigint): EvmContractCall {
    return {
      address: this.hubProvider.chainConfig.addresses.balnSwap,
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
   * @param lockId - The lock ID to claim unstaked tokens from
   * @returns The encoded contract call for the claim unstaked operation
   */
  encodeClaimUnstaked(lockId: bigint): EvmContractCall {
    return {
      address: this.hubProvider.chainConfig.addresses.balnSwap,
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
   * @param lockId - The lock ID to stake
   * @returns The encoded contract call for the stake operation
   */
  encodeStake(lockId: bigint): EvmContractCall {
    return {
      address: this.hubProvider.chainConfig.addresses.balnSwap,
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
   * @param lockId - The lock ID to unstake
   * @returns The encoded contract call for the unstake operation
   */
  encodeUnstake(lockId: bigint): EvmContractCall {
    return {
      address: this.hubProvider.chainConfig.addresses.balnSwap,
      value: 0n,
      data: encodeFunctionData({
        abi: balnSwapAbi,
        functionName: 'unstake',
        args: [lockId],
      }),
    };
  }

  /**
   * Encodes a cancel unstake transaction for the BALN swap contract.
   *
   * @param lockId - The lock ID to cancel unstake for
   * @returns The encoded contract call for the cancel unstake operation
   */
  encodeCancelUnstake(lockId: bigint): EvmContractCall {
    return {
      address: this.hubProvider.chainConfig.addresses.balnSwap,
      value: 0n,
      data: encodeFunctionData({
        abi: balnSwapAbi,
        functionName: 'cancelUnstake',
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
  async call<S extends SonicSpokeProviderType, R extends boolean = false>(
    spokeProvider: S,
    rawTx: EvmContractCall,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    const from = await spokeProvider.walletProvider.getWalletAddress();

    const tx = {
      from: from as GetAddressType<SonicSpokeProviderType>,
      to: rawTx.address,
      value: rawTx.value,
      data: rawTx.data,
    } satisfies TxReturnType<SonicSpokeProviderType, true>;

    if (raw || isSonicRawSpokeProvider(spokeProvider)) {
      return tx satisfies TxReturnType<SonicSpokeProviderType, true> as TxReturnType<S, R>;
    }

    return spokeProvider.walletProvider.sendTransaction(tx) satisfies Promise<
      TxReturnType<SonicSpokeProviderType, false>
    > as Promise<TxReturnType<S, R>>;
  }
}
