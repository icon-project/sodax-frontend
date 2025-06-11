/**
 * Icon chain types
 */

import type { Hex } from '../shared/index.js';

export type IconAddress = `hx${string}` | `cx${string}`;
export type IconEoaAddress = `hx${string}`;

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

export type IconReturnType<Raw extends boolean> = Raw extends true ? IconRawTransaction : Hex;
