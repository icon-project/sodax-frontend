import type {
  EvmChainKey,
  EvmRawTransaction,
  EvmRawTransactionReceipt,
  IEvmWalletProvider,
} from '@sodax/types';
import type { Account, Address, Chain, Transport, Hash, PublicClient, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
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

// HyperEVM chain is not supported by viem, so we need to define it manually
export const hyper = /*#__PURE__*/ defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVMScan',
      url: 'https://hyperevmscan.io/',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 13051,
    },
  },
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

export class EvmWalletProvider implements IEvmWalletProvider {
  public readonly chainType = 'EVM' as const;
  private readonly walletClient: WalletClient<Transport, Chain, Account>;
  public readonly publicClient: PublicClient;

  constructor(config: EvmWalletConfig) {
    if (isPrivateKeyEvmWalletConfig(config)) {
      const chain = getEvmViemChain(config.chainId);
      this.walletClient = createWalletClient({
        chain,
        transport: http(config.rpcUrl ?? chain.rpcUrls.default.http[0]),
        account: privateKeyToAccount(config.privateKey),
      });
      this.publicClient = createPublicClient({
        chain,
        transport: http(config.rpcUrl ?? chain.rpcUrls.default.http[0]),
      });
    } else if (isBrowserExtensionEvmWalletConfig(config)) {
      this.walletClient = config.walletClient;
      this.publicClient = config.publicClient;
    } else {
      throw new Error('Invalid EVM wallet config');
    }
  }

  async sendTransaction(evmRawTx: EvmRawTransaction): Promise<Hash> {
    return this.walletClient.sendTransaction(evmRawTx);
  }

  async waitForTransactionReceipt(txHash: Hash): Promise<EvmRawTransactionReceipt> {
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
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

  async getWalletAddress(): Promise<Address> {
    return this.walletClient.account.address;
  }
}

/**
 * EVM Wallet Configuration Types
 */

export type PrivateKeyEvmWalletConfig = {
  privateKey: `0x${string}`;
  chainId: EvmChainKey;
  rpcUrl?: `http${string}`;
};

export type BrowserExtensionEvmWalletConfig = {
  walletClient: WalletClient<Transport, Chain, Account>;
  publicClient: PublicClient;
};

export type EvmWalletConfig = PrivateKeyEvmWalletConfig | BrowserExtensionEvmWalletConfig;

/**
 * EVM Type Guards
 */

export function isPrivateKeyEvmWalletConfig(config: EvmWalletConfig): config is PrivateKeyEvmWalletConfig {
  return 'privateKey' in config && config.privateKey.startsWith('0x');
}

export function isBrowserExtensionEvmWalletConfig(config: EvmWalletConfig): config is BrowserExtensionEvmWalletConfig {
  return 'walletClient' in config && 'publicClient' in config;
}
