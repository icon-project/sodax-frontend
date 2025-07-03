import type { PublicKey } from '@solana/web3.js';
import type { TransactionReceipt } from 'viem';
import type { CWSpokeProvider } from './entities/cosmos/CWSpokeProvider.js';
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
import type { EVM_CHAIN_IDS, EVM_SPOKE_CHAIN_IDS, INTENT_RELAY_CHAIN_IDS, spokeChainConfig } from './index.js';
import type { EvmSpokeDepositParams, SonicSpokeDepositParams } from './services/index.js';
import type { CWSpokeDepositParams } from './services/spoke/CWSpokeService.js';
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
  CWRawTransaction,
  CosmosNetworkEnv,
} from '@sodax/types';
import { type Transaction as NearTransaction } from '@near-js/transactions';
import type { NearSpokeProvider } from './entities/near/NearSpokeProvider.js';
import type { NearSpokeDepositParams } from './services/spoke/NearSpokeService.js';

export type IntentRelayChainId = (typeof INTENT_RELAY_CHAIN_IDS)[keyof typeof INTENT_RELAY_CHAIN_IDS];

export type EvmChainId = (typeof EVM_CHAIN_IDS)[number];
export type EvmSpokeChainId = (typeof EVM_SPOKE_CHAIN_IDS)[number];

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
  supportedTokens: Record<string, Token>;
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
  };

  nativeToken: Address;
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
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  rpc_url: string;
};

export type CosmosSpokeChainConfig = BaseSpokeChainConfig<'INJECTIVE'> & {
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
  network: CosmosNetworkEnv;
};

export type StellarSpokeChainConfig = BaseSpokeChainConfig<'STELLAR'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  rpc_url: string;
};

export type IconSpokeChainConfig = BaseSpokeChainConfig<'ICON'> & {
  addresses: {
    assetManager: IconAddress;
    connection: IconAddress;
    rateLimit: IconAddress;
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
  wsUrl: string;
  walletAddress: string;
  nativeToken: string;
  gasPrice: string;
};

export type NearSpokeChainConfig = BaseSpokeChainConfig<'NEAR'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  rpc_url: string;
};

export type HubChainConfig = EvmHubChainConfig;

export type SpokeChainConfig =
  | EvmSpokeChainConfig
  | SonicSpokeChainConfig
  | CosmosSpokeChainConfig
  | IconSpokeChainConfig
  | SuiSpokeChainConfig
  | StellarSpokeChainConfig
  | SolanaChainConfig
  | NearSpokeChainConfig;

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

export type EvmTxReturnType<T extends boolean> = T extends true ? TransactionReceipt : Hex;

export type IconAddress = `hx${string}` | `cx${string}`;
export type Result<T, E = Error | unknown> = { ok: true; value: T } | { ok: false; error: E };
export type HttpPrefixedUrl = `http${string}`;

export type SpokeDepositParams = EvmSpokeDepositParams | CWSpokeDepositParams | IconSpokeDepositParams;

export type GetSpokeDepositParamsType<T extends SpokeProvider> = T extends EvmSpokeProvider
  ? EvmSpokeDepositParams
  : T extends CWSpokeProvider
    ? CWSpokeDepositParams
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
            : T extends NearSpokeProvider
              ? NearSpokeDepositParams:never;

export type GetAddressType<T extends SpokeProvider> = T extends EvmSpokeProvider
  ? Address
  : T extends CWSpokeProvider
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

export type IntentQuoteRequest = {
  token_src: string; // Token address on the source chain
  token_src_blockchain_id: SpokeChainId; // Source chain id
  token_dst: string; // Token address on the destination chain
  token_dst_blockchain_id: SpokeChainId; // Destination chain id
  amount: bigint; // Amount to swap
  quote_type: QuoteType; // Quote type
};

export type IntentQuoteResponseRaw = {
  quoted_amount: string;
};

export type IntentQuoteResponse = {
  quoted_amount: bigint;
};

export type IntentErrorResponse = {
  detail: {
    code: IntentErrorCode;
    message: string;
  };
};

export type IntentExecutionRequest = {
  intent_tx_hash: Hex; // Intent hash of the execution on Sonic (hub chain)
};

export type IntentExecutionResponse = {
  answer: 'OK';
  intent_hash: Hex; // Here, the solver returns the intent_hash, might be helpful for front-end
};

export type IntentStatusRequest = {
  intent_tx_hash: Hex;
};

export type IntentStatusResponse = {
  status: IntentStatusCode;
  fill_tx_hash?: string; // defined only if status is 3
};

export enum IntentStatusCode {
  NOT_FOUND = -1,
  NOT_STARTED_YET = 1, // It's in the task pool, but not started yet
  STARTED_NOT_FINISHED = 2,
  SOLVED = 3,
  FAILED = 4,
}

export enum IntentErrorCode {
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
  from: PublicKey;
  to: PublicKey;
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
export type StellarReturnType<Raw extends boolean> = Raw extends true ? StellarRawTransaction : Hex;
export type IconReturnType<Raw extends boolean> = Raw extends true ? IconRawTransaction : Hex;
export type SuiReturnType<Raw extends boolean> = Raw extends true ? SuiRawTransaction : Hex;
export type CWReturnType<Raw extends boolean> = Raw extends true ? CWRawTransaction : Hex;
export type NearReturnType<Raw extends boolean> = Raw extends true ? NearTransaction : Hex;
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
            ? CWReturnType<Raw>
            : T['chainConfig']['chain']['type'] extends 'NEAR'
            ? NearReturnType<Raw>:never; // TODO extend for each chain implementation
export type PromiseEvmTxReturnType<Raw extends boolean> = Promise<TxReturnType<EvmSpokeProvider, Raw>>;
export type PromiseSolanaTxReturnType<Raw extends boolean> = Promise<TxReturnType<SolanaSpokeProvider, Raw>>;
export type PromiseStellarTxReturnType<Raw extends boolean> = Promise<TxReturnType<StellarSpokeProvider, Raw>>;
export type PromiseIconTxReturnType<Raw extends boolean> = Promise<TxReturnType<IconSpokeProvider, Raw>>;
export type PromiseSuiTxReturnType<Raw extends boolean> = Promise<TxReturnType<SuiSpokeProvider, Raw>>;
export type PromiseCWTxReturnType<Raw extends boolean> = Promise<TxReturnType<CWSpokeProvider, Raw>>;
export type PromiseNearTxReturnType<Raw extends boolean> = Promise<TxReturnType<NearSpokeProvider, Raw>>;


export type RawTxReturnType =
  | EvmRawTransaction
  | SolanaRawTransaction
  | CWRawTransaction
  | IconRawTransaction
  | SuiRawTransaction; // TODO extend for other chains (Icon, Cosmos, Sui)
export type GetRawTxReturnType<T extends ChainType> = T extends 'EVM' ? PromiseEvmTxReturnType<boolean> : never;

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
            ? PromiseCWTxReturnType<Raw>
            : T['chainConfig']['chain']['type'] extends 'NEAR'
            ? PromiseNearTxReturnType<Raw>:never;

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
