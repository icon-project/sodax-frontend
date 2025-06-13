// chain ids (actual for evm chains), custom for other chains not having native ids
export const AVALANCHE_MAINNET_CHAIN_ID = '0xa86a.avax';
export const ARBITRUM_MAINNET_CHAIN_ID = '0xa4b1.arbitrum';
export const BASE_MAINNET_CHAIN_ID = '0x2105.base';
export const BSC_MAINNET_CHAIN_ID = '0x38.bsc';
export const INJECTIVE_MAINNET_CHAIN_ID = 'injective-1';
export const SONIC_MAINNET_CHAIN_ID = 'sonic';
export const ICON_MAINNET_CHAIN_ID = '0x1.icon';
export const SUI_MAINNET_CHAIN_ID = 'sui';
export const OPTIMISM_MAINNET_CHAIN_ID = '0xa.optimism';
export const POLYGON_MAINNET_CHAIN_ID = '0x89.polygon';
export const SOLANA_MAINNET_CHAIN_ID = 'solana';
export const STELLAR_MAINNET_CHAIN_ID = 'stellar';
export const NIBIRU_MAINNET_CHAIN_ID = 'nibiru';

// currently supported spoke chains
export const SPOKE_CHAIN_IDS = [
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
] as const;

export const HUB_CHAIN_IDS = [SONIC_MAINNET_CHAIN_ID] as const;

export const CHAIN_IDS = [
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
] as const;

export type HubChainId = (typeof HUB_CHAIN_IDS)[number];

export type SpokeChainId = (typeof SPOKE_CHAIN_IDS)[number];

export type ChainId = (typeof CHAIN_IDS)[number];

export type ChainType = 'ICON' | 'EVM' | 'ARCHWAY' | 'HAVAH' | 'INJECTIVE' | 'SUI' | 'STELLAR' | 'SOLANA';

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

export type XToken = Token & {
  xChainId: ChainId;
};

export type ByteArray = Uint8Array;
export type Hex = `0x${string}`;
export type Hash = `0x${string}`;
export type Address = `0x${string}`;
export type HubAddress = Address;
export type OriginalAssetAddress = string;

export type EvmRawTransaction = {
  from: Address;
  to: Address;
  value: bigint;
  data: Hex;
};

// Ethereum JSON-RPC Spec based logs
export type EvmRawLog = {
  address: Address;
  topics: [Hex, ...Hex[]] | [];
  data: Hex;
  blockHash: Hash | null;
  blockNumber: Address | null;
  logIndex: Hex | null;
  transactionHash: Hash | null;
  transactionIndex: Hex | null;
  removed: boolean;
};

// Ethereum JSON-RPC Spec based transaction receipt
export type EvmRawTransactionReceipt = {
  transactionHash: string; // 32-byte hash
  transactionIndex: string; // hex string, e.g., '0x1'
  blockHash: string; // 32-byte hash
  blockNumber: string; // hex string, e.g., '0x5BAD55'
  from: string; // 20-byte address
  to: string | null; // null if contract creation
  cumulativeGasUsed: string; // hex string
  gasUsed: string; // hex string
  contractAddress: string | null; // non-null only if contract creation
  logs: EvmRawLog[];
  logsBloom: string; // 256-byte bloom filter hex string
  status?: string; // '0x1' = success, '0x0' = failure (optional pre-Byzantium)
  type?: string; // '0x0', '0x1', or '0x2' for tx type
  effectiveGasPrice?: string; // hex string, only on EIP-1559 txs
};

export type SuiTransaction = {
  toJSON: () => Promise<string>;
};

export type SuiArgument =
  | 'GasCoin'
  | {
    Input: number;
  }
  | {
    Result: number;
  };

export interface SuiExecutionResult {
  mutableReferenceOutputs?: [SuiArgument, number[], string][];
  returnValues?: [number[], string][];
}

export interface SuiCoinStruct {
  balance: string;
  coinObjectId: string;
  coinType: string;
  digest: string;
  previousTransaction: string;
  version: string;
}
export interface SuiPaginatedCoins {
  data: SuiCoinStruct[];
  hasNextPage: boolean;
  nextCursor?: string | null;
}

export interface IEvmWalletProvider {
  getWalletAddress: () => Address;
  getWalletAddressBytes: () => Hex;
  sendTransaction: (evmRawTx: EvmRawTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<EvmRawTransactionReceipt>;
}

export interface ISuiWalletProvider {
  getWalletAddress: () => Address;
  getWalletAddressBytes: () => Hex;
  signAndExecuteTxn: (txn: SuiTransaction) => Promise<Hex>;
  viewContract(
    tx: SuiTransaction,
    packageId: string,
    module: string,
    functionName: string,
    args: unknown[],
    typeArgs: string[],
  ): Promise<SuiExecutionResult>;
  getCoins: (address: string, token: string) => Promise<SuiPaginatedCoins>;
}

export type IconEoaAddress = `hx${string}`;
export type IcxCallTransaction = {
  to: string;
  from: string;
  nid: Hex;
  value: Hex;
  method: string;
  params: object;
  version?: Hex;
  timestamp?: number;
};

export type IconTransactionResult = {
  status: number;
  to: string;
  txHash: string;
  txIndex: number;
  blockHeight: number;
  blockHash: string;
  cumulativeStepUsed: bigint;
  stepUsed: bigint;
  stepPrice: bigint;
  scoreAddress?: string;
  eventLogs?: unknown;
  logsBloom?: unknown;
  failure?: {
    code: string;
    message: string;
  };
};

export interface IIconWalletProvider {
  getWalletAddress: () => IconEoaAddress;
  getWalletAddressBytes: () => Hex;
  sendTransaction: (iconRawTx: IcxCallTransaction) => Promise<Hash>;
  waitForTransactionReceipt: (txHash: Hash) => Promise<IconTransactionResult>;
}
