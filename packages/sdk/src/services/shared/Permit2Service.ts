// packages/sdk/src/services/shared/Permit2Service.ts

import { encodeFunctionData, type Address } from 'viem';
import { permit2Abi } from '../../abis/permit2.abi.js';
import type { EvmContractCall, EvmReturnType, PromiseEvmTxReturnType, Result } from '../../types.js';
import type { EvmHubProvider, EvmSpokeProvider, SonicSpokeProvider } from '../../entities/Providers.js';

export interface PermitDetails {
  token: Address;
  amount: bigint;
  expiration: number;
  nonce: number;
}

export interface PermitSingle {
  details: PermitDetails;
  spender: Address;
  sigDeadline: bigint;
}

export interface PermitBatch {
  details: PermitDetails[];
  spender: Address;
  sigDeadline: bigint;
}

export interface AllowanceTransferDetails {
  from: Address;
  to: Address;
  amount: bigint;
  token: Address;
}

export interface TokenSpenderPair {
  token: Address;
  spender: Address;
}

export interface AllowanceInfo {
  amount: bigint;
  expiration: number;
  nonce: number;
}

export class Permit2Service {
  private constructor() {}

  /**
   * Get allowance information for a user, token, and spender
   * @param permit2 - Permit2 contract address
   * @param user - User address
   * @param token - Token address
   * @param spender - Spender address
   * @param spokeProvider - EVM Spoke provider
   * @returns Allowance details including amount, expiration, and nonce
   */
  static async getAllowance(
    permit2: Address,
    user: Address,
    token: Address,
    spender: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<AllowanceInfo>> {
    try {
      const result = await spokeProvider.publicClient.readContract({
        address: permit2,
        abi: permit2Abi,
        functionName: 'allowance',
        args: [user, token, spender],
      });

      return {
        ok: true,
        value: {
          amount: BigInt(result[0]),
          expiration: Number(result[1]),
          nonce: Number(result[2]),
        },
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Check if a spender has sufficient Permit2 allowance
   * @param permit2 - Permit2 contract address
   * @param user - User address
   * @param token - Token address
   * @param spender - Spender address
   * @param amount - Required amount
   * @param spokeProvider - EVM Spoke provider
   * @returns True if allowance is sufficient and not expired
   */
  static async isAllowanceValid(
    permit2: Address,
    user: Address,
    token: Address,
    spender: Address,
    amount: bigint,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<boolean>> {
    try {
      const allowanceResult = await Permit2Service.getAllowance(permit2, user, token, spender, spokeProvider);

      if (!allowanceResult.ok) {
        return allowanceResult;
      }

      const { amount: allowedAmount, expiration } = allowanceResult.value;
      const currentTime = Math.floor(Date.now() / 1000);

      return {
        ok: true,
        value: allowedAmount >= amount && expiration > currentTime,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Approve a spender to transfer tokens via Permit2
   * @param permit2 - Permit2 contract address
   * @param token - Token address
   * @param spender - Spender address
   * @param amount - Amount to approve (uint160)
   * @param expiration - Expiration timestamp
   * @param spokeProvider - EVM Provider
   * @param raw - Whether to return raw transaction data
   */
  static async approve<R extends boolean = false>(
    permit2: Address,
    token: Address,
    spender: Address,
    amount: bigint,
    expiration: number,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress,
      to: permit2,
      value: 0n,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'approve',
        args: [token, spender, amount, expiration],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Execute a permit for a single token
   * @param permit2 - Permit2 contract address
   * @param owner - Owner address
   * @param permitSingle - Permit data for single token
   * @param signature - EIP-712 signature
   * @param spokeProvider - EVM Provider
   * @param raw - Whether to return raw transaction data
   */
  static async permit<R extends boolean = false>(
    permit2: Address,
    owner: Address,
    permitSingle: PermitSingle,
    signature: `0x${string}`,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress,
      to: permit2,
      value: 0n,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'permit',
        args: [owner, permitSingle, signature],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Execute a permit for multiple tokens
   * @param permit2 - Permit2 contract address
   * @param owner - Owner address
   * @param permitBatch - Permit data for multiple tokens
   * @param signature - EIP-712 signature
   * @param spokeProvider - EVM Provider
   * @param raw - Whether to return raw transaction data
   */
  static async permitBatch<R extends boolean = false>(
    permit2: Address,
    owner: Address,
    permitBatch: PermitBatch,
    signature: `0x${string}`,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress,
      to: permit2,
      value: 0n,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'permitBatch',
        args: [owner, permitBatch, signature],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Transfer tokens from one address to another using Permit2
   * @param permit2 - Permit2 contract address
   * @param from - From address
   * @param to - To address
   * @param amount - Amount to transfer (uint160)
   * @param token - Token address
   * @param spokeProvider - EVM Provider
   * @param raw - Whether to return raw transaction data
   */
  static async transferFrom<R extends boolean = false>(
    permit2: Address,
    from: Address,
    to: Address,
    amount: bigint,
    token: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress,
      to: permit2,
      value: 0n,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'transferFrom',
        args: [from, to, amount, token],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Transfer multiple tokens in a batch using Permit2
   * @param permit2 - Permit2 contract address
   * @param transferDetails - Array of transfer details
   * @param spokeProvider - EVM Provider
   * @param raw - Whether to return raw transaction data
   */
  static async transferFromBatch<R extends boolean = false>(
    permit2: Address,
    transferDetails: AllowanceTransferDetails[],
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress,
      to: permit2,
      value: 0n,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'transferFromBatch',
        args: [transferDetails],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Lockdown approvals to prevent malicious usage
   * @param permit2 - Permit2 contract address
   * @param approvals - Array of token-spender pairs to lockdown
   * @param spokeProvider - EVM Provider
   * @param raw - Whether to return raw transaction data
   */
  static async lockdown<R extends boolean = false>(
    permit2: Address,
    approvals: TokenSpenderPair[],
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress,
      to: permit2,
      value: 0n,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'lockdown',
        args: [approvals],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Invalidate nonces to prevent replay attacks
   * @param permit2 - Permit2 contract address
   * @param token - Token address
   * @param spender - Spender address
   * @param newNonce - New nonce value
   * @param spokeProvider - EVM Provider
   * @param raw - Whether to return raw transaction data
   */
  static async invalidateNonces<R extends boolean = false>(
    permit2: Address,
    token: Address,
    spender: Address,
    newNonce: number,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress,
      to: permit2,
      value: 0n,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'invalidateNonces',
        args: [token, spender, newNonce],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Encodes an approve transaction for Permit2.
   * @param permit2 - The address of the Permit2 contract.
   * @param token - The address of the token.
   * @param spender - The address of the spender.
   * @param amount - The amount to approve.
   * @param expiration - The expiration timestamp.
   * @returns The encoded contract call.
   */
  public static encodeApprove(
    permit2: Address,
    token: Address,
    spender: Address,
    amount: bigint,
    expiration: number,
  ): EvmContractCall {
    return {
      address: permit2,
      value: 0n,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'approve',
        args: [token, spender, amount, expiration],
      }),
    };
  }

  /**
   * Encodes a permit transaction for Permit2.
   * @param permit2 - The address of the Permit2 contract.
   * @param owner - The owner address.
   * @param permitSingle - The permit data.
   * @param signature - The signature.
   * @returns The encoded contract call.
   */
  public static encodePermit(
    permit2: Address,
    owner: Address,
    permitSingle: PermitSingle,
    signature: `0x${string}`,
  ): EvmContractCall {
    return {
      address: permit2,
      value: 0n,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'permit',
        args: [owner, permitSingle, signature],
      }),
    };
  }

  /**
   * Encodes a transferFrom transaction for Permit2.
   * @param permit2 - The address of the Permit2 contract.
   * @param from - The from address.
   * @param to - The to address.
   * @param amount - The amount to transfer.
   * @param token - The token address.
   * @returns The encoded contract call.
   */
  public static encodeTransferFrom(
    permit2: Address,
    from: Address,
    to: Address,
    amount: bigint,
    token: Address,
  ): EvmContractCall {
    return {
      address: permit2,
      value: 0n,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'transferFrom',
        args: [from, to, amount, token],
      }),
    };
  }

  /**
   * Encodes a transferFromBatch transaction for Permit2.
   * @param permit2 - The address of the Permit2 contract.
   * @param transferDetails - Array of transfer details.
   * @returns The encoded contract call.
   */
  public static encodeTransferFromBatch(
    permit2: Address,
    transferDetails: AllowanceTransferDetails[],
  ): EvmContractCall {
    return {
      address: permit2,
      value: 0n,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'transferFromBatch',
        args: [transferDetails],
      }),
    };
  }
}
