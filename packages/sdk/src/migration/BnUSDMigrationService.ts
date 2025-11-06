import type { Address, Hex } from 'viem';
import type { EvmContractCall } from '../shared/types.js';
import {
  encodeContractCalls,
  Erc20Service,
  EvmAssetManagerService,
  type EvmHubProvider,
  EvmVaultTokenService,
} from '../index.js';
import invariant from 'tiny-invariant';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId, getMoneyMarketConfig } from '@sodax/types';
import type { ConfigService } from '../shared/config/ConfigService.js';

export type UnifiedBnUSDMigrateParams = {
  srcChainId: SpokeChainId; // The source chain ID where bnUSD (legacy or new) token exists
  srcbnUSD: string; // The spoke address of the bnUSD source token to migrate
  dstChainId: SpokeChainId; // The destination chain ID for the migration
  dstbnUSD: string; // The spoke address of the bnUSD destination token to receive
  amount: bigint; // The amount of bnUSD to migrate
  to: string; // The spoke address that will receive the migrated new bnUSD tokens
};

type FormattedBnUSDMigrateParams = {
  srcChainId: SpokeChainId; // The source chain ID where the legacy bnUSD token exists
  legacybnUSD: string; // The spoke address of the legacy bnUSD token to migrate
  newbnUSD: string; // The spoke address of the new bnUSD token to receive
  amount: bigint; // The amount of legacy bnUSD to migrate
  to: Hex; // The encoded spoke address (translated to hub chain) that will receive the migrated new bnUSD tokens
  dstChainId: SpokeChainId; // The destination chain ID for the migration
};

export type BnUSDRevertMigrationParams = {
  srcChainId: SpokeChainId; // The source chain ID where the new bnUSD token exists
  legacybnUSD: string; // The ICON address of the legacy bnUSD token to receive
  newbnUSD: string; // The ICON address of the new bnUSD token to migrate from
  amount: bigint; // The amount of new bnUSD tokens to migrate back
  to: Hex; // The spoke chain address that will receive the migrated legacy bnUSD tokens
  dstChainId: SpokeChainId; // The destination chain ID for the migration
};

export type BnUSDMigrationServiceConstructorParams = {
  hubProvider: EvmHubProvider;
  configService: ConfigService;
};

/**
 * Service for handling bnUSD migration operations on the hub chain.
 * Provides functionality to migrate between legacy and new bnUSD tokens.
 */
export class BnUSDMigrationService {
  private readonly hubProvider: EvmHubProvider;
  private readonly configService: ConfigService;

  constructor({ hubProvider, configService }: BnUSDMigrationServiceConstructorParams) {
    this.hubProvider = hubProvider;
    this.configService = configService;
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
    const assetConfig = this.configService.getHubAssetInfo(params.srcChainId, params.legacybnUSD);
    invariant(assetConfig, `hub asset not found for legacy bnUSD token: ${params.legacybnUSD}`);

    const bnUSDVault = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).bnUSDVault as Address;

    // Wrap legacy bnUSD into vault tokens
    calls.push(Erc20Service.encodeApprove(assetConfig.asset, assetConfig.vault, params.amount));
    calls.push(EvmVaultTokenService.encodeDeposit(assetConfig.vault, assetConfig.asset, params.amount));

    // Migrate to new bnUSD vault
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimal, params.amount);
    calls.push(Erc20Service.encodeApprove(assetConfig.vault, bnUSDVault, translatedAmount));
    calls.push(EvmVaultTokenService.encodeDeposit(bnUSDVault, assetConfig.vault, translatedAmount));

    // check if bnUSD is getting migrated to hub chain bnUSD vault
    if (params.newbnUSD.toLowerCase() === bnUSDVault.toLowerCase()) {
      calls.push(Erc20Service.encodeTransfer(bnUSDVault, params.to, translatedAmount));
      return encodeContractCalls(calls);
    }

    // Withdraw to new bnUSD
    const dstAssetConfig = this.configService.getHubAssetInfo(params.dstChainId, params.newbnUSD);
    invariant(dstAssetConfig, `hub asset not found for new bnUSD token: ${params.newbnUSD}`);

    calls.push(EvmVaultTokenService.encodeWithdraw(bnUSDVault, dstAssetConfig.asset, translatedAmount));
    const translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(
      dstAssetConfig.decimal,
      translatedAmount,
    );
    calls.push(
      EvmAssetManagerService.encodeTransfer(
        dstAssetConfig.asset,
        params.to,
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
    const bnUSDVault = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).bnUSDVault as Address;

    // Wrap new bnUSD into vault tokens
    let decimals = 18;
    if (params.newbnUSD.toLowerCase() !== bnUSDVault.toLowerCase()) {
      const assetConfig = this.configService.getHubAssetInfo(params.srcChainId, params.newbnUSD);
      invariant(assetConfig, `hub asset not found for new bnUSD token: ${params.newbnUSD}`);
      decimals = assetConfig.decimal;
      calls.push(Erc20Service.encodeApprove(assetConfig.asset, bnUSDVault, params.amount));
      calls.push(EvmVaultTokenService.encodeDeposit(bnUSDVault, assetConfig.asset, params.amount));
    }

    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(decimals, params.amount);

    // Migrate to legacy bnUSD vault'
    const dstAssetConfig = this.configService.getHubAssetInfo(params.dstChainId, params.legacybnUSD);
    invariant(dstAssetConfig, `hub asset not found for new bnUSD token: ${params.legacybnUSD}`);

    calls.push(EvmVaultTokenService.encodeWithdraw(bnUSDVault, dstAssetConfig.vault, translatedAmount));
    calls.push(EvmVaultTokenService.encodeWithdraw(dstAssetConfig.vault, dstAssetConfig.asset, translatedAmount));

    const translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(
      dstAssetConfig.decimal,
      translatedAmount,
    );

    calls.push(
      EvmAssetManagerService.encodeTransfer(
        dstAssetConfig.asset,
        params.to,
        translatedAmountOut,
        this.hubProvider.chainConfig.addresses.assetManager,
      ),
    );

    return encodeContractCalls(calls);
  }
}
