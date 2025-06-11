/**
 * EVM chain types
 */

import type { SpokeChainId } from '../chain/index.js';
import type { EvmAddress, Hex, Hash } from '../shared/index.js';

export type EvmRawTransaction = {
  from: EvmAddress;
  to: EvmAddress;
  value: bigint;
  data: Hex;
};

// Ethereum JSON-RPC Spec based logs
export type EvmRawLog = {
  address: EvmAddress;
  topics: [Hex, ...Hex[]] | [];
  data: Hex;
  blockHash: Hash | null;
  blockNumber: EvmAddress | null;
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

export type EvmContractCall = {
  address: EvmAddress; // Target address of the call
  value: bigint; // Ether value to send (in wei as a string for precision)
  data: Hex; // Calldata for the call
};

export type EvmTransferToHubParams = {
  token: EvmAddress;
  recipient: EvmAddress;
  amount: bigint;
  data: Hex;
};

export type EvmTransferParams = {
  fromToken: EvmAddress;
  dstChainId: SpokeChainId;
  toToken: Hex;
  to: Hex;
  amount: bigint;
  data: Hex;
};
