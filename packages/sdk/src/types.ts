import type { TransactionReceipt } from 'viem';
import type { InjectiveSpokeProvider } from './entities/injective/InjectiveSpokeProvider.js';
import type {
  EvmSpokeProvider,
  ISpokeProvider,
  IconSpokeProvider,
  SolanaSpokeProvider,
  SonicSpokeProvider,
  SpokeProvider,
  StacksSpokeProvider,
  StellarSpokeProvider,
  SuiSpokeProvider,
} from './entities/index.js';
import type {
  bnUSDLegacySpokeChainIds,
  bnUSDLegacyTokens,
  EVM_CHAIN_IDS,
  newbnUSDSpokeChainIds,
  spokeChainConfig,
  ChainIdToIntentRelayChainId,
} from './index.js';
import type { EvmSpokeDepositParams, SonicSpokeDepositParams } from './services/index.js';
import type { IconSpokeDepositParams } from './services/spoke/IconSpokeService.js';
import type { SolanaSpokeDepositParams } from './services/spoke/SolanaSpokeService.js';
import type { StellarSpokeDepositParams } from './services/spoke/StellarSpokeService.js';
import type { SuiSpokeDepositParams } from './services/spoke/SuiSpokeService.js';
import type {
  ChainType,
  Token,
  HubChainId,
  SpokeChainId,
  Hex,
  Address,
  EvmRawTransaction,
  StellarRawTransaction,
  InjectiveRawTransaction,
  InjectiveNetworkEnv,
  SolanaBase58PublicKey,
  ICON_MAINNET_CHAIN_ID,
  XToken,
} from '@sodax/types';
import type { InjectiveSpokeDepositParams } from './services/spoke/InjectiveSpokeService.js';
import type { StacksSpokeDepositParams } from './services/spoke/StacksSpokeService.js';

export type LegacybnUSDChainId = (typeof bnUSDLegacySpokeChainIds)[number];
export type LegacybnUSDTokenAddress = (typeof bnUSDLegacyTokens)[number]['address'];
export type LegacybnUSDToken = (typeof bnUSDLegacyTokens)[number];
export type NewbnUSDChainId = (typeof newbnUSDSpokeChainIds)[number];

export type IntentRelayChainId = (typeof ChainIdToIntentRelayChainId)[keyof typeof ChainIdToIntentRelayChainId];

export type EvmChainId = (typeof EVM_CHAIN_IDS)[number];
export type EvmSpokeChainId = (typeof EVM_CHAIN_IDS)[number];

export type BaseSpokeChainInfo<T extends ChainType> = {
  name: string;
  id: GetSpokeChainIdType<T>;
  type: T;
};

export type SpokeChainInfo<T extends ChainType> = BaseSpokeChainInfo<T>;

export type HubChainInfo<T extends ChainType> = {
  name: string;
  id: HubChainId;
  type: T;
};

export type GetSpokeChainIdType<T extends ChainType> = T extends 'EVM' ? EvmSpokeChainId : SpokeChainId;

export type AssetInfo = {
  chainId: bigint;
  spokeAddress: `0x${string}`;
};

export type HubAssetInfo = { asset: Address; decimal: number; vault: Address };

export type BaseSpokeChainConfig<T extends ChainType> = {
  chain: SpokeChainInfo<T>;
  addresses: { [key: string]: Address | string | Uint8Array };
  supportedTokens: Record<string, XToken>;
  nativeToken: Address | string;
  bnUSD: Address | string;
};

export type BaseHubChainConfig<T extends ChainType> = {
  chain: HubChainInfo<T>;
  addresses: { [key: string]: Address | string | Uint8Array };
  supportedTokens: Token[];
  nativeToken: Address | string;
};

export type EvmHubChainConfig = BaseHubChainConfig<'EVM'> & {
  addresses: {
    assetManager: Address;
    hubWallet: Address;
    xTokenManager: Address;
    icxMigration: Address;
    balnSwap: Address;
    sodaToken: Address;
  };

  nativeToken: Address;
  wrappedNativeToken: Address;
};

export type RelayerApiConfig = {
  relayerApiEndpoint: HttpUrl;
};

export type MoneyMarketConfig = {
  uiPoolDataProvider: Address;
  lendingPool: Address;
  poolAddressesProvider: Address;
  bnUSD: Address;
  bnUSDVault: Address;
};

export type MoneyMarketServiceConfig = Prettify<MoneyMarketConfig & PartnerFeeConfig & RelayerApiConfig>;
export type SolverServiceConfig = Prettify<SolverConfig & PartnerFeeConfig & RelayerApiConfig>;
export type MigrationServiceConfig = Prettify<RelayerApiConfig>;
export type BridgeServiceConfig = Optional<PartnerFeeConfig, 'partnerFee'>;
export type BackendApiConfig = {
  baseURL?: HttpUrl;
  timeout?: number;
  headers?: Record<string, string>;
};

export type MoneyMarketConfigParams =
  | Prettify<MoneyMarketConfig & Optional<PartnerFeeConfig, 'partnerFee'>>
  | Optional<PartnerFeeConfig, 'partnerFee'>;

export type Default = {
  default: boolean;
};

export type EvmSpokeChainConfig = BaseSpokeChainConfig<'EVM'> & {
  addresses: {
    assetManager: Address;
    connection: Address;
  };
  nativeToken: Address | string;
};

export type SonicSpokeChainConfig = BaseSpokeChainConfig<'EVM'> & {
  addresses: {
    walletRouter: Address;
    wrappedSonic: Address;
  };
  nativeToken: Address;
};

export type SuiSpokeChainConfig = BaseSpokeChainConfig<'SUI'> & {
  addresses: {
    originalAssetManager: string;
    assetManagerConfigId: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  rpc_url: string;
};

export type InjectiveSpokeChainConfig = BaseSpokeChainConfig<'INJECTIVE'> & {
  rpcUrl: string;
  walletAddress: string;
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  nativeToken: string;
  prefix: string;
  gasPrice: string;
  isBrowser: boolean;
  networkId: string;
  network: InjectiveNetworkEnv;
};

export type StellarAssetTrustline = {
  assetCode: string;
  contractId: string;
  assetIssuer: string;
};

export type StellarSpokeChainConfig = BaseSpokeChainConfig<'STELLAR'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  horizonRpcUrl: HttpUrl;
  sorobanRpcUrl: HttpUrl;
  trustlineConfigs: StellarAssetTrustline[];
};

export type IconSpokeChainConfig = BaseSpokeChainConfig<'ICON'> & {
  addresses: {
    assetManager: IconAddress;
    connection: IconAddress;
    rateLimit: IconAddress;
    wICX: `cx${string}`;
  };
  nid: Hex;
};

export type SolanaChainConfig = BaseSpokeChainConfig<'SOLANA'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  chain: SpokeChainInfo<'SOLANA'>;
  rpcUrl: string;
  walletAddress: string;
  nativeToken: string;
  gasPrice: string;
};

export type StacksChainConfig = BaseSpokeChainConfig<'STACKS'> & {
  addresses: {
    assetManager: string;
    connection: string;
    rateLimit: string;
  };
  chain: SpokeChainInfo<'STACKS'>;
  rpcUrl: string;
  nativeToken: string;
};

export type HubChainConfig = EvmHubChainConfig;

export type SpokeChainConfig =
  | EvmSpokeChainConfig
  | SonicSpokeChainConfig
  | InjectiveSpokeChainConfig
  | IconSpokeChainConfig
  | SuiSpokeChainConfig
  | StellarSpokeChainConfig
  | SolanaChainConfig
  | StacksChainConfig;

export type EvmContractCall = {
  address: Address; // Target address of the call
  value: bigint; // Ether value to send (in wei as a string for precision)
  data: Hex; // Calldata for the call
};

export type EvmTransferToHubParams = {
  token: Address;
  recipient: Address;
  amount: bigint;
  data: Hex;
};

export type EvmTransferParams = {
  fromToken: Address;
  dstChainId: SpokeChainId;
  toToken: Hex;
  to: Hex;
  amount: bigint;
  data: Hex;
};

export type TokenInfo = {
  decimals: number;
  depositFee: bigint;
  withdrawalFee: bigint;
  maxDeposit: bigint;
  isSupported: boolean;
};

export type VaultReserves = {
  tokens: readonly Address[];
  balances: readonly bigint[];
};

export type DepositSimulationParams = {
  spokeChainID: SpokeChainId;
  token: Hex;
  from: Hex;
  to: Hex;
  amount: bigint;
  data: Hex;
  srcAddress: Hex;
};

export type WalletSimulationParams = {
  target: Address;
  srcChainId: bigint;
  srcAddress: Hex;
  payload: Hex;
};

/**
 * Fee type for transaction fees.
 * @property address - The address to which the fee is sent.
 * @property amount - Optional fixed fee amount in wei.
 */
export type PartnerFeeAmount = {
  address: Address;
  amount: bigint;
};

/**
 * Fee type for transaction fees.
 * @property address - The address to which the fee is sent.
 * @property percentage - Optional fee percentage in basis points (e.g., 100 = 1%). Maximum allowed is 100 (1%).
 */
export type PartnerFeePercentage = {
  address: Address;
  percentage: number;
};

/**
 * Fee type for transaction fees.
 * @property address - The address to which the fee is sent.
 * @property percentage - Optional fee percentage in basis points (e.g., 100 = 1%). Maximum allowed is 100 (1%).
 * @property amount - Optional fixed fee amount in wei. If both percentage and amount are provided, amount will be used.
 */
export type PartnerFee = PartnerFeeAmount | PartnerFeePercentage;

export type PartnerFeeConfig = {
  partnerFee: PartnerFee | undefined;
};

export type FeeAmount = {
  feeAmount: bigint;
};

export type OptionalFee = { fee?: PartnerFee };

export type EvmTxReturnType<T extends boolean> = T extends true ? TransactionReceipt : Hex;

export type IconAddress = `hx${string}` | `cx${string}`;
export type IconContractAddress = `cx${string}`;
export type IcxTokenType =
  | (typeof spokeChainConfig)[typeof ICON_MAINNET_CHAIN_ID]['addresses']['wICX']
  | (typeof spokeChainConfig)[typeof ICON_MAINNET_CHAIN_ID]['nativeToken'];
export type Result<T, E = Error | unknown> = { ok: true; value: T } | { ok: false; error: E };
export type HttpPrefixedUrl = `http${string}`;

export type SpokeDepositParams = EvmSpokeDepositParams | InjectiveSpokeDepositParams | IconSpokeDepositParams;

export type GetSpokeDepositParamsType<T extends SpokeProvider> = T extends EvmSpokeProvider
  ? EvmSpokeDepositParams
  : T extends InjectiveSpokeProvider
    ? InjectiveSpokeDepositParams
    : T extends SuiSpokeProvider
      ? SuiSpokeDepositParams
      : T extends IconSpokeProvider
        ? IconSpokeDepositParams
        : T extends StellarSpokeProvider
          ? StellarSpokeDepositParams
          : T extends SolanaSpokeProvider
            ? SolanaSpokeDepositParams
            : T extends SonicSpokeProvider
              ? SonicSpokeDepositParams
              : T extends StacksSpokeProvider
                ? StacksSpokeDepositParams
              : never;

export type GetAddressType<T extends SpokeProvider> = T extends EvmSpokeProvider
  ? Address
  : T extends InjectiveSpokeProvider
    ? string
    : T extends StellarSpokeProvider
      ? Hex
      : T extends IconSpokeProvider
        ? IconAddress
        : T extends SuiSpokeProvider
          ? Hex
          : T extends SolanaSpokeProvider
            ? Hex
            : T extends SonicSpokeProvider
              ? Address
              : never;

export type HttpUrl = `http://${string}` | `https://${string}`;

export type SolverConfig = {
  intentsContract: Address; // Intents Contract (Hub)
  solverApiEndpoint: HttpUrl;
};

export type SolverConfigParams =
  | Prettify<SolverConfig & Optional<PartnerFeeConfig, 'partnerFee'>>
  | Optional<PartnerFeeConfig, 'partnerFee'>;

export type QuoteType = 'exact_input' | 'exact_output';

export type SolverIntentQuoteRequest = {
  token_src: string; // Token address on the source chain
  token_src_blockchain_id: SpokeChainId; // Source chain id
  token_dst: string; // Token address on the destination chain
  token_dst_blockchain_id: SpokeChainId; // Destination chain id
  amount: bigint; // Amount to swap
  quote_type: QuoteType; // Quote type
};

export type SolverIntentQuoteResponseRaw = {
  quoted_amount: string;
};

export type SolverIntentQuoteResponse = {
  quoted_amount: bigint;
};

export type SolverErrorResponse = {
  detail: {
    code: SolverIntentErrorCode;
    message: string;
  };
};

export type SolverExecutionRequest = {
  intent_tx_hash: Hex; // Intent hash of the execution on Sonic (hub chain)
};

export type SolverExecutionResponse = {
  answer: 'OK';
  intent_hash: Hex; // Here, the solver returns the intent_hash, might be helpful for front-end
};

export type SolverIntentStatusRequest = {
  intent_tx_hash: Hex;
};

export type SolverIntentStatusResponse = {
  status: SolverIntentStatusCode;
  fill_tx_hash?: string; // defined only if status is 3
};

export enum SolverIntentStatusCode {
  NOT_FOUND = -1,
  NOT_STARTED_YET = 1, // It's in the task pool, but not started yet
  STARTED_NOT_FINISHED = 2,
  SOLVED = 3,
  FAILED = 4,
}

export enum SolverIntentErrorCode {
  NO_PATH_FOUND = -4, // No path to swap Token X to Token Y
  NO_PRIVATE_LIQUIDITY = -5, // Path found, but we have no private liquidity on the dest chain
  NOT_ENOUGH_PRIVATE_LIQUIDITY = -8, // Path found, but not enough private liquidity on the dst chain
  NO_EXECUTION_MODULE_FOUND = -7, // Path found, private liquidity, but execution modules unavailable
  QUOTE_NOT_FOUND = -8, // When executing, given quote_uuid does not exist
  QUOTE_NOT_MATCH = -9, // When executing, given quote_uuid does not match the quote
  INTENT_DATA_NOT_MATCH_QUOTE = -10,
  NO_GAS_HANDLER_FOR_BLOCKCHAIN = -11,
  INTENT_NOT_FOUND = -12,
  QUOTE_EXPIRED = -13,
  MAX_INPUT_AMOUNT = -14,
  MAX_DIFF_OUTPUT = -15,
  STOPPED = -16,
  NO_ORACLE_MODULE_FOUND = -17,
  NEGATIVE_INPUT_AMOUNT = -18,
  INTENT_ALREADY_IN_ORDERBOOK = -19,
  CREATE_INTENT_ORDER_FAILED = -998,
  UNKNOWN = -999,
}

type Base64String = string;

export type SolanaRawTransaction = {
  from: SolanaBase58PublicKey;
  to: SolanaBase58PublicKey;
  value: bigint;
  data: Base64String;
};

export type IconRawTransaction = {
  [key: string]: string | object;
};

export type IcxRawTransaction = {
  to: string;
  from: string;
  value: Hex;
  stepLimit: Hex;
  nid: Hex;
  nonce: Hex;
  version: Hex;
  timestamp: Hex;
  data: Hex;
};

export type SuiRawTransaction = {
  from: Hex;
  to: string;
  value: bigint;
  data: Base64String;
};

export type StacksRawTransaction = {
    [key: string]: string | object | number;
}

export type EvmReturnType<Raw extends boolean> = Raw extends true ? EvmRawTransaction : Hex;
export type SolanaReturnType<Raw extends boolean> = Raw extends true ? SolanaRawTransaction : Hex;
export type StellarReturnType<Raw extends boolean> = Raw extends true ? StellarRawTransaction : string;
export type IconReturnType<Raw extends boolean> = Raw extends true ? IconRawTransaction : Hex;
export type SuiReturnType<Raw extends boolean> = Raw extends true ? SuiRawTransaction : Hex;
export type InjectiveReturnType<Raw extends boolean> = Raw extends true ? InjectiveRawTransaction : Hex;
export type StacksReturnType<Raw extends boolean> = Raw extends true ? StacksRawTransaction : Hex;

export type HashTxReturnType =
  | EvmReturnType<false>
  | SolanaReturnType<false>
  | IconReturnType<false>
  | SuiReturnType<false>
  | InjectiveReturnType<false>
  | StellarReturnType<false>;

export type RawTxReturnType =
  | EvmRawTransaction
  | SolanaRawTransaction
  | InjectiveRawTransaction
  | IconRawTransaction
  | SuiRawTransaction
  | StellarRawTransaction
  | StacksRawTransaction;

export type TxReturnType<T extends SpokeProvider, Raw extends boolean> = T['chainConfig']['chain']['type'] extends 'EVM'
  ? EvmReturnType<Raw>
  : T['chainConfig']['chain']['type'] extends 'SOLANA'
    ? SolanaReturnType<Raw>
    : T['chainConfig']['chain']['type'] extends 'STELLAR'
      ? StellarReturnType<Raw>
      : T['chainConfig']['chain']['type'] extends 'ICON'
        ? IconReturnType<Raw>
        : T['chainConfig']['chain']['type'] extends 'SUI'
          ? SuiReturnType<Raw>
          : T['chainConfig']['chain']['type'] extends 'INJECTIVE'
            ? InjectiveReturnType<Raw>
            : Raw extends true
              ? RawTxReturnType
              : HashTxReturnType;

export type PromiseEvmTxReturnType<Raw extends boolean> = Promise<TxReturnType<EvmSpokeProvider, Raw>>;
export type PromiseSolanaTxReturnType<Raw extends boolean> = Promise<TxReturnType<SolanaSpokeProvider, Raw>>;
export type PromiseStellarTxReturnType<Raw extends boolean> = Promise<TxReturnType<StellarSpokeProvider, Raw>>;
export type PromiseIconTxReturnType<Raw extends boolean> = Promise<TxReturnType<IconSpokeProvider, Raw>>;
export type PromiseSuiTxReturnType<Raw extends boolean> = Promise<TxReturnType<SuiSpokeProvider, Raw>>;
export type PromiseInjectiveTxReturnType<Raw extends boolean> = Promise<TxReturnType<InjectiveSpokeProvider, Raw>>;
export type PromiseStacksTxReturnType<Raw extends boolean> = Promise<TxReturnType<StacksSpokeProvider, Raw>>;

export type PromiseTxReturnType<
  T extends ISpokeProvider,
  Raw extends boolean,
> = T['chainConfig']['chain']['type'] extends 'EVM'
  ? PromiseEvmTxReturnType<Raw>
  : T['chainConfig']['chain']['type'] extends 'SOLANA'
    ? PromiseSolanaTxReturnType<Raw>
    : T['chainConfig']['chain']['type'] extends 'STELLAR'
      ? PromiseStellarTxReturnType<Raw>
      : T['chainConfig']['chain']['type'] extends 'ICON'
        ? PromiseIconTxReturnType<Raw>
        : T['chainConfig']['chain']['type'] extends 'SUI'
          ? PromiseSuiTxReturnType<Raw>
          : T['chainConfig']['chain']['type'] extends 'INJECTIVE'
            ? PromiseInjectiveTxReturnType<Raw>
            : never;

export type VaultType = {
  address: Address; // vault address
  reserves: Address[]; // hub asset addresses contained in the vault
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type ExtractKeys<T> = T extends unknown ? keyof T : never;

export type SpokeTokenSymbols = ExtractKeys<(typeof spokeChainConfig)[SpokeChainId]['supportedTokens']>;

export type SpokeTxHash = string;
export type HubTxHash = string;

export type SolanaGasEstimate = number | undefined;
export type EvmGasEstimate = bigint;
export type StellarGasEstimate = bigint;
export type IconGasEstimate = bigint;

export type SuiGasEstimate = {
  computationCost: string;
  nonRefundableStorageFee: string;
  storageCost: string;
  storageRebate: string;
};

export type InjectiveGasEstimate = {
  gasWanted: number;
  gasUsed: number;
};

export type GasEstimateType =
  | EvmGasEstimate
  | SolanaGasEstimate
  | StellarGasEstimate
  | IconGasEstimate
  | SuiGasEstimate
  | InjectiveGasEstimate;

export type GetEstimateGasReturnType<T extends SpokeProvider> = T['chainConfig']['chain']['type'] extends 'EVM'
  ? EvmGasEstimate
  : T['chainConfig']['chain']['type'] extends 'SOLANA'
    ? SolanaGasEstimate
    : T['chainConfig']['chain']['type'] extends 'STELLAR'
      ? StellarGasEstimate
      : T['chainConfig']['chain']['type'] extends 'ICON'
        ? IconGasEstimate
        : T['chainConfig']['chain']['type'] extends 'SUI'
          ? SuiGasEstimate
          : T['chainConfig']['chain']['type'] extends 'INJECTIVE'
            ? InjectiveGasEstimate
            : GasEstimateType; // default to all gas estimate types union type

export type OptionalRaw<R extends boolean = false> = { raw?: R };
export type OptionalTimeout = { timeout?: number };
export type RelayExtraData = { address: Hex; payload: Hex };
export type RelayOptionalExtraData = { data?: RelayExtraData };
