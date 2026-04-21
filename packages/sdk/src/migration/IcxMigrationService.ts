import { type Address, type Hex, encodeFunctionData } from 'viem';
import { erc20Abi } from '../shared/abis/index.js';
import { encodeContractCalls, Erc20Service, EvmAssetManagerService, type HubProvider } from '../index.js';
import { icxSwapAbi } from '../shared/abis/icxSwap.abi.js';
import invariant from 'tiny-invariant';
import {
  ChainKeys,
  type IconEoaAddress,
  type IconAddress,
  type EvmContractCall,
  type IcxTokenType,
  type IconChainKey,
  type GetWalletProviderType,
  type SonicChainKey,
} from '@sodax/types';
import type { ConfigService } from '../shared/config/ConfigService.js';

export type IcxMigrateAction = {
  params: IcxMigrateParams;
  walletProvider: GetWalletProviderType<IconChainKey>;
  skipSimulation?: boolean;
  timeout?: number;
};

export type IcxMigrateActionRaw = {
  params: IcxMigrateParams;
  skipSimulation?: boolean;
};

export type IcxMigrateParams = {
  srcAddress: IconAddress;
  srcChainKey: IconChainKey; // should be ChainKeys.ICON_MAINNET
  address: IcxTokenType; // The ICON address of the ICX or wICX token to migrate
  amount: bigint; // The amount of ICX or wICX to migrate
  dstAddress: Address; // The address that will receive the migrated assets
};

export type IcxRevertMigrationAction = {
  params: IcxCreateRevertMigrationParams;
  walletProvider: GetWalletProviderType<SonicChainKey>;
  timeout?: number;
  skipSimulation?: boolean;
}

export type IcxCreateRevertMigrationParams = {
  srcAddress: Address; // should be Sonic original address
  srcChainKey: SonicChainKey; // should be ChainKeys.SONIC_MAINNET
  amount: bigint; // The amount of wICX to migrate
  dstAddress: IconEoaAddress; // The address that will receive the migrated SODA tokens as ICX
};

export type IcxRevertMigrationParams = {
  wICX: IconAddress; // The ICON address of the wICX token
  amount: bigint; // The amount of SODA tokens to migrate to ICX
  userWallet: Address; // The hub wallet address that will migrate assets
  dstAddress: Hex; // The Icon address that will receive the migrated SODA tokens as ICX
};

export type IcxMigrationServiceConstructorParams = {
  hubProvider: HubProvider;
  config: ConfigService;
};

/**
 * Service for handling ICX migration operations on the hub chain.
 * Provides functionality to migrate wICX tokens from ICON to the hub chain.
 */
export class IcxMigrationService {
  private readonly hubProvider: HubProvider;
  private readonly config: ConfigService;

  constructor({ hubProvider, config }: IcxMigrationServiceConstructorParams) {
    this.hubProvider = hubProvider;
    this.config = config;
  }

  /**
   * Retrieves the available amount of SODA tokens in the ICX migration contract.
   * This represents the amount of tokens available for migration.
   *
   * @returns The available balance of SODA tokens in the migration contract
   */
  public async getAvailableAmount(): Promise<bigint> {
    const balance = await this.hubProvider.publicClient.readContract({
      address: this.hubProvider.chainConfig.addresses.sodaToken,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [this.hubProvider.chainConfig.addresses.icxMigration],
    });

    return balance;
  }

  /**
   * Generates transaction data for migrating wICX tokens from ICON to the hub chain.
   * This method creates the necessary contract calls to:
   * 1. Approve the migration contract to spend the wICX tokens
   * 2. Execute the migration swap
   *
   * @param params - The migration parameters including token address, amount, and recipient
   * @returns Encoded transaction data for the migration operation
   * @throws Will throw an error if the hub asset configuration is not found
   */
  public migrateData(params: IcxMigrateParams): Hex {
    const calls: EvmContractCall[] = [];
    const token = this.config.getSpokeTokenFromOriginalAssetAddress(ChainKeys.ICON_MAINNET, params.address);
    invariant(token, `token not found for spoke chain token (token): ${params.address}`);

    calls.push(
      Erc20Service.encodeApprove(token.hubAsset, this.hubProvider.chainConfig.addresses.icxMigration, params.amount),
    );
    calls.push(this.encodeMigrate(params.amount, params.dstAddress));
    return encodeContractCalls(calls);
  }

  /**
   * Generates transaction data for migrating back tokens to the ICON  chain.
   * @param params - The migration parameters including token address, amount, and recipient
   * @returns Encoded transaction data for the migration operation
   * @throws Will throw an error if the hub asset configuration is not found
   */
  public revertMigration(params: IcxRevertMigrationParams): Hex {
    const calls: EvmContractCall[] = [];
    const token = this.config.getSpokeTokenFromOriginalAssetAddress(ChainKeys.ICON_MAINNET, params.wICX);
    invariant(token, `token not found for spoke chain token (token): ${params.wICX}`);

    calls.push(
      Erc20Service.encodeApprove(
        this.hubProvider.chainConfig.addresses.sodaToken,
        this.hubProvider.chainConfig.addresses.icxMigration,
        params.amount,
      ),
    );
    calls.push(this.encodeRevertMigration(params.amount, params.userWallet));
    calls.push(
      EvmAssetManagerService.encodeTransfer(
        token.hubAsset,
        params.dstAddress,
        params.amount,
        this.hubProvider.chainConfig.addresses.assetManager,
      ),
    );
    return encodeContractCalls(calls);
  }

  /**
   * Encodes a migration transaction for the ICX swap contract.
   * This creates the contract call data for swapping wICX tokens to SODA tokens.
   *
   * @param amount - The amount of wICX tokens to migrate
   * @param to - The address that will receive the migrated SODA tokens
   * @returns The encoded contract call for the migration operation
   */
  public encodeMigrate(amount: bigint, to: Address): EvmContractCall {
    return {
      address: this.hubProvider.chainConfig.addresses.icxMigration,
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
   * @param amount - The amount of wICX tokens to migrate
   * @param to - The address that will receive the migrated SODA tokens
   * @returns The encoded contract call for the migration operation
   */
  public encodeRevertMigration(amount: bigint, to: Address): EvmContractCall {
    return {
      address: this.hubProvider.chainConfig.addresses.icxMigration,
      value: 0n,
      data: encodeFunctionData({
        abi: icxSwapAbi,
        functionName: 'reverseSwap',
        args: [amount, to],
      }),
    };
  }
}
