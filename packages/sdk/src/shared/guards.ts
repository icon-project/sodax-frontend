import type { JsonRpcPayloadResponse, ResponseAddressType, ResponseSigningType } from './entities/icon/icon-wallet-types.js';
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
  Optional,
  PartnerFeeConfig,
  PartnerFeeAmount,
  PartnerFeePercentage,
  EvmSpokeOnlyChainKey,
  IWalletProvider,
  IBitcoinWalletProvider,
  GetWalletProviderType,
  IEvmWalletProvider,
  IStellarWalletProvider,
} from '@sodax/types';
import {
  type EvmSpokeChainConfig,
  type SpokeChainConfig,
  type SolverConfig,
  type MoneyMarketConfig,
  type IconAddress,
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
  isEvmChainKey,
  isEvmSpokeOnlyChainKey,
  getChainType,
} from '@sodax/types';
import type {
  SpokeApproveParams,
  SpokeIsAllowanceValidParams,
  SpokeIsAllowanceValidParamsEvmSpoke,
  SpokeIsAllowanceValidParamsHub,
  SpokeIsAllowanceValidParamsStellar,
  RawDestinationParams,
} from './types/spoke-types.js';

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

export function isPartnerFeeAmount(value: unknown): value is PartnerFeeAmount {
  return typeof value === 'object' && value !== null && 'address' in value && 'amount' in value;
}

export function isPartnerFeePercentage(value: unknown): value is PartnerFeePercentage {
  return typeof value === 'object' && value !== null && 'address' in value && 'percentage' in value;
}

export function isEvmChainKeyType(value: SpokeChainKey): value is EvmChainKey {
  return isEvmChainKey(value);
}

export function isEvmSpokeOnlyChainKeyType(value: SpokeChainKey): value is EvmSpokeOnlyChainKey {
  return isEvmSpokeOnlyChainKey(value);
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

/** Same runtime check as `isHubChainKeyType(params.srcChainKey)`; narrows the full `params` object. */
export function isSpokeIsAllowanceValidParamsHub(
  params: SpokeIsAllowanceValidParams,
): params is SpokeIsAllowanceValidParamsHub {
  return isHubChainKeyType(params.srcChainKey);
}

/** Same runtime check as `isEvmSpokeOnlyChainKeyType(params.srcChainKey)`; narrows the full `params` object. */
export function isSpokeIsAllowanceValidParamsEvmSpoke(
  params: SpokeIsAllowanceValidParams,
): params is SpokeIsAllowanceValidParamsEvmSpoke {
  return isEvmSpokeOnlyChainKeyType(params.srcChainKey);
}

/** Same runtime check as `isStellarChainKeyType(params.srcChainKey)`; narrows the full `params` object. */
export function isSpokeIsAllowanceValidParamsStellar(
  params: SpokeIsAllowanceValidParams,
): params is SpokeIsAllowanceValidParamsStellar {
  return isStellarChainKeyType(params.srcChainKey);
}

export function isSpokeApproveParamsHub<K extends SpokeChainKey, Raw extends boolean>(
  params: SpokeApproveParams<K, Raw>,
): params is Extract<SpokeApproveParams<K, Raw>, { srcChainKey: HubChainKey }> {
  return isHubChainKeyType(params.srcChainKey);
}

export function isSpokeApproveParamsEvmSpoke<K extends SpokeChainKey, Raw extends boolean>(
  params: SpokeApproveParams<K, Raw>,
): params is Extract<SpokeApproveParams<K, Raw>, { srcChainKey: EvmSpokeOnlyChainKey }> {
  return isEvmSpokeOnlyChainKeyType(params.srcChainKey);
}

export function isSpokeApproveParamsStellar<K extends SpokeChainKey, Raw extends boolean>(
  params: SpokeApproveParams<K, Raw>,
): params is Extract<SpokeApproveParams<K, Raw>, { srcChainKey: StellarChainKey }> {
  return isStellarChainKeyType(params.srcChainKey);
}

// export function isSpokeApproveParamsEvmSpoke(params: SpokeApproveParams<K, Raw>, K extends SpokeChainKey, Raw extends boolean): params is SpokeApproveParamsEvmSpoke<K, Raw> {
//   return isEvmSpokeOnlyChainKeyType(params.srcChainKey);
// }

// export function isSpokeApproveParamsStellar(params: SpokeApproveParams<K, Raw>, K extends SpokeChainKey, Raw extends boolean): params is SpokeApproveParamsStellar<K, Raw> {
//   return isStellarChainKeyType(params.srcChainKey);
// }
export function isConfiguredSolverConfig(
  value: SolverConfigParams,
): value is Prettify<SolverConfig & Optional<PartnerFeeConfig, 'partnerFee'>> {
  return typeof value === 'object' && value !== null && 'intentsContract' in value && 'solverApiEndpoint' in value;
}

export function isConfiguredMoneyMarketConfig(
  value: MoneyMarketConfig,
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

// Concrete-typed discriminant guards refine `IWalletProvider` to its specific variant via the
// `chainType` discriminator. Prefer these inside generic method bodies where
// `isValidWalletProviderForChainKey<K>` can't refine past `GetWalletProviderType<K>`.
export function isBitcoinWalletProviderType(wp: IWalletProvider): wp is IBitcoinWalletProvider {
  return wp.chainType === 'BITCOIN';
}

export function isEvmWalletProviderType(walletProvider: IWalletProvider): walletProvider is IEvmWalletProvider {
  return walletProvider.chainType === 'EVM';
}

export function isStellarWalletProviderType(walletProvider: IWalletProvider): walletProvider is IStellarWalletProvider {
  return walletProvider.chainType === 'STELLAR';
}

export function isOptionalEvmWalletProviderType(
  walletProvider: IWalletProvider | undefined,
): walletProvider is IEvmWalletProvider | undefined {
  return walletProvider === undefined || isEvmWalletProviderType(walletProvider);
}

export function isOptionalStellarWalletProviderType(
  walletProvider: IWalletProvider | undefined,
): walletProvider is IStellarWalletProvider | undefined {
  return walletProvider === undefined || isStellarWalletProviderType(walletProvider);
}

export function isValidWalletProviderTypeForChainKey<K extends SpokeChainKey>(
  chainKey: K,
  walletProvider: IWalletProvider | undefined,
): walletProvider is GetWalletProviderType<K> {
  return walletProvider === undefined || getChainType(chainKey) === walletProvider.chainType;
}

export function isOptionalBitcoinWalletProviderType(
  walletProvider: IWalletProvider | undefined,
): walletProvider is IBitcoinWalletProvider | undefined {
  return walletProvider === undefined || isBitcoinWalletProviderType(walletProvider);
}

// TODO re-check all guards after core types and ask check to ensure correct property checks after refactoring
