import type { EvmChainKey, EvmRawTransaction, EvmRawTransactionReceipt, IEvmWalletProvider } from '@sodax/types';
import type {
  Account,
  Address,
  Chain,
  Hash,
  HttpTransportConfig,
  PublicClient,
  PublicClientConfig,
  SendTransactionParameters,
  TransactionReceipt,
  Transport,
  WaitForTransactionReceiptParameters,
  WalletClient,
  WalletClientConfig,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
import { shallowMerge } from './_internal/merge.js';
import {
  sonic,
  avalanche,
  arbitrum,
  base,
  optimism,
  bsc,
  polygon,
  mainnet,
  redbellyMainnet,
  kaia,
  lightlinkPhoenix,
} from 'viem/chains';
import { ChainKeys } from '@sodax/types';

// HyperEVM is not in viem/chains; define manually.
export const hyper = /*#__PURE__*/ defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: { decimals: 18, name: 'HYPE', symbol: 'HYPE' },
  rpcUrls: { default: { http: ['https://rpc.hyperliquid.xyz/evm'] } },
  blockExplorers: { default: { name: 'HyperEVMScan', url: 'https://hyperevmscan.io/' } },
  contracts: { multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11', blockCreated: 13051 } },
});

export function getEvmViemChain(key: EvmChainKey): Chain {
  switch (key) {
    case ChainKeys.SONIC_MAINNET:
      return sonic;
    case ChainKeys.AVALANCHE_MAINNET:
      return avalanche;
    case ChainKeys.ARBITRUM_MAINNET:
      return arbitrum;
    case ChainKeys.BASE_MAINNET:
      return base;
    case ChainKeys.OPTIMISM_MAINNET:
      return optimism;
    case ChainKeys.BSC_MAINNET:
      return bsc;
    case ChainKeys.POLYGON_MAINNET:
      return polygon;
    case ChainKeys.HYPEREVM_MAINNET:
      return hyper;
    case ChainKeys.LIGHTLINK_MAINNET:
      return lightlinkPhoenix;
    case ChainKeys.ETHEREUM_MAINNET:
      return mainnet;
    case ChainKeys.REDBELLY_MAINNET:
      return redbellyMainnet;
    case ChainKeys.KAIA_MAINNET:
      return kaia;
    default: {
      const exhaustiveCheck: never = key; // The never type is used to ensure that the default case is exhaustive
      console.log(exhaustiveCheck);
      throw new Error(`Unsupported EVM chain key: ${key}`);
    }
  }
}

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

export function isPrivateKeyEvmWalletConfig(config: EvmWalletConfig): config is PrivateKeyEvmWalletConfig {
  return 'privateKey' in config && config.privateKey.startsWith('0x');
}

export function isBrowserExtensionEvmWalletConfig(config: EvmWalletConfig): config is BrowserExtensionEvmWalletConfig {
  return 'walletClient' in config && 'publicClient' in config;
}

export class EvmWalletProvider implements IEvmWalletProvider {
  public readonly chainType = 'EVM' as const;
  public readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient<Transport, Chain, Account>;
  private readonly defaults: EvmWalletDefaults;

  constructor(config: EvmWalletConfig) {
    this.defaults = config.defaults ?? {};

    if (isPrivateKeyEvmWalletConfig(config)) {
      const chain = getEvmViemChain(config.chainId);
      const transport = http(config.rpcUrl ?? chain.rpcUrls.default.http[0], this.defaults.transport);
      this.walletClient = createWalletClient({
        chain,
        transport,
        account: privateKeyToAccount(config.privateKey),
        ...this.defaults.walletClient,
      });
      this.publicClient = createPublicClient({ chain, transport, ...this.defaults.publicClient });
      return;
    }

    if (isBrowserExtensionEvmWalletConfig(config)) {
      this.walletClient = config.walletClient;
      this.publicClient = config.publicClient;
      if (this.defaults.transport || this.defaults.publicClient || this.defaults.walletClient) {
        console.warn(
          '[EvmWalletProvider] defaults.{transport,publicClient,walletClient} ignored in browser-extension mode.',
        );
      }
      return;
    }

    throw new Error('Invalid EVM wallet config');
  }

  async getWalletAddress(): Promise<Address> {
    return this.walletClient.account.address;
  }

  async sendTransaction(txData: EvmRawTransaction, options?: EvmSendTransactionPolicy): Promise<Hash> {
    const policy = shallowMerge(this.defaults.sendTransaction, options);
    const tx = { ...policy, ...txData } as Parameters<typeof this.walletClient.sendTransaction>[0];
    return this.walletClient.sendTransaction(tx);
  }

  async waitForTransactionReceipt(
    txHash: Hash,
    options?: EvmWaitForTransactionReceiptPolicy,
  ): Promise<EvmRawTransactionReceipt> {
    const policy = shallowMerge(this.defaults.waitForTransactionReceipt, options);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash, ...policy });
    return EvmWalletProvider.serializeReceipt(receipt);
  }

  private static serializeReceipt(receipt: TransactionReceipt): EvmRawTransactionReceipt {
    return {
      ...receipt,
      transactionIndex: receipt.transactionIndex.toString(),
      blockNumber: receipt.blockNumber.toString(),
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      gasUsed: receipt.gasUsed.toString(),
      contractAddress: receipt.contractAddress?.toString() ?? null,
      logs: receipt.logs.map(log => ({
        ...log,
        blockNumber: log.blockNumber.toString() as `0x${string}`,
        logIndex: log.logIndex.toString() as `0x${string}`,
        transactionIndex: log.transactionIndex.toString() as `0x${string}`,
      })),
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    };
  }
}
