/**
 * Re-exports of types and runtime values from underlying chain SDKs.
 * Lets consumers import everything they need from `@sodax/wallet-sdk-core`
 * without taking direct dependencies on `viem`, `@mysten/sui`, etc.
 */

// ─── EVM (viem) ────────────────────────────────────────────────────────────
export type {
  Account,
  Address,
  Chain,
  Transport,
  PublicClient,
  WalletClient,
  HttpTransportConfig,
  PublicClientConfig,
  WalletClientConfig,
  SendTransactionParameters,
  WaitForTransactionReceiptParameters,
  TransactionReceipt,
} from 'viem';

// ─── Sui (@mysten/sui) ─────────────────────────────────────────────────────
export type { SuiTransactionBlockResponseOptions } from '@mysten/sui/client';
export type { Transaction, TransactionArgument } from '@mysten/sui/transactions';
export type { SuiWalletFeatures, WalletAccount, WalletWithFeatures } from '@mysten/wallet-standard';

// ─── Solana (@solana/web3.js) ──────────────────────────────────────────────
export type { Commitment, ConnectionConfig, SendOptions } from '@solana/web3.js';

// ─── Injective ─────────────────────────────────────────────────────────────
export type { Network } from '@injectivelabs/networks';
export type { ChainId, EvmChainId } from '@injectivelabs/ts-types';
export type { MsgBroadcaster } from '@injectivelabs/wallet-core';

// ─── Stellar (@stellar/stellar-sdk) ────────────────────────────────────────
export { Networks } from '@stellar/stellar-sdk';

// ─── Stacks ────────────────────────────────────────────────────────────────
export { PostConditionMode } from '@stacks/transactions';
export type { ClarityValue, PostConditionModeName } from '@stacks/transactions';
export type { StacksNetwork } from '@stacks/network';
export type { StacksProvider } from '@stacks/connect';

// ─── Near ──────────────────────────────────────────────────────────────────
export type { KeyPairString } from 'near-api-js';
export type { NearConnector } from '@hot-labs/near-connect';

// ─── Bitcoin ───────────────────────────────────────────────────────────────
export type { Network as BitcoinJsNetwork } from 'bitcoinjs-lib/src/networks.js';
