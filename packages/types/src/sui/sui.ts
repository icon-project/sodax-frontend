import type { Base64String, Hex, WalletAddressProvider } from '../index.js';

export type SuiReturnType<Raw extends boolean> = Raw extends true ? SuiRawTransaction : string;

export type SuiRawTransaction = {
  from: Hex;
  to: string;
  value: bigint;
  data: Base64String;
};

export type SuiTransaction = {
  toJSON: () => Promise<string>;
};

export type SuiArgument = 'GasCoin' | { Input: number } | { Result: number } | { NestedResult: [number, number] };

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

export type SuiObjectRef = {
  digest: string;
  objectId: string;
  version: string;
};

export type Authenticator =
  /** The contained SuiAddress exclusively has all permissions: read, write, delete, transfer */
  {
    SingleOwner: string;
  };
export interface SuiBalance {
  coinObjectCount: number;
  coinType: string;
  lockedBalance: {
    [key: string]: string;
  };
  totalBalance: string;
}

export type SuiObjectOwner =
  | { AddressOwner: string }
  | { ObjectOwner: string }
  | { Shared: { initial_shared_version: string } }
  | 'Immutable'
  | {
      ConsensusV2: {
        authenticator: Authenticator;
        start_version: string;
      };
    };

export type SuiOwnedObjectRef = {
  owner: SuiObjectOwner;
  reference: SuiObjectRef;
};

export type SuiGasCostSummary = {
  computationCost: string;
  storageCost: string;
  storageRebate: string;
  nonRefundableStorageFee: string;
};

export type SuiExecutionStatus = {
  status: 'success' | 'failure';
  error?: string;
};

export type SuiTransactionEffectsModifiedAtVersions = {
  objectId: string;
  sequenceNumber: string;
};

export type SuiTransactionEffects = {
  messageVersion: 'v1';
  status: SuiExecutionStatus;
  executedEpoch: string;
  gasUsed: SuiGasCostSummary;
  transactionDigest: string;
  gasObject: SuiOwnedObjectRef;
  dependencies?: string[];
  created?: SuiOwnedObjectRef[];
  mutated?: SuiOwnedObjectRef[];
  deleted?: SuiObjectRef[];
  wrapped?: SuiObjectRef[];
  unwrapped?: SuiOwnedObjectRef[];
  unwrappedThenDeleted?: SuiObjectRef[];
  sharedObjects?: SuiObjectRef[];
  modifiedAtVersions?: SuiTransactionEffectsModifiedAtVersions[];
  eventsDigest?: string | null;
};

export type SuiEventId = {
  txDigest: string;
  eventSeq: string;
};

/** `parsedJson` is intentionally untyped in the Sui SDK — it carries arbitrary Move struct data. */
export type SuiEvent =
  | {
      /**
       * Sequential event ID, ie (transaction seq number, event seq number). 1) Serves as a unique event ID
       * for each fullnode 2) Also serves to sequence events for the purposes of pagination and querying. A
       * higher id is an event seen later by that fullnode. This ID is the "cursor" for event querying.
       */
      id: SuiEventId;
      /** Move package where this event was emitted. */
      packageId: string;
      /** Parsed json value of the event */
      parsedJson: unknown;
      /** Sender's Sui address. */
      sender: string;
      /** UTC timestamp in milliseconds since epoch (1/1/1970) */
      timestampMs?: string | null;
      /** Move module where this event was emitted. */
      transactionModule: string;
      /** Move event type. */
      type: string;
      bcs: string;
      bcsEncoding: 'base64';
    }
  | {
      /**
       * Sequential event ID, ie (transaction seq number, event seq number). 1) Serves as a unique event ID
       * for each fullnode 2) Also serves to sequence events for the purposes of pagination and querying. A
       * higher id is an event seen later by that fullnode. This ID is the "cursor" for event querying.
       */
      id: SuiEventId;
      /** Move package where this event was emitted. */
      packageId: string;
      /** Parsed json value of the event */
      parsedJson: unknown;
      /** Sender's Sui address. */
      sender: string;
      /** UTC timestamp in milliseconds since epoch (1/1/1970) */
      timestampMs?: string | null;
      /** Move module where this event was emitted. */
      transactionModule: string;
      /** Move event type. */
      type: string;
      bcs: string;
      bcsEncoding: 'base58';
    };

export type SuiObjectChange =
  | { type: 'published'; digest: string; modules: string[]; packageId: string; version: string }
  | {
      type: 'transferred';
      digest: string;
      objectId: string;
      objectType: string;
      recipient: SuiObjectOwner;
      sender: string;
      version: string;
    }
  | {
      type: 'mutated';
      digest: string;
      objectId: string;
      objectType: string;
      owner: SuiObjectOwner;
      previousVersion: string;
      sender: string;
      version: string;
    }
  | { type: 'deleted'; objectId: string; objectType: string; sender: string; version: string }
  | { type: 'wrapped'; objectId: string; objectType: string; sender: string; version: string }
  | {
      type: 'created';
      digest: string;
      objectId: string;
      objectType: string;
      owner: SuiObjectOwner;
      sender: string;
      version: string;
    };

export type SuiBalanceChange = {
  amount: string;
  coinType: string;
  owner: SuiObjectOwner;
};

export type SuiGasData = {
  budget: string;
  owner: string;
  payment: SuiObjectRef[];
  price: string;
};

export type SuiMoveCallTransaction = {
  arguments?: SuiArgument[];
  function: string;
  module: string;
  package: string;
  type_arguments?: string[];
};

export type SuiTransactionCommand =
  | { MoveCall: SuiMoveCallTransaction }
  | { TransferObjects: [SuiArgument[], SuiArgument] }
  | { SplitCoins: [SuiArgument, SuiArgument[]] }
  | { MergeCoins: [SuiArgument, SuiArgument[]] }
  | { Publish: string[] }
  | { Upgrade: [string[], string, SuiArgument] }
  | { MakeMoveVec: [string | null, SuiArgument[]] };

export type SuiCallArg =
  | { type: 'object'; digest: string; objectId: string; objectType: 'immOrOwnedObject'; version: string }
  | { type: 'object'; initialSharedVersion: string; mutable: boolean; objectId: string; objectType: 'sharedObject' }
  | { type: 'object'; digest: string; objectId: string; objectType: 'receiving'; version: string }
  /** `value` is typed as `unknown` in the Sui SDK — it carries arbitrary BCS-decoded primitive values. */
  | { type: 'pure'; value: unknown };

export type SuiTransactionBlockKind =
  | { kind: 'ProgrammableTransaction'; inputs: SuiCallArg[]; transactions: SuiTransactionCommand[] }
  | {
      kind: 'ChangeEpoch';
      epoch: string;
      computation_charge: string;
      storage_charge: string;
      storage_rebate: string;
      epoch_start_timestamp_ms: string;
    }
  | { kind: 'Genesis'; objects: string[] }
  | { kind: 'ConsensusCommitPrologue'; epoch: string; round: string; commit_timestamp_ms: string }
  | { kind: 'EndOfEpochTransaction'; transactions: { kind: string }[] }
  | { kind: string };

export type SuiTransactionBlockData = {
  gasData: SuiGasData;
  messageVersion: 'v1';
  sender: string;
  transaction: SuiTransactionBlockKind;
};

export type SuiTransactionBlock = {
  data: SuiTransactionBlockData;
  txSignatures: string[];
};

export type SuiRawTransactionReceipt = {
  digest: string;
  effects?: SuiTransactionEffects | null;
  events?: SuiEvent[] | null;
  objectChanges?: SuiObjectChange[] | null;
  balanceChanges?: SuiBalanceChange[] | null;
  timestampMs?: string | null;
  checkpoint?: string | null;
  transaction?: SuiTransactionBlock | null;
  confirmedLocalExecution?: boolean | null;
  errors?: string[];
  rawEffects?: number[];
  rawTransaction?: string;
};

export interface ISuiWalletProvider extends WalletAddressProvider {
  getWalletAddress: () => Promise<string>;
  signAndExecuteTxn: (txn: SuiTransaction) => Promise<string>;
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
