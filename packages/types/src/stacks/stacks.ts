import type { ICoreWallet } from '../wallet/wallet.js';

export type StacksRawTransaction = {
  payload: string; // hex-encoded serialized transaction payload
  estimatedLength?: number; // optional estimated byte length
};

export type StacksReturnType<Raw extends boolean> = Raw extends true
  ? StacksRawTransaction
  : Raw extends false
    ? string
    : StacksRawTransaction | string;

export declare enum PostConditionMode {
  Allow = 1,
  Deny = 2,
}
export type AssetString = `${ContractIdString}::${string}`;

export type FungibleComparator = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
export interface StxPostCondition {
  type: 'stx-postcondition';
  address: string;
  condition: `${FungibleComparator}`;
  amount: string | bigint | number;
}
export type FungiblePostCondition = {
  type: 'ft-postcondition';
  address: string;
  condition: `${FungibleComparator}`;
  asset: AssetString;
  amount: string | bigint | number;
};
export type NonFungibleComparator = 'sent' | 'not-sent';
export type NonFungiblePostCondition = {
  type: 'nft-postcondition';
  address: string;
  condition: `${NonFungibleComparator}`;
  asset: AssetString;
  assetId: ClarityValue;
};
export type PostCondition = StxPostCondition | FungiblePostCondition | NonFungiblePostCondition;
export type PostConditionModeName = 'allow' | 'deny';

export type ContractIdString = `${string}.${string}`;

export declare enum ClarityType {
  Int = 'int',
  UInt = 'uint',
  Buffer = 'buffer',
  BoolTrue = 'true',
  BoolFalse = 'false',
  PrincipalStandard = 'address',
  PrincipalContract = 'contract',
  ResponseOk = 'ok',
  ResponseErr = 'err',
  OptionalNone = 'none',
  OptionalSome = 'some',
  List = 'list',
  Tuple = 'tuple',
  StringASCII = 'ascii',
  StringUTF8 = 'utf8',
}
export declare enum ClarityWireType {
  int = 0,
  uint = 1,
  buffer = 2,
  true = 3,
  false = 4,
  address = 5,
  contract = 6,
  ok = 7,
  err = 8,
  none = 9,
  some = 10,
  list = 11,
  tuple = 12,
  ascii = 13,
  utf8 = 14,
}

export type BooleanCV = TrueCV | FalseCV;
export interface TrueCV {
  type: ClarityType.BoolTrue;
}
export interface FalseCV {
  type: ClarityType.BoolFalse;
}
export interface BufferCV {
  readonly type: ClarityType.Buffer;
  readonly value: string;
}
export interface IntCV {
  readonly type: ClarityType.Int;
  readonly value: bigint | number | string;
}
export interface UIntCV {
  readonly type: ClarityType.UInt;
  readonly value: bigint | number | string;
}
export interface ListCV<T extends ClarityValue = ClarityValue> {
  type: ClarityType.List;
  value: T[];
}
export type OptionalCV<T extends ClarityValue = ClarityValue> = NoneCV | SomeCV<T>;
export interface NoneCV {
  readonly type: ClarityType.OptionalNone;
}
export interface SomeCV<T extends ClarityValue = ClarityValue> {
  readonly type: ClarityType.OptionalSome;
  readonly value: T;
}
export type PrincipalCV = StandardPrincipalCV | ContractPrincipalCV;
export interface StandardPrincipalCV {
  readonly type: ClarityType.PrincipalStandard;
  readonly value: string;
}
export interface ContractPrincipalCV {
  readonly type: ClarityType.PrincipalContract;
  readonly value: ContractIdString;
}
export type ResponseCV = ResponseErrorCV | ResponseOkCV;
export interface ResponseErrorCV<T extends ClarityValue = ClarityValue> {
  readonly type: ClarityType.ResponseErr;
  readonly value: T;
}
export interface ResponseOkCV<T extends ClarityValue = ClarityValue> {
  readonly type: ClarityType.ResponseOk;
  readonly value: T;
}
export interface StringAsciiCV {
  readonly type: ClarityType.StringASCII;
  readonly value: string;
}
export interface StringUtf8CV {
  readonly type: ClarityType.StringUTF8;
  readonly value: string;
}
export type TupleData<T extends ClarityValue = ClarityValue> = {
  [key: string]: T;
};
export interface TupleCV<T extends TupleData = TupleData> {
  type: ClarityType.Tuple;
  value: T;
}

export type ClarityValue =
  | BooleanCV
  | BufferCV
  | IntCV
  | UIntCV
  | StandardPrincipalCV
  | ContractPrincipalCV
  | ResponseErrorCV
  | ResponseOkCV
  | NoneCV
  | SomeCV
  | ListCV
  | TupleCV
  | StringAsciiCV
  | StringUtf8CV;

export type StacksTransactionParams = {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  postConditionMode?: PostConditionMode;
  postConditions?: PostCondition[];
};

export type StacksTransactionEventType =
  | 'smart_contract_log'
  | 'stx_asset'
  | 'fungible_token_asset'
  | 'non_fungible_token_asset'
  | 'stx_lock';

export type StacksTransactionEvent = {
  event_index: number;
  event_type: StacksTransactionEventType;
  tx_id: string;
  contract_log?: {
    contract_id: string;
    topic: string;
    value: { hex: string; repr: string };
  };
  asset?: {
    asset_event_type: string;
    asset_id?: string;
    sender?: string;
    recipient?: string;
    amount?: string;
    value?: { hex: string; repr: string };
  };
};

export type StacksRawTransactionReceipt = {
  tx_id: string;
  tx_status: 'success' | 'abort_by_response' | 'abort_by_post_condition' | 'pending';
  tx_type: 'token_transfer' | 'smart_contract' | 'contract_call' | 'poison_microblock' | 'coinbase' | 'tenure_change';
  nonce: number;
  fee_rate: string;
  sender_address: string;
  sponsor_address?: string;
  sponsored: boolean;
  block_hash?: string;
  block_height?: number;
  block_time?: number;
  block_time_iso?: string;
  burn_block_time?: number;
  burn_block_time_iso?: string;
  burn_block_height?: number;
  parent_burn_block_time?: number;
  canonical?: boolean;
  tx_index?: number;
  tx_result?: { hex: string; repr: string };
  event_count?: number;
  events?: StacksTransactionEvent[];
  is_unanchored?: boolean;
  microblock_hash?: string;
  microblock_sequence?: number;
  microblock_canonical?: boolean;
  execution_cost_read_count?: number;
  execution_cost_read_length?: number;
  execution_cost_runtime?: number;
  execution_cost_write_count?: number;
  execution_cost_write_length?: number;
};

export interface IStacksWalletProvider extends ICoreWallet {
  readonly chainType: 'STACKS';
  getWalletAddress: () => Promise<string>;
  getPublicKey: () => Promise<string>;
  getBalance: (address: string) => Promise<bigint>;
  sendTransaction: (txParams: StacksTransactionParams) => Promise<string>;
}
