import type { PublicKey } from '@solana/web3.js';
import type { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';
import type { CWSpokeProvider } from './entities/cosmos/CWSpokeProvider.js';
import type {
  EvmSpokeProvider,
  ISpokeProvider,
  IconSpokeProvider,
  SolanaSpokeProvider,
  SpokeProvider,
  StellarSpokeProvider,
  SuiSpokeProvider,
} from './entities/index.js';
import type { EvmSpokeDepositParams } from './services/index.js';
import type { CWSpokeDepositParams } from './services/spoke/CWSpokeService.js';
import type { IconSpokeDepositParams } from './services/spoke/IconSpokeService.js';
import type { SolanaSpokeDepositParams } from './services/spoke/SolanaSpokeService.js';
import type { StellarSpokeDepositParams } from './services/spoke/StellarSpokeService.js';
import type { SuiSpokeDepositParams } from './services/spoke/SuiSpokeService.js';
import type {
  ChainType,
  EvmAddress,
  IconAddress,
  EvmRawTransaction,
  IconReturnType,
  IconRawTransaction,
  Hex,
  SuiRawTransaction,
} from '@sodax/types';

// export type EvmTxReturnType<T extends boolean> = T extends true ? TransactionReceipt : Hex;

export type GetSpokeProviderType<T extends ChainType> = T extends 'EVM'
  ? EvmSpokeProvider
  : T extends 'INJECTIVE'
    ? CWSpokeProvider
    : T extends 'ICON'
      ? IconSpokeProvider
      : T extends 'SUI'
        ? SuiSpokeProvider
        : T extends 'STELLAR'
          ? StellarSpokeProvider
          : T extends 'SOLANA'
            ? SolanaSpokeProvider
            : never;

export type SpokeDepositParams = EvmSpokeDepositParams | CWSpokeDepositParams | IconSpokeDepositParams;

export type GetSpokeDepositParamsType<T extends SpokeProvider> = T extends EvmSpokeProvider
  ? EvmSpokeDepositParams
  : T extends CWSpokeProvider
    ? CWSpokeDepositParams
    : T extends SuiSpokeProvider
      ? SuiSpokeDepositParams
      : T extends IconSpokeProvider
        ? IconSpokeDepositParams
        : T extends StellarSpokeProvider
          ? StellarSpokeDepositParams
          : T extends SolanaSpokeProvider
            ? SolanaSpokeDepositParams
            : never;

export type GetAddressType<T extends SpokeProvider> = T extends EvmSpokeProvider
  ? EvmAddress
  : T extends CWSpokeProvider
    ? string
    : T extends StellarSpokeProvider
      ? Hex
      : T extends IconSpokeProvider
        ? IconAddress
        : T extends SuiSpokeProvider
          ? Hex
          : T extends SolanaSpokeProvider
            ? Hex
            : never;

type Base64String = string;

export type SolanaRawTransaction = {
  from: PublicKey;
  to: PublicKey;
  value: bigint;
  data: Base64String;
};

export type StellarRawTransaction = {
  from: string;
  to: string;
  value: bigint;
  data: string;
};

export type CWRawTransaction = {
  from: Hex;
  to: Hex;
  signedDoc: SignDoc;
};

export type EvmReturnType<Raw extends boolean> = Raw extends true ? EvmRawTransaction : Hex;
export type SolanaReturnType<Raw extends boolean> = Raw extends true ? SolanaRawTransaction : Hex;
export type StellarReturnType<Raw extends boolean> = Raw extends true ? StellarRawTransaction : Hex;

export type SuiReturnType<Raw extends boolean> = Raw extends true ? SuiRawTransaction : Hex;
export type CWReturnType<Raw extends boolean> = Raw extends true ? CWRawTransaction : Hex;
export type TxReturnType<T extends SpokeProvider, Raw extends boolean> = T['chainConfig']['chain']['type'] extends 'EVM'
  ? EvmReturnType<Raw>
  : T['chainConfig']['chain']['type'] extends 'SOLANA'
    ? SolanaReturnType<Raw>
    : T['chainConfig']['chain']['type'] extends 'STELLAR'
      ? StellarReturnType<Raw>
      : T['chainConfig']['chain']['type'] extends 'ICON'
        ? IconReturnType<Raw>
        : T['chainConfig']['chain']['type'] extends 'SUI'
          ? SuiReturnType<Raw>
          : T['chainConfig']['chain']['type'] extends 'INJECTIVE'
            ? CWReturnType<Raw>
            : never; // TODO extend for each chain implementation
export type PromiseEvmTxReturnType<Raw extends boolean> = Promise<TxReturnType<EvmSpokeProvider, Raw>>;
export type PromiseSolanaTxReturnType<Raw extends boolean> = Promise<TxReturnType<SolanaSpokeProvider, Raw>>;
export type PromiseStellarTxReturnType<Raw extends boolean> = Promise<TxReturnType<StellarSpokeProvider, Raw>>;
export type PromiseIconTxReturnType<Raw extends boolean> = Promise<TxReturnType<IconSpokeProvider, Raw>>;
export type PromiseSuiTxReturnType<Raw extends boolean> = Promise<TxReturnType<SuiSpokeProvider, Raw>>;
export type PromiseCWTxReturnType<Raw extends boolean> = Promise<TxReturnType<CWSpokeProvider, Raw>>;

export type RawTxReturnType =
  | EvmRawTransaction
  | SolanaRawTransaction
  | CWRawTransaction
  | IconRawTransaction
  | SuiRawTransaction; // TODO extend for other chains (Icon, Cosmos, Sui)
export type GetRawTxReturnType<T extends ChainType> = T extends 'EVM' ? PromiseEvmTxReturnType<boolean> : never;

export type PromiseTxReturnType<
  T extends ISpokeProvider,
  Raw extends boolean,
> = T['chainConfig']['chain']['type'] extends 'EVM'
  ? PromiseEvmTxReturnType<Raw>
  : T['chainConfig']['chain']['type'] extends 'SOLANA'
    ? PromiseSolanaTxReturnType<Raw>
    : T['chainConfig']['chain']['type'] extends 'STELLAR'
      ? PromiseStellarTxReturnType<Raw>
      : T['chainConfig']['chain']['type'] extends 'ICON'
        ? PromiseIconTxReturnType<Raw>
        : T['chainConfig']['chain']['type'] extends 'SUI'
          ? PromiseSuiTxReturnType<Raw>
          : T['chainConfig']['chain']['type'] extends 'INJECTIVE'
            ? PromiseCWTxReturnType<Raw>
            : never;
