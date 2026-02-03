import type { ChainId, EvmRawTransaction, EvmRawTransactionReceipt, IEvmWalletProvider } from '@sodax/types';
import type { Account, Address, Chain, Transport, Hash, PublicClient, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
import { sonic, avalanche, arbitrum, base, optimism, bsc, polygon, mainnet, kaia, lightlinkPhoenix } from 'viem/chains';
import {
  SONIC_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
  KAIA_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
} from '@sodax/types';

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

export function getEvmViemChain(id: ChainId): Chain {
  switch (id) {
    case SONIC_MAINNET_CHAIN_ID:
      return sonic;
    case AVALANCHE_MAINNET_CHAIN_ID:
      return avalanche;
    case ARBITRUM_MAINNET_CHAIN_ID:
      return arbitrum;
    case BASE_MAINNET_CHAIN_ID:
      return base;
    case OPTIMISM_MAINNET_CHAIN_ID:
      return optimism;
    case BSC_MAINNET_CHAIN_ID:
      return bsc;
    case POLYGON_MAINNET_CHAIN_ID:
      return polygon;
    case ETHEREUM_MAINNET_CHAIN_ID:
      return mainnet;
    case KAIA_MAINNET_CHAIN_ID:
      return kaia;
    case LIGHTLINK_MAINNET_CHAIN_ID:
      return lightlinkPhoenix;
    case HYPEREVM_MAINNET_CHAIN_ID:
      return hyper;
    default:
      throw new Error(`Unsupported EVM chain ID: ${id}`);
  }
}

export class EvmWalletProvider implements IEvmWalletProvider {
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
  chainId: ChainId;
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
