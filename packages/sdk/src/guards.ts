import type {
  JsonRpcPayloadResponse,
  ResponseAddressType,
  ResponseSigningType,
} from './entities/icon/HanaWalletConnector.js';
import type {
  EvmUninitializedConfig,
  EvmInitializedConfig,
  EvmUninitializedPrivateKeyConfig,
  EvmUninitializedBrowserConfig,
} from './entities/index.js';
import {
  INTENT_RELAY_CHAIN_IDS,
  type EvmHubChainConfig,
  type EvmSpokeChainConfig,
  type HubChainConfig,
  type IconAddress,
  type IntentRelayChainId,
  type PartnerFeeAmount,
  type PartnerFeePercentage,
  type SpokeChainConfig,
} from './index.js';

export function isEvmHubChainConfig(value: HubChainConfig): value is EvmHubChainConfig {
  return typeof value === 'object' && value.chain.type === 'evm';
}

export function isEvmSpokeChainConfig(value: SpokeChainConfig): value is EvmSpokeChainConfig {
  return typeof value === 'object' && value.chain.type === 'evm';
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
