import type {
  JsonRpcPayloadResponse,
  ResponseAddressType,
  ResponseSigningType,
} from './entities/icon/HanaWalletConnector.js';
import type {
  BitcoinChainKey,
  EvmChainKey,
  IconChainKey,
  InjectiveChainKey,
  NearChainKey,
  SolanaChainKey,
  SpokeChainKey,
  StacksChainKey,
  StellarChainKey,
  SuiChainKey,
  SonicChainKey,
  HubChainKey,
  SolverConfigParams,
  Prettify,
  MoneyMarketConfigParams,
  Optional,
  PartnerFeeConfig,
  PartnerFeeAmount,
  PartnerFeePercentage,
} from '@sodax/types';
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
  ChainIdToIntentRelayChainId,
  type SubmitSwapTxResponse,
  type SubmitSwapTxStatusResponse,
  isSonicChainKey,
  isBitcoinChainKey,
  isSolanaChainKey,
  isNearChainKey,
  isStellarChainKey,
  isInjectiveChainKey,
  isIconChainKey,
  isSuiChainKey,
  isStacksChainKey,
  isHubChainKey,
} from '@sodax/types';
import type { OptionalRaw, OptionalWalletActionParamType, RawDestinationParams } from './types/types.js';

export function isEvmSpokeChainConfig(value: SpokeChainConfig): value is EvmSpokeChainConfig {
  return typeof value === 'object' && value.chain.type === 'EVM';
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

export function isEvmChainKeyType(value: SpokeChainKey): value is EvmChainKey {
  return isEvmChainKeyType(value);
}

export function isSonicChainKeyType(value: SpokeChainKey): value is SonicChainKey {
  return isSonicChainKey(value);
}

export function isHubChainKeyType(value: SpokeChainKey): value is HubChainKey {
  return isHubChainKey(value);
}

export function isSolanaChainKeyType(value: SpokeChainKey): value is SolanaChainKey {
  return isSolanaChainKey(value);
}

export function isNearChainKeyType(value: SpokeChainKey): value is NearChainKey {
  return isNearChainKey(value);
}

export function isStellarChainKeyType(value: SpokeChainKey): value is StellarChainKey {
  return isStellarChainKey(value);
}

export function isBitcoinChainKeyType(value: SpokeChainKey): value is BitcoinChainKey {
  return isBitcoinChainKey(value);
}

export function isInjectiveChainKeyType(value: SpokeChainKey): value is InjectiveChainKey {
  return isInjectiveChainKey(value);
}

export function isIconChainKeyType(value: SpokeChainKey): value is IconChainKey {
  return isIconChainKey(value);
}

export function isSuiChainKeyType(value: SpokeChainKey): value is SuiChainKey {
  return isSuiChainKey(value);
}

export function isStacksChainKeyType(value: SpokeChainKey): value is StacksChainKey {
  return isStacksChainKey(value);
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

export function isAddressString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isRawDestinationParams(value: unknown): value is RawDestinationParams {
  return typeof value === 'object' && value !== null && 'toChainId' in value && 'toAddress' in value;
}

// Backend API response guards
export function isSubmitSwapTxResponse(value: unknown): value is SubmitSwapTxResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).success === 'boolean' &&
    typeof (value as Record<string, unknown>).message === 'string'
  );
}

export function isSubmitSwapTxStatusResponse(value: unknown): value is SubmitSwapTxStatusResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.success !== 'boolean') return false;
  if (typeof obj.data !== 'object' || obj.data === null) return false;
  const data = obj.data as Record<string, unknown>;
  if (typeof data.txHash !== 'string') return false;
  if (typeof data.srcChainId !== 'string') return false;
  if (typeof data.status !== 'string') return false;
  if (typeof data.failedAttempts !== 'number') return false;
  if (data.result !== undefined) {
    if (typeof data.result !== 'object' || data.result === null) return false;
    const result = data.result as Record<string, unknown>;
    if (typeof result.dstIntentTxHash !== 'string') return false;
  }
  return true;
}
