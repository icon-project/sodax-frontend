import { RelayChainIdMap, type IntentChainId, type SpokeChainKey } from '../chains/chains.js';
import type { Address, HttpUrl } from '../shared/shared.js';

export const DEFAULT_MAX_RETRY = 3;
export const DEFAULT_RELAY_TX_TIMEOUT = 120000; // 120 seconds
export const DEFAULT_RETRY_DELAY_MS = 2000;
export const ICON_TX_RESULT_WAIT_MAX_RETRY = 10;
export const MAX_UINT256 = (1n << 256n) - 1n;
export const FEE_PERCENTAGE_SCALE = 10000n; // 100% = 10000
export const STELLAR_PRIORITY_FEE = '10000';
export const STELLAR_DEFAULT_TX_TIMEOUT_SECONDS = 100;
export const DEFAULT_DEADLINE_OFFSET = 300n; // 5 minutes in seconds
export const DEFAULT_BACKEND_API_ENDPOINT = 'https://api.sodax.com/v1/be';
export const DEFAULT_BACKEND_API_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_BACKEND_API_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};
export const DEFAULT_RELAYER_API_ENDPOINT = 'https://xcall-relay.nw.iconblockchain.xyz';
export const VAULT_TOKEN_DECIMALS = 18;

export type ApiConfig = {
  baseURL: HttpUrl;
  timeout: number;
  headers: Record<string, string>;
};

export const apiConfig = {
  baseURL: DEFAULT_BACKEND_API_ENDPOINT,
  timeout: DEFAULT_BACKEND_API_TIMEOUT,
  headers: DEFAULT_BACKEND_API_HEADERS,
} satisfies ApiConfig;

export type SolverConfig = {
  intentsContract: Address; // Intents Contract (Hub)
  solverApiEndpoint: HttpUrl;
  protocolIntentsContract: Address; // Protocol Intents Contract for partner fee claims
};

export const solverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://api.sodax.com/v1/intent',
  protocolIntentsContract: '0xaFf2EDb3057ed6f9C1dA6c930b8ddDf2beE573A5',
} as const satisfies SolverConfig;

export type RelayConfig = {
  relayerApiEndpoint: HttpUrl;
  relayChainIdMap: Record<SpokeChainKey, IntentChainId>;
};

export const relayConfig = {
  relayerApiEndpoint: DEFAULT_RELAYER_API_ENDPOINT,
  relayChainIdMap: RelayChainIdMap,
} satisfies RelayConfig;
