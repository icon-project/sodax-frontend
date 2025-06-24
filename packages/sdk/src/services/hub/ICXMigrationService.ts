import { type Address, type Hex, type HttpTransport, type PublicClient, encodeFunctionData } from 'viem';
import { erc20Abi } from '../../abis/index.js';
import type { EvmContractCall, EvmHubChainConfig, IconAddress } from '../../types.js';
import { encodeContractCalls, Erc20Service, EvmAssetManagerService, getHubAssetInfo } from '../../index.js';
import { icxSwapAbi } from '../../abis/icxSwap.abi.js';
import invariant from 'tiny-invariant';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';

/**
 * Parameters for ICX migration operations.
 */
export type ICXMigrateParams = {
  /** The ICON address of the wICX token to migrate */
  wICX: IconAddress;
  /** The amount of wICX to migrate */
  amount: bigint;
  /** The address that will receive the migrated assets */
  to: Address;
};

/**
 * Parameters for ICX migration operations.
 */
export type ICXRevertMigrationParams = {
  /** The ICON address of the wICX token to migrate */
  wICX: IconAddress;
  /** The amount of wICX to migrate */
  amount: bigint;
  /** The wallet address that will migrate assets */
  userWallet: Address;
  /** The address that will receive the migrated assets */
  to: Hex;
};

/**
 * Service for handling ICX migration operations on the hub chain.
 * Provides functionality to migrate wICX tokens from ICON to the hub chain.
 */
export namespace ICXMigrationService {
  /**
   * Retrieves the available amount of SODA tokens in the ICX migration contract.
   * This represents the amount of tokens available for migration.
   *
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param publicClient - The public client for reading contract state
   * @returns The available balance of SODA tokens in the migration contract
   */
  export async function getAvailableAmount(
    hubChainConfig: EvmHubChainConfig,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<bigint> {
    const balance = await publicClient.readContract({
      address: hubChainConfig.addresses.sodaToken,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [hubChainConfig.addresses.icxMigration],
    });

    return balance;
  }

  /**
   * Generates transaction data for migrating wICX tokens from ICON to the hub chain.
   * This method creates the necessary contract calls to:
   * 1. Approve the migration contract to spend the wICX tokens
   * 2. Execute the migration swap
   *
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param params - The migration parameters including token address, amount, and recipient
   * @returns Encoded transaction data for the migration operation
   * @throws Will throw an error if the hub asset configuration is not found
   */
  export async function migrateData(hubChainConfig: EvmHubChainConfig, params: ICXMigrateParams): Promise<Hex> {
    const calls: EvmContractCall[] = [];
    const assetConfig = getHubAssetInfo(ICON_MAINNET_CHAIN_ID, params.wICX);
    invariant(assetConfig, `hub asset not found for spoke chain token (token): ${params.wICX}`);

    calls.push(Erc20Service.encodeApprove(assetConfig.asset, hubChainConfig.addresses.icxMigration, params.amount));
    calls.push(encodeMigrate(hubChainConfig, params.amount, params.to));
    return encodeContractCalls(calls);
  }

  /**
   * Generates transaction data for migrating back tokens to the ICON  chain.
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param params - The migration parameters including token address, amount, and recipient
   * @returns Encoded transaction data for the migration operation
   * @throws Will throw an error if the hub asset configuration is not found
   */
  export async function revertMigration(
    hubChainConfig: EvmHubChainConfig,
    params: ICXRevertMigrationParams,
  ): Promise<Hex> {
    const calls: EvmContractCall[] = [];
    const assetConfig = getHubAssetInfo(ICON_MAINNET_CHAIN_ID, params.wICX);
    invariant(assetConfig, `hub asset not found for spoke chain token (token): ${params.wICX}`);

    calls.push(
      Erc20Service.encodeApprove(
        hubChainConfig.addresses.sodaToken,
        hubChainConfig.addresses.icxMigration,
        params.amount,
      ),
    );
    calls.push(encodeRevertMigration(hubChainConfig, params.amount, params.userWallet));
    calls.push(
      EvmAssetManagerService.encodeTransfer(
        assetConfig.asset,
        params.to,
        params.amount,
        hubChainConfig.addresses.assetManager,
      ),
    );
    return encodeContractCalls(calls);
  }

  /**
   * Encodes a migration transaction for the ICX swap contract.
   * This creates the contract call data for swapping wICX tokens to SODA tokens.
   *
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param amount - The amount of wICX tokens to migrate
   * @param to - The address that will receive the migrated SODA tokens
   * @returns The encoded contract call for the migration operation
   */
  export function encodeMigrate(hubChainConfig: EvmHubChainConfig, amount: bigint, to: Address): EvmContractCall {
    return {
      address: hubChainConfig.addresses.icxMigration,
      value: 0n,
      data: encodeFunctionData({
        abi: icxSwapAbi,
        functionName: 'swap',
        args: [amount, to],
      }),
    };
  }

  /**
   * Encodes a revert migration transaction for the ICX swap contract.
   * This creates the contract call data for swapping SODA tokens to wICX tokens.
   *
   * @param hubChainConfig - The hub chain configuration containing contract addresses
   * @param amount - The amount of wICX tokens to migrate
   * @param to - The address that will receive the migrated SODA tokens
   * @returns The encoded contract call for the migration operation
   */
  export function encodeRevertMigration(
    hubChainConfig: EvmHubChainConfig,
    amount: bigint,
    to: Address,
  ): EvmContractCall {
    return {
      address: hubChainConfig.addresses.icxMigration,
      value: 0n,
      data: encodeFunctionData({
        abi: icxSwapAbi,
        functionName: 'reverseSwap',
        args: [amount, to],
      }),
    };
  }
}
