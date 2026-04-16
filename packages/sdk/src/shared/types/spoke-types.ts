import type {
  Address,
  GetTokenAddressType,
  Hex,
  HubAddress,
  HubChainKey,
  SpokeChainKey,
  TxReturnType,
  GetChainType,
  EvmRawTransactionReceipt,
  SolanaRawTransactionReceipt,
  StellarSorobanTransactionReceipt,
  IconTransactionResult,
  SuiRawTransactionReceipt,
  InjectiveRawTransactionReceipt,
  NearRawTransactionReceipt,
  StacksRawTransactionReceipt,
  BitcoinRawTransactionReceipt,
  ChainType,
} from '@sodax/types';
import type { FromParams, OptionalSkipSimulation, WalletActionParams } from './types.js';

/*
 * Deposit parameters type for depositing tokens into spoke chain asset manager.
 * @param {C} C - The chain ID of the spoke chain.
 * @param {Raw} Raw - The return type raw transaction or just transaction hash.
 * @returns {DepositParams<C, Raw>} The deposit parameters type.
 */
export type DepositParams<C extends SpokeChainKey, Raw extends boolean = boolean> = WalletActionParams<Raw, C> &
  OptionalSkipSimulation &
  FromParams<C> & {
    to: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
    token: GetTokenAddressType<C>; // The original spoke chain address of the token to deposit
    amount: bigint; // The amount of tokens to deposit
    data: Hex; // The data to send with the deposit
  };

export type EstimateGasParams<C extends SpokeChainKey> = {
  tx: TxReturnType<C, true>;
  chainKey: C;
};

export type GetDepositParams<C extends SpokeChainKey> = FromParams<C> & {
  token: GetTokenAddressType<C>;
};

export type DepositSimulationParams = {
  spokeChainID: SpokeChainKey;
  token: Hex;
  from: Hex;
  to: Hex;
  amount: bigint;
  data: Hex;
  srcAddress: Hex;
};

export type SendMessageParams<C extends SpokeChainKey, Raw extends boolean = boolean> = FromParams<C> & {
  dstChainId: HubChainKey;
  payload: Hex;
  dstAddress: HubAddress; // The address on the hub chain.
} & OptionalSkipSimulation &
  WalletActionParams<Raw, C>;

export type WalletSimulationParams = {
  target: Address;
  srcChainId: bigint;
  srcAddress: Hex;
  payload: Hex;
};

export type VerifySimulationParams<
  C extends SpokeChainKey = SpokeChainKey,
  Raw extends boolean = boolean,
> = SendMessageParams<C, Raw>;

export type GetTxReceiptType<C extends SpokeChainKey | ChainType> = GetChainType<C> extends 'EVM'
  ? EvmRawTransactionReceipt
  : GetChainType<C> extends 'SOLANA'
    ? SolanaRawTransactionReceipt
    : GetChainType<C> extends 'STELLAR'
      ? StellarSorobanTransactionReceipt
      : GetChainType<C> extends 'ICON'
        ? IconTransactionResult
        : GetChainType<C> extends 'SUI'
          ? SuiRawTransactionReceipt
          : GetChainType<C> extends 'INJECTIVE'
            ? InjectiveRawTransactionReceipt
            : GetChainType<C> extends 'NEAR'
              ? NearRawTransactionReceipt
              : GetChainType<C> extends 'STACKS'
                ? StacksRawTransactionReceipt
                : GetChainType<C> extends 'BITCOIN'
                  ? BitcoinRawTransactionReceipt
                  : unknown;

export type TxStatus = 'success' | 'failure' | 'timeout';
export type WaitForTxReceiptParams<C extends SpokeChainKey> = {
  txHash: string;
  chainKey: C;
  pollingIntervalMs?: number;
  maxTimeoutMs?: number;
};

export type WaitForTxReceiptReturnType<C extends SpokeChainKey> =
  | {
      status: 'success';
      receipt: GetTxReceiptType<C>;
    }
  | {
      error: Error;
      status: Exclude<TxStatus, 'success'>;
    };

export type VerifyTxHashParams = {
  txHash: string;
  chainKey: SpokeChainKey;
};
