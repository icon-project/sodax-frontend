import type { Address, TransactionReceipt } from 'viem';
import type { CWSpokeProvider } from './entities/cosmos/CWSpokeProvider.js';
import type {
  EvmSpokeProvider,
  ISpokeProvider,
  IconSpokeProvider,
  SolanaSpokeProvider,
  SpokeProvider,
  StellarSpokeProvider,
  SuiSpokeProvider,
} from './entities/index.js';
import type {
  CHAIN_IDS,
  EVM_CHAIN_IDS,
  EVM_SPOKE_CHAIN_IDS,
  HUB_CHAIN_IDS,
  INTENT_RELAY_CHAIN_IDS,
  SPOKE_CHAIN_IDS,
} from './index.js';
import type { EvmSpokeDepositParams } from './services/index.js';
import type { CWSpokeDepositParams } from './services/spoke/CWSpokeService.js';
import type { IconSpokeDepositParams } from './services/spoke/IconSpokeService.js';
import type { SolanaSpokeDepositParams } from './services/spoke/SolanaSpokeService.js';
import type { StellarSpokeDepositParams } from './services/spoke/StellarSpokeService.js';
import type { SuiSpokeDepositParams } from './services/spoke/SuiSpokeService.js';
import type { PublicKey } from '@solana/web3.js';
import type { Converter } from 'icon-sdk-js';
import type { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';

export type HubChainId = (typeof HUB_CHAIN_IDS)[number];

export type SpokeChainId = (typeof SPOKE_CHAIN_IDS)[number];

export type ChainId = (typeof CHAIN_IDS)[number];

export type IntentRelayChainId = (typeof INTENT_RELAY_CHAIN_IDS)[keyof typeof INTENT_RELAY_CHAIN_IDS];

export type EvmChainId = (typeof EVM_CHAIN_IDS)[number];
export type EvmSpokeChainId = (typeof EVM_SPOKE_CHAIN_IDS)[number];

export type ChainType = 'evm' | 'cosmos' | 'stellar' | 'icon' | 'sui' | 'solana';

export type SpokeChainInfo<T extends ChainType> = {
  name: string;
  id: GetSpokeChainIdType<T>;
  type: T;
};

export type HubChainInfo<T extends ChainType> = {
  name: string;
  id: HubChainId;
  type: T;
};

export type GetSpokeChainIdType<T extends ChainType> = T extends 'evm' ? EvmSpokeChainId : SpokeChainId;

export type ByteArray = Uint8Array;
export type Hex = `0x${string}`;
export type Hash = `0x${string}`;
export type OriginalAssetAddress = string;

export type Token = {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
};

export type AssetInfo = {
  chainId: bigint;
  spokeAddress: `0x${string}`;
};

export type HubAssetInfo = { asset: Address; decimal: number; vault: Address };

export type BaseSpokeChainConfig<T extends ChainType> = {
  chain: SpokeChainInfo<T>;
  addresses: { [key: string]: Address | string | Uint8Array };
  supportedTokens: Token[];
  nativeToken: Address | string;
  bnUSD: Address | string;
};

export type BaseHubChainConfig<T extends ChainType> = {
  chain: HubChainInfo<T>;
  addresses: { [key: string]: Address | string | Uint8Array };
  supportedTokens: Token[];
  nativeToken: Address | string;
};

export type EvmHubChainConfig = BaseHubChainConfig<'evm'> & {
  addresses: {
    assetManager: Address;
    hubWallet: Address;
    xTokenManager: Address;
  };

  nativeToken: Address;
};

export type MoneyMarketConfig = {
  uiPoolDataProvider: Address;
  lendingPool: Address;
  poolAddressesProvider: Address;
  bnUSD?: Address;
  bnUSDVault?: Address;
};

export type EvmSpokeChainConfig = BaseSpokeChainConfig<'evm'> & {
  addresses: {
    assetManager: Address;
    connection: Address;
  };
  nativeToken: Address | string;
};

export type SuiSpokeChainConfig = BaseSpokeChainConfig<'sui'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  rpc_url: string;
};
export type CosmosNetworkEnv = 'TestNet' | 'DevNet' | 'Mainnet';

export type CosmosSpokeChainConfig = BaseSpokeChainConfig<'cosmos'> & {
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

export type StellarSpokeChainConfig = BaseSpokeChainConfig<'stellar'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  rpc_url: string;
};

export type IconSpokeChainConfig = BaseSpokeChainConfig<'icon'> & {
  addresses: {
    assetManager: IconAddress;
    connection: IconAddress;
    rateLimit: IconAddress;
  };
  nid: Hex;
};

export type SolanaChainConfig = BaseSpokeChainConfig<'solana'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  chain: SpokeChainInfo<'solana'>;
  rpcUrl: string;
  wsUrl: string;
  walletAddress: string;
  supportedTokens: Array<string>;
  nativeToken: string;
  gasPrice: string;
};

export type HubChainConfig = EvmHubChainConfig;

export type SpokeChainConfig =
  | EvmSpokeChainConfig
  | CosmosSpokeChainConfig
  | IconSpokeChainConfig
  | SuiSpokeChainConfig
  | StellarSpokeChainConfig
  | SolanaChainConfig;

export type GetSpokeChainConfigType<T extends ChainType> = T extends 'evm'
  ? EvmSpokeChainConfig
  : T extends 'cosmos'
    ? CosmosSpokeChainConfig
    : T extends 'icon'
      ? IconSpokeChainConfig
      : T extends 'sui'
        ? SuiSpokeChainConfig
        : T extends 'stellar'
          ? StellarSpokeChainConfig
          : T extends 'solana'
            ? SolanaChainConfig
            : never;

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
 * @property percentage - Optional fee percentage in basis points (e.g., 100 = 1%). Maximum allowed is 100 (1%).
 */
export type PartnerFee = {
  address: Address;
  amount?: bigint;
  percentage?: number;
};


export type EvmTxReturnType<T extends boolean> = T extends true ? TransactionReceipt : Hex;

export type IconAddress = `hx${string}` | `cx${string}`;
export type Result<T, E = Error | unknown> = { ok: true; value: T } | { ok: false; error: E };
export type HttpPrefixedUrl = `http${string}`;
export type IconEoaAddress = `hx${string}`;

export type GetSpokeProviderType<T extends ChainType> = T extends 'evm'
  ? EvmSpokeProvider
  : T extends 'cosmos'
    ? CWSpokeProvider
    : T extends 'icon'
      ? IconSpokeProvider
      : T extends 'sui'
        ? SuiSpokeProvider
        : T extends 'stellar'
          ? StellarSpokeProvider
          : T extends 'solana'
            ? SolanaSpokeProvider
            : never;

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
            : never;

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
            : never;

export type HttpUrl = `http://${string}` | `https://${string}`;

export type SolverConfig = {
  intentsContract: Address; // Intents Contract (Hub)
  solverApiEndpoint: HttpUrl;
  relayerApiEndpoint: HttpUrl;
};

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
  intent_tx_hash: Hex; // Intent hash of the execution on Sonic
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
  CREATE_INTENT_ORDER_FAILED = -998,
  UNKNOWN = -999,
}

export type EvmRawTransaction = {
  from: Address;
  to: Address;
  value: bigint;
  data: Hex;
};

type Base64String = string;

export type SolanaRawTransaction = {
  from: PublicKey;
  to: PublicKey;
  value: bigint;
  data: Base64String;
};

export type StellarRawTransaction = {
  from: string;
  to: string;
  value: bigint;
  data: string;
};

export type IconRawTransaction = Converter.RawTransaction;

export type SuiRawTransaction = {
  from: Hex;
  to: string;
  value: bigint;
  data: Base64String;
};

export type CWRawTransaction = {
  from: Hex;
  to: Hex;
  signedDoc: SignDoc;
};

export type EvmReturnType<Raw extends boolean> = Raw extends true ? EvmRawTransaction : Hex;
export type SolanaReturnType<Raw extends boolean> = Raw extends true ? SolanaRawTransaction : Hex;
export type StellarReturnType<Raw extends boolean> = Raw extends true ? StellarRawTransaction : Hex;
export type IconReturnType<Raw extends boolean> = Raw extends true ? IconRawTransaction : Hex;
export type SuiReturnType<Raw extends boolean> = Raw extends true ? SuiRawTransaction : Hex;
export type CWReturnType<Raw extends boolean> = Raw extends true ? CWRawTransaction : Hex;
export type TxReturnType<
  T extends ISpokeProvider,
  Raw extends boolean,
> = T['chainConfig']['chain']['type'] extends 'evm'
  ? EvmReturnType<Raw>
  : T['chainConfig']['chain']['type'] extends 'solana'
    ? SolanaReturnType<Raw>
    : T['chainConfig']['chain']['type'] extends 'stellar'
      ? StellarReturnType<Raw>
      : T['chainConfig']['chain']['type'] extends 'icon'
        ? IconReturnType<Raw>
        : T['chainConfig']['chain']['type'] extends 'sui'
          ? SuiReturnType<Raw>
          : T['chainConfig']['chain']['type'] extends 'cosmos'
            ? CWReturnType<Raw>
            : never; // TODO extend for each chain implementation
export type PromiseEvmTxReturnType<Raw extends boolean> = Promise<EvmReturnType<Raw>>;
export type PromiseSolanaTxReturnType<Raw extends boolean> = Promise<SolanaReturnType<Raw>>;
export type PromiseStellarTxReturnType<Raw extends boolean> = Promise<StellarReturnType<Raw>>;
export type PromiseIconTxReturnType<Raw extends boolean> = Promise<IconReturnType<Raw>>;
export type PromiseSuiTxReturnType<Raw extends boolean> = Promise<SuiReturnType<Raw>>;
export type PromiseCWTxReturnType<Raw extends boolean> = Promise<CWReturnType<Raw>>;

export type RawTxReturnType =
  | EvmRawTransaction
  | SolanaRawTransaction
  | CWRawTransaction
  | IconRawTransaction
  | SuiRawTransaction; // TODO extend for other chains (Icon, Cosmos, Sui)
export type GetRawTxReturnType<T extends ChainType> = T extends 'evm' ? PromiseEvmTxReturnType<boolean> : never;

export type PromiseTxReturnType<
  T extends ISpokeProvider,
  Raw extends boolean,
> = T['chainConfig']['chain']['type'] extends 'evm'
  ? PromiseEvmTxReturnType<Raw>
  : T['chainConfig']['chain']['type'] extends 'solana'
    ? PromiseSolanaTxReturnType<Raw>
    : T['chainConfig']['chain']['type'] extends 'stellar'
      ? PromiseStellarTxReturnType<Raw>
      : T['chainConfig']['chain']['type'] extends 'icon'
        ? PromiseIconTxReturnType<Raw>
        : T['chainConfig']['chain']['type'] extends 'sui'
          ? PromiseSuiTxReturnType<Raw>
          : T['chainConfig']['chain']['type'] extends 'cosmos'
            ? PromiseCWTxReturnType<Raw>
            : never;
