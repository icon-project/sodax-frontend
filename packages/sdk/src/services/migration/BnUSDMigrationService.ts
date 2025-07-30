import type { Address, Hex } from 'viem';
import type { bnUSDLegacySpokeChainId, EvmContractCall } from '../../types.js';
import {
  encodeContractCalls,
  Erc20Service,
  EvmAssetManagerService,
  type EvmHubProvider,
  EvmVaultTokenService,
  getHubAssetInfo,
  getMoneyMarketConfig,
} from '../../index.js';
import invariant from 'tiny-invariant';
import {
  SONIC_MAINNET_CHAIN_ID,
  type HubChainId,
} from '@sodax/types';

export type BnUSDMigrateParams = {
  srcChainID: bnUSDLegacySpokeChainId; // The source chain ID where the legacy bnUSD token exists
  amount: bigint; // The amount of legacy bnUSD to migrate
  to: Address; // The hub (sonic) wallet address that will receive the migrated assets
};

export type BnUSDRevertMigrationParams = {
  srcChainID: HubChainId; // The source chain ID where the new bnUSD token exists
  amount: bigint; // The amount of new bnUSD tokens to migrate back
  to: Hex; // The spoke chain address that will receive the migrated legacy bnUSD tokens
  dstChainID: bnUSDLegacySpokeChainId; // The destination chain ID for the migration
};

/**
 * Service for handling bnUSD migration operations on the hub chain.
 * Provides functionality to migrate between legacy and new bnUSD tokens.
 */
export class BnUSDMigrationService {
  private readonly hubProvider: EvmHubProvider;

  constructor(hubProvider: EvmHubProvider) {
    this.hubProvider = hubProvider;
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
  public migrateData(params: BnUSDMigrateParams & { legacybnUSD: string; newbnUSD: string }): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = getHubAssetInfo(params.srcChainID, params.legacybnUSD);
    invariant(assetConfig, `hub asset not found for legacy bnUSD token: ${params.legacybnUSD}`);

    const bnUSDVault = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).bnUSDVault as Address;

    // Wrap legacy bnUSD into vault tokens
    calls.push(Erc20Service.encodeApprove(assetConfig.asset, assetConfig.vault, params.amount));
    calls.push(EvmVaultTokenService.encodeDeposit(assetConfig.vault, assetConfig.asset, params.amount));

    // Migrate to new bnUSD vault
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimal, params.amount);
    calls.push(Erc20Service.encodeApprove(assetConfig.vault, bnUSDVault, translatedAmount));
    calls.push(EvmVaultTokenService.encodeDeposit(bnUSDVault, assetConfig.vault, translatedAmount));

    if (params.newbnUSD.toLowerCase() === bnUSDVault.toLowerCase()) {
      calls.push(Erc20Service.encodeTransfer(bnUSDVault, params.to, translatedAmount));
      return encodeContractCalls(calls);
    }

    // Withdraw to new bnUSD
    const dstAssetConfig = getHubAssetInfo(this.hubProvider.chainConfig.chain.id, params.newbnUSD);
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
  public revertMigrationData(params: BnUSDRevertMigrationParams & { legacybnUSD: string; newbnUSD: string }): Hex {
    const calls: EvmContractCall[] = [];
    const bnUSDVault = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).bnUSDVault as Address;

    // Wrap new bnUSD into vault tokens
    console.log('params.newbnUSD', params.newbnUSD);
    console.log('bnUSDVault', bnUSDVault);
    let decimals = 18;
    if (params.newbnUSD.toLowerCase() !== bnUSDVault.toLowerCase()) {
      const assetConfig = getHubAssetInfo(params.srcChainID, params.newbnUSD);
      invariant(assetConfig, `hub asset not found for new bnUSD token: ${params.newbnUSD}`);
      decimals = assetConfig.decimal;
      calls.push(Erc20Service.encodeApprove(assetConfig.asset, bnUSDVault, params.amount));
      calls.push(EvmVaultTokenService.encodeDeposit(bnUSDVault, assetConfig.asset, params.amount));
    }

    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(decimals, params.amount);

    // Migrate to legacy bnUSD vault'
    const dstAssetConfig = getHubAssetInfo(params.dstChainID, params.legacybnUSD);
    invariant(dstAssetConfig, `hub asset not found for legacy bnUSD token: ${params.legacybnUSD}`);

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
