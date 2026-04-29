import type { Network } from '@injectivelabs/networks';
import type { MsgBroadcasterWithPk } from '@injectivelabs/sdk-ts';
import type { ChainId, EvmChainId } from '@injectivelabs/ts-types';
import type { MsgBroadcaster } from '@injectivelabs/wallet-core';
import type { InjectiveCoin } from '@sodax/types';

/**
 * Defaults applied to every call. Per-call options shallow-merge over these.
 * `msgBroadcaster` options apply at construction time only (private-key path) —
 * the upstream MsgBroadcasterWithPk doesn't support post-construction reconfig.
 */
export type InjectiveWalletDefaults = {
  /** Coins attached to `getRawTransaction`/`execute` if caller doesn't supply funds. */
  defaultFunds?: InjectiveCoin[];
  /** Default memo on transactions. */
  defaultMemo?: string;
  /** Sequence override for `createTransaction`. Default 0. */
  sequence?: number;
  /** Account number override for `createTransaction`. Default 0. */
  accountNumber?: number;
};

export type BrowserExtensionInjectiveWalletConfig = {
  msgBroadcaster: MsgBroadcaster;
  defaults?: InjectiveWalletDefaults;
};

export type SecretInjectiveWalletConfig = {
  secret: { privateKey: string } | { mnemonics: string };
  chainId: ChainId;
  network: Network;
  evmOptions?: {
    evmChainId: EvmChainId;
    rpcUrl: `http${string}`;
  };
  defaults?: InjectiveWalletDefaults;
};

export type InjectiveWalletConfig = BrowserExtensionInjectiveWalletConfig | SecretInjectiveWalletConfig;

export type InjectiveWallet = {
  msgBroadcaster: MsgBroadcaster | MsgBroadcasterWithPk;
};
