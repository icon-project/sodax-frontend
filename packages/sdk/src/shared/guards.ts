import type {
  JsonRpcPayloadResponse,
  ResponseAddressType,
  ResponseSigningType,
} from './entities/icon/HanaWalletConnector.js';
import {
  InjectiveSpokeProvider,
  IconSpokeProvider,
  SolanaSpokeProvider,
  StellarSpokeProvider,
  SuiSpokeProvider,
  NearSpokeProvider,
  type EvmUninitializedConfig,
  type EvmInitializedConfig,
  type EvmUninitializedPrivateKeyConfig,
  type EvmUninitializedBrowserConfig,
  type SpokeProvider,
  EvmSpokeProvider,
  SonicSpokeProvider,
} from './entities/index.js';
import type {
  EvmHubChainConfig,
  HubChainConfig,
  IntentError,
  MoneyMarketConfigParams,
  Optional,
  PartnerFeeAmount,
  PartnerFeeConfig,
  PartnerFeePercentage,
  Prettify,
  SolverConfigParams,
  MoneyMarketError,
  MoneyMarketUnknownError,
  IcxMigrateParams,
  UnifiedBnUSDMigrateParams,
  BalnMigrateParams,
  IcxCreateRevertMigrationParams,
} from '../index.js';
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

export function isEvmSpokeProvider(value: SpokeProvider): value is EvmSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof EvmSpokeProvider &&
    value.chainConfig.chain.type === 'EVM'
  );
}

export function isSonicSpokeProvider(value: SpokeProvider): value is SonicSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof SonicSpokeProvider &&
    value.chainConfig.chain.type === 'EVM' &&
    value.chainConfig.chain.id === SONIC_MAINNET_CHAIN_ID
  );
}

export function isSolanaSpokeProvider(value: SpokeProvider): value is SolanaSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof SolanaSpokeProvider &&
    value.chainConfig.chain.type === 'SOLANA'
  );
}

export function isStellarSpokeProvider(value: SpokeProvider): value is StellarSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof StellarSpokeProvider &&
    value.chainConfig.chain.type === 'STELLAR'
  );
}

export function isInjectiveSpokeProvider(value: SpokeProvider): value is InjectiveSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof InjectiveSpokeProvider &&
    value.chainConfig.chain.type === 'INJECTIVE'
  );
}

export function isIconSpokeProvider(value: SpokeProvider): value is IconSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof IconSpokeProvider &&
    value.chainConfig.chain.type === 'ICON'
  );
}

export function isSuiSpokeProvider(value: SpokeProvider): value is SuiSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof SuiSpokeProvider &&
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

export function isNearSpokeProvider(value: SpokeProvider): value is StellarSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof NearSpokeProvider &&
    value.chainConfig.chain.type === 'NEAR'
  );
}
