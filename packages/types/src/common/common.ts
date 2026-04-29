import type { Address, Hex, HttpUrl } from '../shared/shared.js';
import type { ChainKey, ChainKeys, ChainType } from '../chains/chain-keys.js';
import type { GetChainType, SpokeChainConfig, spokeChainConfig, SpokeChainKey, IconAddress } from '../chains/chains.js';
import type { XToken } from '../chains/tokens.js';
import type { EvmRawTransaction, EvmReturnType } from '../evm/evm.js';
import type { BitcoinReturnType } from '../bitcoin/bitcoin.js';
import type { IconRawTransaction, IconReturnType } from '../icon/icon.js';
import type { InjectiveRawTransaction, InjectiveReturnType } from '../injective/injective.js';
import type { NearRawTransaction, NearReturnType } from '../near/near.js';
import type { SolanaRawTransaction, SolanaReturnType } from '../solana/solana.js';
import type { StacksRawTransaction, StacksReturnType } from '../stacks/stacks.js';
import type { StellarRawTransaction, StellarReturnType } from '../stellar/stellar.js';
import type { SuiRawTransaction, SuiReturnType } from '../sui/sui.js';
import type { SolverConfig } from './constants.js';
import type { GetWalletProviderType } from '../wallet/providers.js';

export type Default = {
  default: boolean;
};

export type RelayerApiConfig = {
  relayerApiEndpoint: HttpUrl;
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

export type IconContractAddress = `cx${string}`;

export type Result<T, E = Error | unknown> = { ok: true; value: T } | { ok: false; error: E };

export type GetTokenAddressType<C extends SpokeChainKey | ChainType> = GetChainType<C> extends 'EVM' ? Address : string;

export type GetAddressType<C extends SpokeChainKey | ChainType> = GetChainType<C> extends 'EVM'
  ? Address
  : GetChainType<C> extends 'INJECTIVE'
    ? string
    : GetChainType<C> extends 'STELLAR'
      ? Hex
      : GetChainType<C> extends 'ICON'
        ? IconAddress
        : GetChainType<C> extends 'SUI'
          ? Hex
          : GetChainType<C> extends 'SOLANA'
            ? Hex
            : GetChainType<C> extends 'STACKS'
              ? string
              : GetChainType<C> extends 'NEAR'
                ? Address
                : string;

export type SolverConfigParams =
  | Prettify<SolverConfig & Optional<PartnerFeeConfig, 'partnerFee'>>
  | Optional<PartnerFeeConfig, 'partnerFee'>;

export type QuoteType = 'exact_input';

export type SolverIntentQuoteRequest = {
  token_src: string; // Token address on the source chain
  token_src_blockchain_id: SpokeChainKey; // Source chain id
  token_dst: string; // Token address on the destination chain
  token_dst_blockchain_id: SpokeChainKey; // Destination chain id
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

export type HashTxReturnType =
  | EvmReturnType<false>
  | SolanaReturnType<false>
  | IconReturnType<false>
  | SuiReturnType<false>
  | InjectiveReturnType<false>
  | StellarReturnType<false>
  | StacksReturnType<false>
  | NearReturnType<false>;

export type RawTxReturnType =
  | EvmRawTransaction
  | SolanaRawTransaction
  | InjectiveRawTransaction
  | IconRawTransaction
  | SuiRawTransaction
  | StellarRawTransaction
  | StacksRawTransaction
  | NearRawTransaction;

export type GetDefaultTxReturnType<Raw extends boolean> = Raw extends true ? RawTxReturnType : HashTxReturnType;

/**
 * Return type for a transaction based on the given ChainId or ChainType.
 * Default to GetDefaultTxReturnType<Raw>
 */
export type TxReturnType<C extends SpokeChainKey | ChainType, Raw extends boolean> = GetChainType<C> extends 'EVM'
  ? EvmReturnType<Raw>
  : GetChainType<C> extends 'SOLANA'
    ? SolanaReturnType<Raw>
    : GetChainType<C> extends 'STELLAR'
      ? StellarReturnType<Raw>
      : GetChainType<C> extends 'ICON'
        ? IconReturnType<Raw>
        : GetChainType<C> extends 'SUI'
          ? SuiReturnType<Raw>
          : GetChainType<C> extends 'INJECTIVE'
            ? InjectiveReturnType<Raw>
            : GetChainType<C> extends 'STACKS'
              ? StacksReturnType<Raw>
              : GetChainType<C> extends 'NEAR'
                ? NearReturnType<Raw>
                : GetChainType<C> extends 'BITCOIN'
                  ? BitcoinReturnType<Raw>
                  : GetDefaultTxReturnType<Raw>;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T = keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type ExtractKeys<T> = T extends unknown ? keyof T : never;

export type SpokeTokenSymbols = ExtractKeys<(typeof spokeChainConfig)[SpokeChainKey]['supportedTokens']>;

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

export type BitcoinGasEstimate = bigint;

export type StacksFeeEstimation = {
  fee: number;
  fee_rate: number;
};
export type FeeEstimateTransaction = {
  low: StacksFeeEstimation;
  medium: StacksFeeEstimation;
  high: StacksFeeEstimation;
};

export type NearGasEstimate = bigint;

export type GasEstimateType =
  | EvmGasEstimate
  | SolanaGasEstimate
  | StellarGasEstimate
  | IconGasEstimate
  | SuiGasEstimate
  | InjectiveGasEstimate;

export type GetEstimateGasReturnTypeForSpokeChainId<C extends SpokeChainKey | ChainType> = GetChainType<C> extends 'EVM'
  ? EvmGasEstimate
  : GetChainType<C> extends 'SOLANA'
    ? SolanaGasEstimate
    : GetChainType<C> extends 'STELLAR'
      ? StellarGasEstimate
      : GetChainType<C> extends 'ICON'
        ? IconGasEstimate
        : GetChainType<C> extends 'SUI'
          ? SuiGasEstimate
          : GetChainType<C> extends 'INJECTIVE'
            ? InjectiveGasEstimate
            : GetChainType<C> extends 'NEAR'
              ? NearGasEstimate
              : GetChainType<C> extends 'BITCOIN'
                ? BitcoinGasEstimate
                : GetChainType<C> extends 'STACKS'
                  ? FeeEstimateTransaction
                  : GasEstimateType;

export type GetEstimateGasReturnTypeForChainType<C extends ChainType> = C extends 'EVM'
  ? EvmGasEstimate
  : C extends 'SOLANA'
    ? SolanaGasEstimate
    : C extends 'STELLAR'
      ? StellarGasEstimate
      : C extends 'ICON'
        ? IconGasEstimate
        : C extends 'SUI'
          ? SuiGasEstimate
          : C extends 'INJECTIVE'
            ? InjectiveGasEstimate
            : C extends 'BITCOIN'
              ? BitcoinGasEstimate
              : C extends 'STACKS'
                ? FeeEstimateTransaction
                : C extends 'NEAR'
                  ? NearGasEstimate
                  : GasEstimateType;

export type GetEstimateGasReturnType<C extends SpokeChainKey | ChainType> = C extends SpokeChainKey
  ? GetEstimateGasReturnTypeForSpokeChainId<C>
  : C extends ChainType
    ? GetEstimateGasReturnTypeForChainType<C>
    : GasEstimateType;

// Type for Stellar RPC configuration with horizon and soroban URLs
export type StellarRpcConfig = {
  horizonRpcUrl?: HttpUrl;
  sorobanRpcUrl?: HttpUrl;
};

// Type for Bitcoin RPC configuration with Radfi API endpoints
export type BitcoinRpcConfig = {
  rpcUrl?: string;
  radfiApiUrl?: string;
  radfiUmsUrl?: string;
};

// Type for Injective RPC configuration — covers indexer and gRPC endpoints.
// Falls back to mainnet defaults from @injectivelabs/networks for unspecified fields.
export type InjectiveRpcConfig = {
  indexer?: string;
  grpc?: string;
};

// Stacks network preset names — mirrors `StacksNetworkName` from @stacks/network
// (kept local to avoid importing external types per @sodax/types rules).
export type StacksNetworkName = 'mainnet' | 'testnet' | 'devnet' | 'mocknet';

/**
 * Structural mirror of `StacksNetwork` from @stacks/network (modeled against
 * @stacks/network@7.3.1). Kept local to avoid importing external types per
 * @sodax/types rules. Real `StacksNetwork` objects satisfy this via TS
 * structural typing, so consumers can pass `networkFrom(...)` output directly.
 *
 * Maintenance: bump this type in lockstep with `@stacks/network` in the
 * workspace catalog. If upstream adds required fields, consumers will get
 * a compile error until this type is updated to match.
 */
export type StacksNetworkLike = {
  chainId: number;
  transactionVersion: number;
  peerNetworkId: number;
  magicBytes: string;
  bootAddress: string;
  addressVersion: { singleSig: number; multiSig: number };
  client: { baseUrl: string };
};

// Mapped type that uses ChainKey as keys and assigns appropriate value types per chain:
// - Stellar    → StellarRpcConfig                   (horizon + soroban URLs)
// - Bitcoin    → BitcoinRpcConfig                   (rpcUrl + radfi endpoints)
// - Injective  → InjectiveRpcConfig                 (indexer + grpc endpoints)
// - Stacks     → StacksNetworkName | StacksNetworkLike (preset name or full network)
// - All others → string                             (single RPC URL)
export type RpcConfig = Partial<{
  [K in ChainKey]: K extends typeof ChainKeys.STELLAR_MAINNET
    ? StellarRpcConfig
    : K extends typeof ChainKeys.BITCOIN_MAINNET
      ? BitcoinRpcConfig
      : K extends typeof ChainKeys.INJECTIVE_MAINNET
        ? InjectiveRpcConfig
        : K extends typeof ChainKeys.STACKS_MAINNET
          ? StacksNetworkName | StacksNetworkLike
          : string;
}>;

export type AssetInfo = {
  chainId: bigint;
  spokeAddress: `0x${string}`;
};

export type MoneyMarketConfig = {
  supportedTokens: Record<SpokeChainKey, readonly XToken[]>;
  supportedReserveAssets: readonly Address[];
  uiPoolDataProvider: Address;
  lendingPool: Address;
  poolAddressesProvider: Address;
  bnUSD: Address;
  bnUSDVault: Address;
  bnUSDAToken: Address;
  partnerFee: PartnerFee | undefined; // enables override of global partner fee
};

export type TokenInfo = {
  decimals: number;
  depositFee: bigint;
  withdrawalFee: bigint;
  maxDeposit: bigint;
  isSupported: boolean;
};

export type BridgeLimit = {
  amount: bigint;
  decimals: number;
  type: 'DEPOSIT_LIMIT' | 'WITHDRAWAL_LIMIT';
};

export type SpokeChainConfigMap = Record<SpokeChainKey, SpokeChainConfig>;

export type WalletProviderSlot<K extends SpokeChainKey | ChainType, Raw extends boolean> = Raw extends true
  ? { raw: true; walletProvider?: never }
  : { raw: false; walletProvider: GetWalletProviderType<K> };

/**
 * Standard exec-mode wrapper for hub/spoke flows: bounded `params`, optional relay toggles,
 * plus {@link WalletProviderSlot} (`raw: true` for unsigned payloads, otherwise `walletProvider` required).
 * Use the `Extras` type parameter only for rare feature-only fields (e.g. swap `fee`).
 */
export type SpokeExecActionParams<
  K extends SpokeChainKey,
  Raw extends boolean,
  P,
  Extras extends Record<string, unknown> = Record<string, never>,
> = {
  params: P;
  skipSimulation?: boolean;
  timeout?: number;
} & Extras &
  WalletProviderSlot<K, Raw>;

// export type RawOf<T extends { raw?: boolean }> = [T['raw']] extends [true] ? true : false;
export type ExecuteAction<A> = Extract<A, { raw?: false }>;
export type RawAction<A> = Extract<A, { raw: true }>;

export type GetActionChainType<T extends { srcChainKey: SpokeChainKey }> = GetChainType<T['srcChainKey']>;
