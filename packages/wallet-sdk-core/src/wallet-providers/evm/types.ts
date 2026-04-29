import type { EvmChainKey, EvmRawTransaction } from '@sodax/types';
import type {
  Account,
  Chain,
  HttpTransportConfig,
  PublicClient,
  PublicClientConfig,
  SendTransactionParameters,
  Transport,
  WaitForTransactionReceiptParameters,
  WalletClient,
  WalletClientConfig,
} from 'viem';

/** Send-tx execution params (gas/nonce/fees). Disjoint from EvmRawTransaction by type — no field collision possible. */
export type EvmSendTransactionPolicy = Omit<Partial<SendTransactionParameters>, keyof EvmRawTransaction>;

/** Wait-for-receipt params (confirmations/polling/timeout). `hash` is positional, not part of the policy. */
export type EvmWaitForTransactionReceiptPolicy = Partial<Omit<WaitForTransactionReceiptParameters, 'hash'>>;

/**
 * Defaults applied to every call. Per-call options shallow-merge over these.
 * `publicClient`/`walletClient`/`transport` only apply in private-key mode (consumer brings clients in browser-extension mode).
 */
export type EvmWalletDefaults = {
  publicClient?: Partial<Omit<PublicClientConfig, 'transport' | 'chain'>>;
  walletClient?: Partial<Omit<WalletClientConfig, 'transport' | 'chain' | 'account'>>;
  transport?: HttpTransportConfig;
  sendTransaction?: EvmSendTransactionPolicy;
  waitForTransactionReceipt?: EvmWaitForTransactionReceiptPolicy;
};

export type PrivateKeyEvmWalletConfig = {
  privateKey: `0x${string}`;
  chainId: EvmChainKey;
  rpcUrl?: `http${string}`;
  defaults?: EvmWalletDefaults;
};

export type BrowserExtensionEvmWalletConfig = {
  walletClient: WalletClient<Transport, Chain, Account>;
  publicClient: PublicClient;
  defaults?: EvmWalletDefaults;
};

export type EvmWalletConfig = PrivateKeyEvmWalletConfig | BrowserExtensionEvmWalletConfig;
