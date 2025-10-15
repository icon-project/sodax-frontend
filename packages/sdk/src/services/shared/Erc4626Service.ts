// packages/sdk/src/services/shared/Erc4626Service.ts

import { encodeFunctionData, type Address } from 'viem';
import { erc4626Abi } from '../../abis/erc4626.abi.js';
import type { EvmContractCall, EvmReturnType, PromiseEvmTxReturnType, Result } from '../../types.js';
import type { EvmHubProvider, EvmSpokeProvider, SonicSpokeProvider } from '../../entities/Providers.js';

export class Erc4626Service {
  private constructor() {}

  /**
   * Get the underlying asset address of the vault
   * @param vault - ERC4626 vault address
   * @param spokeProvider - EVM Spoke provider
   * @returns The address of the underlying asset
   */
  static async getAsset(
    vault: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<Address>> {
    try {
      const asset = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'asset',
      });

      return {
        ok: true,
        value: asset,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Get the total amount of underlying assets held by the vault
   * @param vault - ERC4626 vault address
   * @param spokeProvider - EVM Spoke provider
   * @returns Total assets in the vault
   */
  static async getTotalAssets(
    vault: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<bigint>> {
    try {
      const totalAssets = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'totalAssets',
      });

      return {
        ok: true,
        value: totalAssets,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Convert assets to shares
   * @param vault - ERC4626 vault address
   * @param assets - Amount of assets to convert
   * @param spokeProvider - EVM Spoke provider
   * @returns Equivalent amount of shares
   */
  static async convertToShares(
    vault: Address,
    assets: bigint,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<bigint>> {
    try {
      const shares = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'convertToShares',
        args: [assets],
      });

      return {
        ok: true,
        value: shares,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Convert shares to assets
   * @param vault - ERC4626 vault address
   * @param shares - Amount of shares to convert
   * @param spokeProvider - EVM Spoke provider
   * @returns Equivalent amount of assets
   */
  static async convertToAssets(
    vault: Address,
    shares: bigint,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<bigint>> {
    try {
      const assets = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'convertToAssets',
        args: [shares],
      });

      return {
        ok: true,
        value: assets,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Get the maximum amount of assets that can be deposited
   * @param vault - ERC4626 vault address
   * @param receiver - Address that will receive the shares
   * @param spokeProvider - EVM Spoke provider
   * @returns Maximum deposit amount
   */
  static async getMaxDeposit(
    vault: Address,
    receiver: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<bigint>> {
    try {
      const maxDeposit = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'maxDeposit',
        args: [receiver],
      });

      return {
        ok: true,
        value: maxDeposit,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Preview the amount of shares that would be minted for a deposit
   * @param vault - ERC4626 vault address
   * @param assets - Amount of assets to deposit
   * @param spokeProvider - EVM Spoke provider
   * @returns Expected shares to be minted
   */
  static async previewDeposit(
    vault: Address,
    assets: bigint,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<bigint>> {
    try {
      const shares = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'previewDeposit',
        args: [assets],
      });

      return {
        ok: true,
        value: shares,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Deposit assets into the vault
   * @param vault - ERC4626 vault address
   * @param assets - Amount of assets to deposit
   * @param receiver - Address that will receive the shares
   * @param spokeProvider - EVM Provider
   * @param raw - Whether to return raw transaction data
   */
  static async deposit<R extends boolean = false>(
    vault: Address,
    assets: bigint,
    receiver: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress,
      to: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: erc4626Abi,
        functionName: 'deposit',
        args: [assets, receiver],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Get the maximum amount of shares that can be minted
   * @param vault - ERC4626 vault address
   * @param receiver - Address that will receive the shares
   * @param spokeProvider - EVM Spoke provider
   * @returns Maximum mint amount
   */
  static async getMaxMint(
    vault: Address,
    receiver: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<bigint>> {
    try {
      const maxMint = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'maxMint',
        args: [receiver],
      });

      return {
        ok: true,
        value: maxMint,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Preview the amount of assets needed to mint shares
   * @param vault - ERC4626 vault address
   * @param shares - Amount of shares to mint
   * @param spokeProvider - EVM Spoke provider
   * @returns Expected assets needed
   */
  static async previewMint(
    vault: Address,
    shares: bigint,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<bigint>> {
    try {
      const assets = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'previewMint',
        args: [shares],
      });

      return {
        ok: true,
        value: assets,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Mint vault shares
   * @param vault - ERC4626 vault address
   * @param shares - Amount of shares to mint
   * @param receiver - Address that will receive the shares
   * @param spokeProvider - EVM Provider
   * @param raw - Whether to return raw transaction data
   */
  static async mint<R extends boolean = false>(
    vault: Address,
    shares: bigint,
    receiver: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress,
      to: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: erc4626Abi,
        functionName: 'mint',
        args: [shares, receiver],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Get the maximum amount of assets that can be withdrawn
   * @param vault - ERC4626 vault address
   * @param owner - Address of the share owner
   * @param spokeProvider - EVM Spoke provider
   * @returns Maximum withdrawal amount
   */
  static async getMaxWithdraw(
    vault: Address,
    owner: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<bigint>> {
    try {
      const maxWithdraw = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'maxWithdraw',
        args: [owner],
      });

      return {
        ok: true,
        value: maxWithdraw,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Preview the amount of shares that would be burned for a withdrawal
   * @param vault - ERC4626 vault address
   * @param assets - Amount of assets to withdraw
   * @param spokeProvider - EVM Spoke provider
   * @returns Expected shares to be burned
   */
  static async previewWithdraw(
    vault: Address,
    assets: bigint,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<bigint>> {
    try {
      const shares = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'previewWithdraw',
        args: [assets],
      });

      return {
        ok: true,
        value: shares,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Withdraw assets from the vault
   * @param vault - ERC4626 vault address
   * @param assets - Amount of assets to withdraw
   * @param receiver - Address that will receive the assets
   * @param owner - Address of the share owner
   * @param spokeProvider - EVM Provider
   * @param raw - Whether to return raw transaction data
   */
  static async withdraw<R extends boolean = false>(
    vault: Address,
    assets: bigint,
    receiver: Address,
    owner: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress,
      to: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: erc4626Abi,
        functionName: 'withdraw',
        args: [assets, receiver, owner],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Get the maximum amount of shares that can be redeemed
   * @param vault - ERC4626 vault address
   * @param owner - Address of the share owner
   * @param spokeProvider - EVM Spoke provider
   * @returns Maximum redeem amount
   */
  static async getMaxRedeem(
    vault: Address,
    owner: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<bigint>> {
    try {
      const maxRedeem = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'maxRedeem',
        args: [owner],
      });

      return {
        ok: true,
        value: maxRedeem,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Preview the amount of assets that would be received for a redemption
   * @param vault - ERC4626 vault address
   * @param shares - Amount of shares to redeem
   * @param spokeProvider - EVM Spoke provider
   * @returns Expected assets to be received
   */
  static async previewRedeem(
    vault: Address,
    shares: bigint,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider | EvmHubProvider,
  ): Promise<Result<bigint>> {
    try {
      const assets = await spokeProvider.publicClient.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'previewRedeem',
        args: [shares],
      });

      return {
        ok: true,
        value: assets,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Redeem shares for assets
   * @param vault - ERC4626 vault address
   * @param shares - Amount of shares to redeem
   * @param receiver - Address that will receive the assets
   * @param owner - Address of the share owner
   * @param spokeProvider - EVM Provider
   * @param raw - Whether to return raw transaction data
   */
  static async redeem<R extends boolean = false>(
    vault: Address,
    shares: bigint,
    receiver: Address,
    owner: Address,
    spokeProvider: EvmSpokeProvider | SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress,
      to: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: erc4626Abi,
        functionName: 'redeem',
        args: [shares, receiver, owner],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Encodes a deposit transaction for a vault.
   * @param vault - The address of the ERC4626 vault.
   * @param assets - The amount of assets to deposit.
   * @param receiver - The address that will receive the shares.
   * @returns The encoded contract call.
   */
  public static encodeDeposit(vault: Address, assets: bigint, receiver: Address): EvmContractCall {
    return {
      address: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: erc4626Abi,
        functionName: 'deposit',
        args: [assets, receiver],
      }),
    };
  }

  /**
   * Encodes a mint transaction for a vault.
   * @param vault - The address of the ERC4626 vault.
   * @param shares - The amount of shares to mint.
   * @param receiver - The address that will receive the shares.
   * @returns The encoded contract call.
   */
  public static encodeMint(vault: Address, shares: bigint, receiver: Address): EvmContractCall {
    return {
      address: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: erc4626Abi,
        functionName: 'mint',
        args: [shares, receiver],
      }),
    };
  }

  /**
   * Encodes a withdraw transaction for a vault.
   * @param vault - The address of the ERC4626 vault.
   * @param assets - The amount of assets to withdraw.
   * @param receiver - The address that will receive the assets.
   * @param owner - The address of the share owner.
   * @returns The encoded contract call.
   */
  public static encodeWithdraw(vault: Address, assets: bigint, receiver: Address, owner: Address): EvmContractCall {
    return {
      address: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: erc4626Abi,
        functionName: 'withdraw',
        args: [assets, receiver, owner],
      }),
    };
  }

  /**
   * Encodes a redeem transaction for a vault.
   * @param vault - The address of the ERC4626 vault.
   * @param shares - The amount of shares to redeem.
   * @param receiver - The address that will receive the assets.
   * @param owner - The address of the share owner.
   * @returns The encoded contract call.
   */
  public static encodeRedeem(vault: Address, shares: bigint, receiver: Address, owner: Address): EvmContractCall {
    return {
      address: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: erc4626Abi,
        functionName: 'redeem',
        args: [shares, receiver, owner],
      }),
    };
  }
}
