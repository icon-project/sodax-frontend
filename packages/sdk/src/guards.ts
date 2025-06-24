import type {
  JsonRpcPayloadResponse,
  ResponseAddressType,
  ResponseSigningType,
} from './entities/icon/HanaWalletConnector.js';
import {
  CWSpokeProvider,
  IconSpokeProvider,
  SolanaSpokeProvider,
  StellarSpokeProvider,
  SuiSpokeProvider,
  type EvmUninitializedConfig,
  type EvmInitializedConfig,
  type EvmUninitializedPrivateKeyConfig,
  type EvmUninitializedBrowserConfig,
  type SpokeProvider,
  EvmSpokeProvider,
  SonicSpokeProvider,
} from './entities/index.js';
import {
  INTENT_RELAY_CHAIN_IDS,
  SONIC_MAINNET_CHAIN_ID,
  type EvmHubChainConfig,
  type EvmSpokeChainConfig,
  type HubChainConfig,
  type IconAddress,
  type IntentRelayChainId,
  type MoneyMarketConfig,
  type MoneyMarketConfigParams,
  type Optional,
  type PartnerFeeAmount,
  type PartnerFeeConfig,
  type PartnerFeePercentage,
  type Prettify,
  type SolverConfig,
  type SolverConfigParams,
  type SpokeChainConfig,
} from './index.js';

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
    Object.values(INTENT_RELAY_CHAIN_IDS).includes(value as IntentRelayChainId)
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

export function isCWSpokeProvider(value: SpokeProvider): value is CWSpokeProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    value instanceof CWSpokeProvider &&
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
  return (
    typeof value === 'object' &&
    value !== null &&
    'intentsContract' in value &&
    'solverApiEndpoint' in value &&
    'relayerApiEndpoint' in value
  );
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
