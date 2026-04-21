import type { Hex } from 'viem';
import {
  encodeContractCalls,
  Erc20Service,
  EvmAssetManagerService,
  type HubProvider,
  EvmVaultTokenService,
} from '../index.js';
import invariant from 'tiny-invariant';
import type { EvmContractCall, GetWalletProviderType, SpokeChainKey } from '@sodax/types';
import type { ConfigService } from '../shared/config/ConfigService.js';

export type UnifiedBnUSDMigrateAction<K extends SpokeChainKey> = {
  params: UnifiedBnUSDMigrateParams<K>;
  walletProvider: GetWalletProviderType<K>;
  unchecked?: boolean;
  skipSimulation?: boolean;
  timeout?: number;
};

export type UnifiedBnUSDMigrateActionRaw<K extends SpokeChainKey> = {
  params: UnifiedBnUSDMigrateParams<K>;
  unchecked?: boolean;
  skipSimulation?: boolean;
};

export type UnifiedBnUSDMigrateParams<K extends SpokeChainKey> = {
  srcAddress: string;
  srcChainKey: K; // The source chain ID where bnUSD (legacy or new) token exists
  srcbnUSD: string; // The spoke address of the bnUSD source token to migrate
  dstChainKey: SpokeChainKey; // The destination chain ID for the migration
  dstbnUSD: string; // The spoke address of the bnUSD destination token to receive
  amount: bigint; // The amount of bnUSD to migrate
  dstAddress: string; // The spoke address that will receive the migrated new bnUSD tokens
};

type FormattedBnUSDMigrateParams = {
  srcChainKey: SpokeChainKey; // The source chain ID where the legacy bnUSD token exists
  legacybnUSD: string; // The spoke address of the legacy bnUSD token to migrate
  newbnUSD: string; // The spoke address of the new bnUSD token to receive
  amount: bigint; // The amount of legacy bnUSD to migrate
  dstAddress: Hex; // The encoded spoke address (translated to hub chain) that will receive the migrated new bnUSD tokens
  dstChainKey: SpokeChainKey; // The destination chain ID for the migration
};

export type BnUSDRevertMigrationParams = {
  srcChainId: SpokeChainKey; // The source chain ID where the new bnUSD token exists
  legacybnUSD: string; // The ICON address of the legacy bnUSD token to receive
  newbnUSD: string; // The ICON address of the new bnUSD token to migrate from
  amount: bigint; // The amount of new bnUSD tokens to migrate back
  dstAddress: Hex; // The spoke chain address that will receive the migrated legacy bnUSD tokens
  dstChainKey: SpokeChainKey; // The destination chain ID for the migration
};

export type BnUSDMigrationServiceConstructorParams = {
  hubProvider: HubProvider;
  config: ConfigService;
};

/**
 * Service for handling bnUSD migration operations on the hub chain.
 * Provides functionality to migrate between legacy and new bnUSD tokens.
 */
export class BnUSDMigrationService {
  private readonly hubProvider: HubProvider;
  private readonly config: ConfigService;

  constructor({ hubProvider, config }: BnUSDMigrationServiceConstructorParams) {
    this.hubProvider = hubProvider;
    this.config = config;
  }

  /**
   * Generates transaction data for migrating legacy bnUSD tokens to new bnUSD tokens.
   * This method creates the necessary contract calls to:
   * 1. Wrap legacy bnUSD into vault tokens
   * 2. Migrate to new bnUSD vault
   * 3. Withdraw to new bnUSD tokens
   *
   * @param params - The migration parameters including token addresses, amount, and recipient
   * @returns Encoded transaction data for the migration operation
   * @throws Will throw an error if the hub asset configuration is not found
   */
  public migrateData(params: FormattedBnUSDMigrateParams): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = this.config.getSpokeTokenFromOriginalAssetAddress(params.srcChainKey, params.legacybnUSD);
    invariant(assetConfig, `hub asset not found for legacy bnUSD token: ${params.legacybnUSD}`);

    const bnUSDVault = this.config.moneyMarket.bnUSDVault;

    // Wrap legacy bnUSD into vault tokens
    calls.push(Erc20Service.encodeApprove(assetConfig.hubAsset, assetConfig.vault, params.amount));
    calls.push(EvmVaultTokenService.encodeDeposit(assetConfig.vault, assetConfig.hubAsset, params.amount));

    // Migrate to new bnUSD vault
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimals, params.amount);
    calls.push(Erc20Service.encodeApprove(assetConfig.vault, bnUSDVault, translatedAmount));
    calls.push(EvmVaultTokenService.encodeDeposit(bnUSDVault, assetConfig.vault, translatedAmount));

    // check if bnUSD is getting migrated to hub chain bnUSD vault
    if (params.newbnUSD.toLowerCase() === bnUSDVault.toLowerCase()) {
      calls.push(Erc20Service.encodeTransfer(bnUSDVault, params.dstAddress, translatedAmount));
      return encodeContractCalls(calls);
    }

    // Withdraw to new bnUSD
    const dstAssetConfig = this.config.getSpokeTokenFromOriginalAssetAddress(params.dstChainKey, params.newbnUSD);
    invariant(dstAssetConfig, `hub asset not found for new bnUSD token: ${params.newbnUSD}`);

    calls.push(EvmVaultTokenService.encodeWithdraw(bnUSDVault, dstAssetConfig.hubAsset, translatedAmount));
    const translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(
      dstAssetConfig.decimals,
      translatedAmount,
    );
    calls.push(
      EvmAssetManagerService.encodeTransfer(
        dstAssetConfig.hubAsset,
        params.dstAddress,
        translatedAmountOut,
        this.hubProvider.chainConfig.addresses.assetManager,
      ),
    );

    return encodeContractCalls(calls);
  }

  /**
   * Generates transaction data for migrating new bnUSD tokens back to legacy bnUSD tokens.
   * This method creates the necessary contract calls to:
   * 1. Wrap new bnUSD into vault tokens
   * 2. Migrate to legacy bnUSD vault
   * 3. Withdraw to legacy bnUSD tokens
   *
   * @param params - The migration parameters including token addresses, amount, and recipient
   * @returns Encoded transaction data for the migration operation
   * @throws Will throw an error if the hub asset configuration is not found
   */
  public revertMigrationData(params: BnUSDRevertMigrationParams): Hex {
    const calls: EvmContractCall[] = [];
    const bnUSDVault = this.config.moneyMarket.bnUSDVault;

    // Wrap new bnUSD into vault tokens
    let decimals = 18;
    if (params.newbnUSD.toLowerCase() !== bnUSDVault.toLowerCase()) {
      const assetConfig = this.config.getSpokeTokenFromOriginalAssetAddress(params.srcChainId, params.newbnUSD);
      invariant(assetConfig, `hub asset not found for new bnUSD token: ${params.newbnUSD}`);
      decimals = assetConfig.decimals;
      calls.push(Erc20Service.encodeApprove(assetConfig.hubAsset, bnUSDVault, params.amount));
      calls.push(EvmVaultTokenService.encodeDeposit(bnUSDVault, assetConfig.hubAsset, params.amount));
    }

    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(decimals, params.amount);

    // Migrate to legacy bnUSD vault'
    const dstAssetConfig = this.config.getSpokeTokenFromOriginalAssetAddress(params.dstChainKey, params.legacybnUSD);
    invariant(dstAssetConfig, `hub asset not found for new bnUSD token: ${params.legacybnUSD}`);

    calls.push(EvmVaultTokenService.encodeWithdraw(bnUSDVault, dstAssetConfig.vault, translatedAmount));
    calls.push(EvmVaultTokenService.encodeWithdraw(dstAssetConfig.vault, dstAssetConfig.hubAsset, translatedAmount));

    const translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(
      dstAssetConfig.decimals,
      translatedAmount,
    );

    calls.push(
      EvmAssetManagerService.encodeTransfer(
        dstAssetConfig.hubAsset,
        params.dstAddress,
        translatedAmountOut,
        this.hubProvider.chainConfig.addresses.assetManager,
      ),
    );

    return encodeContractCalls(calls);
  }
}
