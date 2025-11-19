import type { TransactionReceipt } from 'viem';
import type { InjectiveSpokeProvider } from './entities/injective/InjectiveSpokeProvider.js';
import type {
  EvmSpokeProvider,
  ISpokeProvider,
  IconSpokeProvider,
  SolanaSpokeProvider,
  SonicSpokeProvider,
  SpokeProvider,
  StellarSpokeProvider,
  SuiSpokeProvider,
} from './entities/index.js';
import type { bnUSDLegacySpokeChainIds, bnUSDLegacyTokens, newbnUSDSpokeChainIds } from '../index.js';
import type { EvmSpokeDepositParams, SonicSpokeDepositParams } from './services/index.js';
import type { IconSpokeDepositParams } from './services/spoke/IconSpokeService.js';
import type { SolanaSpokeDepositParams } from './services/spoke/SolanaSpokeService.js';
import type { StellarSpokeDepositParams } from './services/spoke/StellarSpokeService.js';
import type { SuiSpokeDepositParams } from './services/spoke/SuiSpokeService.js';
import type {
  SpokeChainId,
  Hex,
  Address,
  EvmRawTransaction,
  StellarRawTransaction,
  InjectiveRawTransaction,
  SolanaBase58PublicKey,
  ICON_MAINNET_CHAIN_ID,
  HttpUrl,
  IconAddress,
  MoneyMarketConfig,
  SolverConfig,
  spokeChainConfig,
  ConcentratedLiquidityConfig,
} from '@sodax/types';
import type { InjectiveSpokeDepositParams } from './services/spoke/InjectiveSpokeService.js';

export type LegacybnUSDChainId = (typeof bnUSDLegacySpokeChainIds)[number];
export type LegacybnUSDTokenAddress = (typeof bnUSDLegacyTokens)[number]['address'];
export type LegacybnUSDToken = (typeof bnUSDLegacyTokens)[number];
export type NewbnUSDChainId = (typeof newbnUSDSpokeChainIds)[number];

export type MoneyMarketServiceConfig = Prettify<MoneyMarketConfig & PartnerFeeConfig & RelayerApiConfig>;
export type ConcentratedLiquidityServiceConfig = Prettify<
  ConcentratedLiquidityConfig & PartnerFeeConfig & RelayerApiConfig
>;
export type SwapServiceConfig = Prettify<SolverConfig & PartnerFeeConfig & RelayerApiConfig>;
export type MigrationServiceConfig = Prettify<RelayerApiConfig>;
export type BridgeServiceConfig = Optional<PartnerFeeConfig, 'partnerFee'>;
export type ConcentratedLiquidityConfigParams =
  | Prettify<ConcentratedLiquidityConfig & Optional<PartnerFeeConfig, 'partnerFee'>>
  | Optional<PartnerFeeConfig, 'partnerFee'>;
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

export type RelayerApiConfig = {
  relayerApiEndpoint: HttpUrl;
};

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

export type UnstakeSodaRequest = {
  amount: bigint;
  startTime: bigint;
  to: Address;
};

export type UserUnstakeInfo = {
  id: bigint;
  request: UnstakeSodaRequest;
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

export type IconContractAddress = `cx${string}`;
export type IcxTokenType =
  | (typeof spokeChainConfig)[typeof ICON_MAINNET_CHAIN_ID]['addresses']['wICX']
  | (typeof spokeChainConfig)[typeof ICON_MAINNET_CHAIN_ID]['nativeToken'];
export type Result<T, E = Error | unknown> = { ok: true; value: T } | { ok: false; error: E };

export type SpokeDepositParams =
  | EvmSpokeDepositParams
  | InjectiveSpokeDepositParams
  | SuiSpokeDepositParams
  | IconSpokeDepositParams
  | StellarSpokeDepositParams
  | SolanaSpokeDepositParams
  | SonicSpokeDepositParams;

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
              : SpokeDepositParams;

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
  fee?: PartnerFee; // Optional partner fee configuration
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

export type EvmReturnType<Raw extends boolean> = Raw extends true ? EvmRawTransaction : Hex;
export type SolanaReturnType<Raw extends boolean> = Raw extends true ? SolanaRawTransaction : Hex;
export type StellarReturnType<Raw extends boolean> = Raw extends true ? StellarRawTransaction : string;
export type IconReturnType<Raw extends boolean> = Raw extends true ? IconRawTransaction : Hex;
export type SuiReturnType<Raw extends boolean> = Raw extends true ? SuiRawTransaction : Hex;
export type InjectiveReturnType<Raw extends boolean> = Raw extends true ? InjectiveRawTransaction : Hex;

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
  | StellarRawTransaction;

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

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T = keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
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
