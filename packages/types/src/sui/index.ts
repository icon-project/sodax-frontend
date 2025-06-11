import type { Hex } from "../index.js";

type Base64String = string;

export type SuiRawTransaction = {
  from: Hex;
  to: string;
  value: bigint;
  data: Base64String;
};

export type SuiArgument = {
  type: string;
  value: string;
};

export type SuiTransaction = {
  toJSON: () => Promise<string>;
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