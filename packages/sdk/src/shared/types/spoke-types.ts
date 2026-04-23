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
  GetAddressType,
  EvmSpokeOnlyChainKey,
  StellarChainKey,
  EvmChainKey,
  WalletProviderSlot,
} from '@sodax/types';
import type { OptionalSkipSimulation } from './types.js';

/*
 * Deposit parameters type for depositing tokens into spoke chain asset manager.
 * @param {C} C - The chain ID of the spoke chain.
 * @param {Raw} Raw - The return type raw transaction or just transaction hash.
 * @returns {DepositParams<C, Raw>} The deposit parameters type.
 */
export type DepositParams<C extends SpokeChainKey, Raw extends boolean = boolean> = {
  srcAddress: GetAddressType<C>; // The address of the user on the spoke (origin) chain
  srcChainKey: C; // The chain key of the spoke (origin) chain
  to: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: GetTokenAddressType<C>; // The original spoke chain address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
} & WalletProviderSlot<C, Raw> &
  OptionalSkipSimulation;

export type EstimateGasParams<C extends SpokeChainKey> = {
  tx: TxReturnType<C, true>;
  chainKey: C;
};

export type GetDepositParams<ChainKey extends SpokeChainKey = SpokeChainKey> = {
  srcChainKey: ChainKey; // The chain key of the spoke (origin) chain
  srcAddress: GetAddressType<ChainKey>; // The address of the user on the spoke (origin) chain
  token: GetTokenAddressType<ChainKey>;
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

export type SendMessageParams<K extends SpokeChainKey, Raw extends boolean> = {
  srcChainKey: K; // The chain key of the spoke (origin) chain
  srcAddress: GetAddressType<K>; // The address of the user on the spoke (origin) chain
  dstChainKey: HubChainKey; // hub chain key to which the message is sent
  dstAddress: HubAddress; // The wallet abstraction address on the hub chain.
  payload: Hex; // encoded contract call data
} & OptionalSkipSimulation &
  WalletProviderSlot<K, Raw>;

export type WalletSimulationParams = {
  target: Address;
  srcChainId: bigint;
  srcAddress: Hex;
  payload: Hex;
};

export type VerifySimulationParams<ChainKey extends SpokeChainKey, Raw extends boolean> = SendMessageParams<ChainKey, Raw>;

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

/**
 * Unified read-only params for spoke-level ERC-20 allowance or Stellar trustline checks.
 * Feature services map action-specific payloads into this shape before calling SpokeService.isAllowanceValid.
 *
 * Each variant is generic over its `srcChainKey` range so that callers who have already narrowed
 * `K` (via {@link isHubChainKeyType}, {@link isEvmSpokeOnlyChainKeyType}, {@link isStellarChainKeyType})
 * get the matching variant inferred without casts. Mirrors the {@link SpokeApproveParams} pattern.
 */
type SpokeIsAllowanceValidParamsCommon = {
  token: string;
  amount: bigint;
  owner: string;
};

export type SpokeIsAllowanceValidParamsHub<K extends HubChainKey = HubChainKey> = SpokeIsAllowanceValidParamsCommon & {
  srcChainKey: K;
  spender: Address;
};

export type SpokeIsAllowanceValidParamsEvmSpoke<K extends EvmSpokeOnlyChainKey = EvmSpokeOnlyChainKey> =
  SpokeIsAllowanceValidParamsCommon & {
    srcChainKey: K;
    spender: Address;
  };

export type SpokeIsAllowanceValidParamsStellar<K extends StellarChainKey = StellarChainKey> =
  SpokeIsAllowanceValidParamsCommon & {
    srcChainKey: K;
  };

type OtherSpokeChainKey = Exclude<SpokeChainKey, HubChainKey | EvmSpokeOnlyChainKey | StellarChainKey>;

export type SpokeIsAllowanceValidParamsOther<K extends OtherSpokeChainKey = OtherSpokeChainKey> =
  SpokeIsAllowanceValidParamsCommon & {
    srcChainKey: K;
  };

/** @internal Distributive: picks the variant based on `K`. Defaults to the full union. */
export type SpokeIsAllowanceValidParams<K extends SpokeChainKey = SpokeChainKey> = K extends EvmChainKey
  ? K extends HubChainKey // handle case when EvmChainKey type is passed
    ? SpokeIsAllowanceValidParamsHub<K>
    : SpokeIsAllowanceValidParamsEvmSpoke<EvmSpokeOnlyChainKey>
  : K extends HubChainKey
    ? SpokeIsAllowanceValidParamsHub<K>
    : K extends EvmSpokeOnlyChainKey
      ? SpokeIsAllowanceValidParamsEvmSpoke<K>
      : K extends StellarChainKey
        ? SpokeIsAllowanceValidParamsStellar<K>
        : K extends OtherSpokeChainKey
          ? SpokeIsAllowanceValidParamsOther<K>
          : never;

type SpokeApproveParamsCommon<K extends SpokeChainKey, Raw extends boolean> = {
  token: GetTokenAddressType<K>;
  amount: bigint;
  owner: GetAddressType<K>;
} & WalletProviderSlot<K, Raw>;

export type SpokeApproveParamsHub<K extends HubChainKey, Raw extends boolean> = SpokeApproveParamsCommon<K, Raw> & {
  srcChainKey: K;
  spender: Address;
};

export type SpokeApproveParamsEvmSpoke<K extends EvmSpokeOnlyChainKey, Raw extends boolean> =
  SpokeApproveParamsCommon<K, Raw> & {
    srcChainKey: K;
    spender: Address;
  };

export type SpokeApproveParamsStellar<K extends StellarChainKey, Raw extends boolean> = SpokeApproveParamsCommon<K, Raw> & {
  srcChainKey: K;
};

/**
 * Plain union of approve-capable variants. Callers who want narrow-`K` typing should instantiate
 * the specific variant (e.g. `SpokeApproveParamsHub<R>`) directly.
 */
export type SpokeApproveParams<K extends SpokeChainKey, Raw extends boolean> = K extends HubChainKey
  ? SpokeApproveParamsHub<K, Raw>
  : K extends EvmSpokeOnlyChainKey
    ? SpokeApproveParamsEvmSpoke<K, Raw>
    : K extends StellarChainKey
      ? SpokeApproveParamsStellar<K, Raw>
      : never;
