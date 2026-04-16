import type {
  BitcoinSpokeService,
  EvmSpokeService,
  IconSpokeService,
  InjectiveSpokeService,
  SolanaSpokeService,
  SonicSpokeService,
  StacksSpokeService,
  StellarSpokeService,
  SuiSpokeService,
} from '../services/index.js';
import type { EvmHubProvider } from '../entities/EvmHubProvider.js';
import type { NearSpokeService } from '../services/spoke/NearSpokeService.js';
import type {
  ChainType,
  EvmSpokeOnlyChainKey,
  GetAddressType,
  GetWalletProviderType,
  Hex,
  BitcoinChainKey,
  IconChainKey,
  InjectiveChainKey,
  NearChainKey,
  SolanaChainKey,
  SonicChainKey,
  SpokeChainKey,
  StellarChainKey,
  StacksChainKey,
  SuiChainKey,
} from '@sodax/types';

/**
 * Types derived from Core SDK specific types
 * NOTE: common (non Core SDK specific) types should be put in @sodax/types package
 */

export type HubProvider = EvmHubProvider;

export type SpokeServiceType =
  | EvmSpokeService
  | SonicSpokeService
  | SolanaSpokeService
  | StellarSpokeService
  | IconSpokeService
  | SuiSpokeService
  | InjectiveSpokeService
  | StacksSpokeService
  | NearSpokeService
  | BitcoinSpokeService;

export type GetSpokeServiceType<C extends SpokeChainKey> = C extends EvmSpokeOnlyChainKey
  ? EvmSpokeService
  : C extends SonicChainKey
    ? SonicSpokeService
    : C extends SolanaChainKey
      ? SolanaSpokeService
      : C extends StellarChainKey
        ? StellarSpokeService
        : C extends IconChainKey
          ? IconSpokeService
          : C extends SuiChainKey
            ? SuiSpokeService
            : C extends InjectiveChainKey
              ? InjectiveSpokeService
              : C extends StacksChainKey
                ? StacksSpokeService
                : C extends NearChainKey
                  ? NearSpokeService
                  : C extends BitcoinChainKey
                    ? BitcoinSpokeService
                    : SpokeServiceType;

export type RateLimitConfig = {
  maxAvailable: number;
  ratePerSecond: number;
  available: number;
};

/**
 * Structural types
 */

// FromParams is used in actions which require a from address and chain ID
export type FromParams<C extends SpokeChainKey> = {
  srcAddress: GetAddressType<C>; // The address of the user on the spoke (origin) chain
  srcChainKey: C; // The chain key of the spoke (origin) chain
};

export type OptionalRaw<R extends boolean> = { raw?: R };
export type OptionalSkipSimulation = { skipSimulation?: boolean };
export type OptionalTimeout = { timeout?: number };
export type RelayExtraData = { address: Hex; payload: Hex };
export type RelayOptionalExtraData = { data?: RelayExtraData };

export type RawDestinationParams = {
  toChainId: SpokeChainKey;
  toAddress: string;
};
export type DestinationParamsType = RawDestinationParams;

// OptionalWalletActionParamType is used in feature functions which has raw option not requiring a wallet provider
export type OptionalWalletActionParamType<C extends SpokeChainKey | ChainType, Raw extends boolean> = Raw extends true
  ? {}
  : Raw extends false
    ? {
        walletProvider: GetWalletProviderType<C>;
      }
    : never;

// WalletActionParams replaces the combination of OptionalRaw<R> + OptionalWalletActionParamType<R, C>
// with a single discriminated conditional type that enables TypeScript narrowing on `raw`.
// When Raw = true:    { raw: true }                         (raw required as discriminant, no walletProvider)
// When Raw = false:   { raw?: false; walletProvider: ... }  (walletProvider required, raw optional)
// When Raw = boolean: distributes to union of both branches (discriminated union, narrowable)
export type WalletActionParams<Raw extends boolean, C extends SpokeChainKey | ChainType> = Raw extends true
  ? { raw: true }
  : { raw: false; walletProvider: GetWalletProviderType<C> };
