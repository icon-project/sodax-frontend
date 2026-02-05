import type {
  JsonRpcPayloadResponse,
  ResponseAddressType,
  ResponseSigningType,
} from './entities/icon/HanaWalletConnector.js';
import {
  type EvmUninitializedConfig,
  type EvmInitializedConfig,
  type EvmUninitializedPrivateKeyConfig,
  type EvmUninitializedBrowserConfig,
  EvmSpokeProvider,
  SonicSpokeProvider,
  type EvmRawSpokeProvider,
  type SonicRawSpokeProvider,
  type RawSpokeProvider,
  type SpokeProviderType,
  type SpokeProvider,
} from './entities/Providers.js';
import { InjectiveSpokeProvider, type InjectiveRawSpokeProvider } from './entities/injective/InjectiveSpokeProvider.js';
import { IconSpokeProvider, type IconRawSpokeProvider } from './entities/icon/IconSpokeProvider.js';
import { SolanaSpokeProvider, type SolanaRawSpokeProvider } from './entities/solana/SolanaSpokeProvider.js';
import { SuiSpokeProvider, type SuiRawSpokeProvider } from './entities/sui/SuiSpokeProvider.js';
import { StellarSpokeProvider, type StellarRawSpokeProvider } from './entities/stellar/StellarSpokeProvider.js';
import type {
  EvmSpokeProviderType,
  IconSpokeProviderType,
  InjectiveSpokeProviderType,
  MoneyMarketConfigParams,
  Optional,
  PartnerFeeAmount,
  PartnerFeeConfig,
  PartnerFeePercentage,
  Prettify,
  RawDestinationParams,
  SolanaSpokeProviderType,
  SolverConfigParams,
  SonicSpokeProviderType,
  SpokeProviderObjectType,
  StellarSpokeProviderType,
  SuiSpokeProviderType,
} from './types.js';
import type { EvmHubChainConfig, HubChainConfig } from '@sodax/types';
import type { IntentError } from '../swap/SwapService.js';
import type { MoneyMarketError, MoneyMarketUnknownError } from '../moneyMarket/MoneyMarketService.js';
import type { IcxMigrateParams, IcxCreateRevertMigrationParams } from '../migration/IcxMigrationService.js';
import type { UnifiedBnUSDMigrateParams } from '../migration/BnUSDMigrationService.js';
import type { BalnMigrateParams } from '../migration/BalnSwapService.js';
import {
  type EvmSpokeChainConfig,
  type SpokeChainConfig,
  type SolverConfig,
  type MoneyMarketConfig,
  type IconAddress,
  type IntentRelayChainId,
  SONIC_MAINNET_CHAIN_ID,
  ChainIdToIntentRelayChainId,
} from '@sodax/types';

export function isEvmHubChainConfig(value: HubChainConfig): value is EvmHubChainConfig {
  return typeof value === 'object' && value.chain.type === 'EVM';
}

export function isEvmSpokeChainConfig(value: SpokeChainConfig): value is EvmSpokeChainConfig {
  return typeof value === 'object' && value.chain.type === 'EVM';
}

export function isEvmUninitializedConfig(
  value: EvmUninitializedConfig | EvmInitializedConfig,
): value is EvmUninitializedConfig {
  return typeof value === 'object' && 'chain' in value;
}

export function isEvmInitializedConfig(
  value: EvmUninitializedConfig | EvmInitializedConfig,
): value is EvmInitializedConfig {
  return typeof value === 'object' && 'walletClient' in value && 'publicClient' in value;
}

export function isEvmUninitializedBrowserConfig(value: EvmUninitializedConfig): value is EvmUninitializedBrowserConfig {
  return typeof value === 'object' && 'userAddress' in value && 'chain' in value && 'provider' in value;
}

export function isEvmUninitializedPrivateKeyConfig(
  value: EvmUninitializedConfig,
): value is EvmUninitializedPrivateKeyConfig {
  return typeof value === 'object' && 'chain' in value && 'privateKey' in value;
}

export function isIconAddress(value: unknown): value is IconAddress {
  return typeof value === 'string' && /^hx[a-f0-9]{40}$|^cx[a-f0-9]{40}$/.test(value);
}
export function isResponseAddressType(value: unknown): value is ResponseAddressType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'payload' in value &&
    value.type === 'RESPONSE_ADDRESS' &&
    isIconAddress(value.payload)
  );
}

export function isResponseSigningType(value: unknown): value is ResponseSigningType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'payload' in value &&
    value.type === 'RESPONSE_SIGNING' &&
    typeof value.payload === 'string'
  );
}

export function isJsonRpcPayloadResponse(value: unknown): value is JsonRpcPayloadResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'result' in value &&
    typeof value.result === 'string'
  );
}

export function isIntentRelayChainId(value: bigint): value is IntentRelayChainId {
  return (
    typeof value === 'bigint' &&
    value >= 0n &&
    Object.values(ChainIdToIntentRelayChainId).includes(value as IntentRelayChainId)
  );
}

export function isPartnerFeeAmount(value: unknown): value is PartnerFeeAmount {
  return typeof value === 'object' && value !== null && 'address' in value && 'amount' in value;
}

export function isPartnerFeePercentage(value: unknown): value is PartnerFeePercentage {
  return typeof value === 'object' && value !== null && 'address' in value && 'percentage' in value;
}

export function isEvmSpokeProviderType(value: SpokeProviderType): value is EvmSpokeProviderType {
  return typeof value === 'object' && value !== null && (isEvmSpokeProvider(value) || isEvmRawSpokeProvider(value));
}

export function isEvmSpokeProvider(value: SpokeProviderType): value is EvmSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof EvmSpokeProvider &&
    !('raw' in value) &&
    value.chainConfig.chain.type === 'EVM'
  );
}

export function isSonicSpokeProviderType(value: SpokeProviderType): value is SonicSpokeProviderType {
  return typeof value === 'object' && value !== null && (isSonicSpokeProvider(value) || isSonicRawSpokeProvider(value));
}

export function isSonicSpokeProvider(value: SpokeProviderType): value is SonicSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof SonicSpokeProvider &&
    value.chainConfig.chain.type === 'EVM' &&
    !('raw' in value) &&
    value.chainConfig.chain.id === SONIC_MAINNET_CHAIN_ID
  );
}

export function isSolanaSpokeProviderType(value: SpokeProviderType): value is SolanaSpokeProviderType {
  return (
    typeof value === 'object' && value !== null && (isSolanaSpokeProvider(value) || isSolanaRawSpokeProvider(value))
  );
}

export function isSolanaSpokeProvider(value: SpokeProviderType): value is SolanaSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof SolanaSpokeProvider &&
    !('raw' in value) &&
    value.chainConfig.chain.type === 'SOLANA'
  );
}

export function isStellarSpokeProviderType(value: SpokeProviderType): value is StellarSpokeProviderType {
  return (
    typeof value === 'object' && value !== null && (isStellarSpokeProvider(value) || isStellarRawSpokeProvider(value))
  );
}

export function isStellarSpokeProvider(value: SpokeProviderType): value is StellarSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof StellarSpokeProvider &&
    !('raw' in value) &&
    value.chainConfig.chain.type === 'STELLAR'
  );
}

export function isInjectiveSpokeProviderType(value: SpokeProviderType): value is InjectiveSpokeProviderType {
  return (
    typeof value === 'object' &&
    value !== null &&
    (isInjectiveSpokeProvider(value) || isInjectiveRawSpokeProvider(value))
  );
}

export function isInjectiveSpokeProvider(value: SpokeProviderType): value is InjectiveSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof InjectiveSpokeProvider &&
    !('raw' in value) &&
    value.chainConfig.chain.type === 'INJECTIVE'
  );
}

export function isIconSpokeProviderType(value: SpokeProviderType): value is IconSpokeProviderType {
  return typeof value === 'object' && value !== null && (isIconSpokeProvider(value) || isIconRawSpokeProvider(value));
}

export function isIconSpokeProvider(value: SpokeProviderType): value is IconSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof IconSpokeProvider &&
    !('raw' in value) &&
    value.chainConfig.chain.type === 'ICON'
  );
}

export function isSuiSpokeProviderType(value: SpokeProviderType): value is SuiSpokeProviderType {
  return typeof value === 'object' && value !== null && (isSuiSpokeProvider(value) || isSuiRawSpokeProvider(value));
}

export function isSuiSpokeProvider(value: SpokeProviderType): value is SuiSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof SuiSpokeProvider &&
    !('raw' in value) &&
    value.chainConfig.chain.type === 'SUI'
  );
}

export function isConfiguredSolverConfig(
  value: SolverConfigParams,
): value is Prettify<SolverConfig & Optional<PartnerFeeConfig, 'partnerFee'>> {
  return typeof value === 'object' && value !== null && 'intentsContract' in value && 'solverApiEndpoint' in value;
}

export function isConfiguredMoneyMarketConfig(
  value: MoneyMarketConfigParams,
): value is Prettify<MoneyMarketConfig & Optional<PartnerFeeConfig, 'partnerFee'>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lendingPool' in value &&
    'uiPoolDataProvider' in value &&
    'poolAddressesProvider' in value &&
    'bnUSD' in value &&
    'bnUSDVault' in value
  );
}

export function isIntentCreationFailedError(error: unknown): error is IntentError<'CREATION_FAILED'> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'CREATION_FAILED' &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'payload' in error.data &&
    'error' in error.data
  );
}

export function isIntentSubmitTxFailedError(error: unknown): error is IntentError<'SUBMIT_TX_FAILED'> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'SUBMIT_TX_FAILED' &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'payload' in error.data &&
    'error' in error.data
  );
}

export function isIntentPostExecutionFailedError(error: unknown): error is IntentError<'POST_EXECUTION_FAILED'> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'POST_EXECUTION_FAILED' &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'detail' in error.data
  );
}

export function isWaitUntilIntentExecutedFailed(error: unknown): error is IntentError<'RELAY_TIMEOUT'> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'RELAY_TIMEOUT' &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'payload' in error.data &&
    'error' in error.data
  );
}

export function isIntentCreationUnknownError(error: unknown): error is IntentError<'UNKNOWN'> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'UNKNOWN' &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'payload' in error.data &&
    'error' in error.data
  );
}

export function isMoneyMarketSubmitTxFailedError(error: unknown): error is MoneyMarketError<'SUBMIT_TX_FAILED'> {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'SUBMIT_TX_FAILED';
}

export function isMoneyMarketRelayTimeoutError(error: unknown): error is MoneyMarketError<'RELAY_TIMEOUT'> {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'RELAY_TIMEOUT';
}

export function isMoneyMarketCreateSupplyIntentFailedError(
  error: unknown,
): error is MoneyMarketError<'CREATE_SUPPLY_INTENT_FAILED'> {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'CREATE_SUPPLY_INTENT_FAILED';
}

export function isMoneyMarketCreateBorrowIntentFailedError(
  error: unknown,
): error is MoneyMarketError<'CREATE_BORROW_INTENT_FAILED'> {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'CREATE_BORROW_INTENT_FAILED';
}

export function isMoneyMarketCreateWithdrawIntentFailedError(
  error: unknown,
): error is MoneyMarketError<'CREATE_WITHDRAW_INTENT_FAILED'> {
  return (
    typeof error === 'object' && error !== null && 'code' in error && error.code === 'CREATE_WITHDRAW_INTENT_FAILED'
  );
}

export function isMoneyMarketCreateRepayIntentFailedError(
  error: unknown,
): error is MoneyMarketError<'CREATE_REPAY_INTENT_FAILED'> {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'CREATE_REPAY_INTENT_FAILED';
}

export function isMoneyMarketSupplyUnknownError(
  error: unknown,
): error is MoneyMarketUnknownError<'SUPPLY_UNKNOWN_ERROR'> {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'SUPPLY_UNKNOWN_ERROR';
}

export function isMoneyMarketBorrowUnknownError(
  error: unknown,
): error is MoneyMarketUnknownError<'BORROW_UNKNOWN_ERROR'> {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'BORROW_UNKNOWN_ERROR';
}

export function isMoneyMarketWithdrawUnknownError(
  error: unknown,
): error is MoneyMarketUnknownError<'WITHDRAW_UNKNOWN_ERROR'> {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'WITHDRAW_UNKNOWN_ERROR';
}

export function isMoneyMarketRepayUnknownError(
  error: unknown,
): error is MoneyMarketUnknownError<'REPAY_UNKNOWN_ERROR'> {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'REPAY_UNKNOWN_ERROR';
}

export function isIcxMigrateParams(value: unknown): value is IcxMigrateParams {
  return typeof value === 'object' && value !== null && 'address' in value && 'amount' in value && 'to' in value;
}

export function isUnifiedBnUSDMigrateParams(value: unknown): value is UnifiedBnUSDMigrateParams {
  return (
    typeof value === 'object' &&
    value !== null &&
    'srcChainId' in value &&
    'srcbnUSD' in value &&
    'dstChainId' in value &&
    'dstbnUSD' in value &&
    'amount' in value &&
    'to' in value
  );
}

export function isBalnMigrateParams(value: unknown): value is BalnMigrateParams {
  return (
    typeof value === 'object' &&
    value !== null &&
    'amount' in value &&
    'lockupPeriod' in value &&
    'to' in value &&
    'stake' in value
  );
}

export function isIcxCreateRevertMigrationParams(value: unknown): value is IcxCreateRevertMigrationParams {
  return typeof value === 'object' && value !== null && 'amount' in value && 'to' in value;
}

export function isRawSpokeProvider(value: unknown): value is RawSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    'walletProvider' in value &&
    'chainConfig' in value &&
    'raw' in value &&
    value.raw === true
  );
}

export function isSpokeProvider(value: unknown): value is SpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    'walletProvider' in value &&
    'chainConfig' in value &&
    (!('raw' in value) || value.raw === false)
  );
}

export function isSpokeProviderType(value: unknown): value is SpokeProviderType {
  return isSpokeProvider(value) || isRawSpokeProvider(value);
}

export function isEvmRawSpokeProvider(value: unknown): value is EvmRawSpokeProvider {
  return isRawSpokeProvider(value) && value.chainConfig.chain.type === 'EVM';
}

export function isSolanaRawSpokeProvider(value: unknown): value is SolanaRawSpokeProvider {
  return isRawSpokeProvider(value) && value.chainConfig.chain.type === 'SOLANA';
}

export function isStellarRawSpokeProvider(value: unknown): value is StellarRawSpokeProvider {
  return isRawSpokeProvider(value) && value.chainConfig.chain.type === 'STELLAR' && 'baseProvider' in value;
}

export function isIconRawSpokeProvider(value: unknown): value is IconRawSpokeProvider {
  return isRawSpokeProvider(value) && value.chainConfig.chain.type === 'ICON';
}

export function isSuiRawSpokeProvider(value: unknown): value is SuiRawSpokeProvider {
  return isRawSpokeProvider(value) && value.chainConfig.chain.type === 'SUI';
}

export function isInjectiveRawSpokeProvider(value: unknown): value is InjectiveRawSpokeProvider {
  return isRawSpokeProvider(value) && value.chainConfig.chain.type === 'INJECTIVE';
}

export function isSonicRawSpokeProvider(value: unknown): value is SonicRawSpokeProvider {
  return (
    isRawSpokeProvider(value) &&
    value.chainConfig.chain.type === 'EVM' &&
    value.chainConfig.chain.id === SONIC_MAINNET_CHAIN_ID
  );
}

export function isSpokeProviderObjectType(value: unknown): value is SpokeProviderObjectType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'spokeProvider' in value &&
    value.spokeProvider !== undefined &&
    isSpokeProviderType(value.spokeProvider)
  );
}

export function isRawDestinationParams(value: unknown): value is RawDestinationParams {
  return typeof value === 'object' && value !== null && 'toChainId' in value && 'toAddress' in value;
}
