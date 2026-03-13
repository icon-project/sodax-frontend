import type { AleoNetworkEnv } from '../aleo/index.js';
import type {
  HUB_CHAIN_IDS,
  CHAIN_IDS,
  EVM_CHAIN_IDS,
  ChainIdToIntentRelayChainId,
  HubVaultSymbols,
  ETHEREUM_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  BITCOIN_MAINNET_CHAIN_ID,
} from '../constants/index.js';
import type { InjectiveNetworkEnv } from '../injective/index.js';

export type HubChainId = (typeof HUB_CHAIN_IDS)[number];

export type SpokeChainId = (typeof CHAIN_IDS)[number];

export type ChainId = (typeof CHAIN_IDS)[number];

export const ChainTypeArr = ['ICON', 'EVM', 'INJECTIVE', 'SUI', 'STELLAR', 'SOLANA', 'STACKS', 'NEAR', 'BITCOIN', 'ALEO'] as const;
export type ChainType = (typeof ChainTypeArr)[number];

export type Chain = {
  id: string | number;
  name: string;
  testnet: boolean;
};

export type XChain = Chain & {
  xChainId: ChainId;
  xChainType: ChainType;
};

export type Token = {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
};

export type Erc20Token = {
  name: string;
  symbol: string;
  decimals: number;
  address: Address;
};

export type XToken = (Token | Erc20Token) & {
  xChainId: ChainId;
};

export type ByteArray = Uint8Array;
export type Hex = `0x${string}`;
export type Hash = `0x${string}`;
export type Address = `0x${string}`;
export type HubAddress = Address;
export type OriginalAssetAddress = string;

export interface WalletAddressProvider {
  getWalletAddress(): Promise<string>; // The wallet address as a string
  getPublicKey?: () => Promise<string>;
}

export type HttpUrl = `http://${string}` | `https://${string}`;

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

// Mapped type that uses ChainId as keys and assigns appropriate value types
// Stellar uses StellarRpcConfig, Bitcoin uses BitcoinRpcConfig, all other chains use string
export type RpcConfig = Partial<{
  [K in ChainId]: K extends typeof STELLAR_MAINNET_CHAIN_ID
    ? StellarRpcConfig
    : K extends typeof BITCOIN_MAINNET_CHAIN_ID
      ? BitcoinRpcConfig
      : string;
}> & { [ETHEREUM_MAINNET_CHAIN_ID]?: string | undefined };

export type IntentRelayChainId = (typeof ChainIdToIntentRelayChainId)[keyof typeof ChainIdToIntentRelayChainId];
export type IntentRelayChainIdMap = Record<ChainId, IntentRelayChainId>;
export type SpokeChainConfigMap = Record<SpokeChainId, SpokeChainConfig>;
export type HubVaultSymbol = (typeof HubVaultSymbols)[number];
export type EvmChainId = (typeof EVM_CHAIN_IDS)[number];
export type EvmSpokeChainId = (typeof EVM_CHAIN_IDS)[number];

export type GetSpokeChainIdType<T extends ChainType> = T extends 'EVM' ? EvmSpokeChainId : SpokeChainId;

export type BaseSpokeChainInfo<T extends ChainType> = {
  name: string;
  id: GetSpokeChainIdType<T>;
  chainId: string | number;

  type: T;
};

export type HubAssetInfo = { asset: Address; decimal: number; vault: Address };

export type BaseHubChainConfig<T extends ChainType> = {
  chain: HubChainInfo<T>;
  addresses: { [key: string]: Address | string | Uint8Array };
  supportedTokens: Token[];
  nativeToken: Address | string;
};

export type HubChainInfo<T extends ChainType> = {
  name: string;
  id: HubChainId;
  type: T;
  chainId: string | number;
};

export type HubChainConfig = EvmHubChainConfig;

export type AssetInfo = {
  chainId: bigint;
  spokeAddress: `0x${string}`;
};

export type EvmHubChainConfig = BaseHubChainConfig<'EVM'> & {
  addresses: {
    assetManager: Address;
    hubWallet: Address;
    xTokenManager: Address;
    icxMigration: Address;
    balnSwap: Address;
    sodaToken: Address;
    sodaVault: Address;
    stakedSoda: Address;
    xSoda: Address;
    stakingRouter: Address;
    walletRouter: Address;
  };
  nativeToken: Address;
  wrappedNativeToken: Address;
};

export type SpokeChainInfo<T extends ChainType> = BaseSpokeChainInfo<T>;

export type BaseSpokeChainConfig<T extends ChainType> = {
  chain: SpokeChainInfo<T>;
  addresses: { [key: string]: string };
  supportedTokens: Record<string, XToken>;
  nativeToken: string;
  bnUSD: string;
};

export type SonicSpokeChainConfig = BaseSpokeChainConfig<'EVM'> & {
  addresses: {
    walletRouter: Address;
    wrappedSonic: Address;
  };
  nativeToken: Address;
};

export type SolanaChainConfig = BaseSpokeChainConfig<'SOLANA'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
  };
  chain: SpokeChainInfo<'SOLANA'>;
  rpcUrl: string;
  walletAddress: string;
  nativeToken: string;
  gasPrice: string;
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
  };
  horizonRpcUrl: HttpUrl;
  sorobanRpcUrl: HttpUrl;
  trustlineConfigs: StellarAssetTrustline[];
};

export type BitcoinSpokeChainConfig = BaseSpokeChainConfig<'BITCOIN'> & {
  addresses: {
    assetManager: string;
  };
  rpcUrl: string;
  network: string;
  radfiApiUrl: string;
  radfiApiKey: string;
  radfiUmsUrl: string;
};

export type InjectiveSpokeChainConfig = BaseSpokeChainConfig<'INJECTIVE'> & {
  rpcUrl: string;
  walletAddress: string;
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
  };
  nativeToken: string;
  prefix: string;
  gasPrice: string;
  isBrowser: boolean;
  networkId: string;
  network: InjectiveNetworkEnv;
};

export type EvmSpokeChainConfig = BaseSpokeChainConfig<'EVM'> & {
  addresses: {
    assetManager: Address;
    connection: Address;
  };
  nativeToken: string;
};

export type SuiSpokeChainConfig = BaseSpokeChainConfig<'SUI'> & {
  addresses: {
    originalAssetManager: string;
    assetManagerConfigId: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
  };
  rpc_url: string;
};

export type NearSpokeChainConfig = BaseSpokeChainConfig<'NEAR'> & {
  addresses: {
    assetManager: string;
    connection: string;
    rateLimit: string;
    intentFiller: string;
  };
  rpcUrl: string;
};

export type IconAddress = `hx${string}` | `cx${string}`;
export type IconSpokeChainConfig = BaseSpokeChainConfig<'ICON'> & {
  addresses: {
    assetManager: IconAddress;
    connection: IconAddress;
    rateLimit: IconAddress;
    wICX: `cx${string}`;
  };
  nid: Hex;
};

export type StacksSpokeChainConfig = BaseSpokeChainConfig<'STACKS'> & {
  addresses: {
    assetManager: string;
    connection: string;
    rateLimit: string;
    xTokenManager: string;
  };
  chain: SpokeChainInfo<'STACKS'>;
  rpcUrl: string;
  nativeToken: string;
};
export type AleoAddress = `aleo1${string}`;
export type AleoSpokeChainConfig = BaseSpokeChainConfig<'ALEO'> & {
  rpcUrl: string;
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  nativeToken: string;
  gasPrice: string;
  network: AleoNetworkEnv;
};

export type SpokeChainConfig =
  | EvmSpokeChainConfig
  | SonicSpokeChainConfig
  | InjectiveSpokeChainConfig
  | IconSpokeChainConfig
  | SuiSpokeChainConfig
  | StellarSpokeChainConfig
  | BitcoinSpokeChainConfig
  | SolanaChainConfig
  | StacksSpokeChainConfig
  | NearSpokeChainConfig
  | AleoSpokeChainConfig;

export type SolverConfig = {
  intentsContract: Address; // Intents Contract (Hub)
  solverApiEndpoint: HttpUrl;
  protocolIntentsContract?: Address; // Protocol Intents Contract for partner fee claims
};

export type MoneyMarketConfig = {
  uiPoolDataProvider: Address;
  lendingPool: Address;
  poolAddressesProvider: Address;
  bnUSD: Address;
  bnUSDVault: Address;
  bnUSDAToken: Address;
};

export type HubAsset = {
  asset: Address;
  decimal: number;
  vault: Address;
  symbol: string;
  name: string;
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

export type ConcentratedLiquidityConfig = {
  permit2: Address;
  clPoolManager: Address;
  router: Address;
  clPositionManager: Address;
  clPositionDescriptor: Address;
  clQuoter: Address;
  clTickLens: Address;
  defaultHook: Address;
  stataTokenFactory: Address;
  defaultTickSpacing: number;
  defaultBitmap: bigint;
};
