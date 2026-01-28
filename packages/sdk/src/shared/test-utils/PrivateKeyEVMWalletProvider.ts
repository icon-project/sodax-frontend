/**
 * Simple PrivateKeyEVMWalletProvider for testing purposes
 * 
 * This is a minimal implementation of IEvmWalletProvider that only handles
 * private key-based EVM wallets. It's used for testing in the SDK and
 * does not depend on wallet-sdk-core.
 */

import type {
  IEvmWalletProvider,
  EvmRawTransaction,
  EvmRawTransactionReceipt,
  Address,
  Hash,
  ChainId,
  Hex,
} from '@sodax/types';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, createPublicClient, http, type Account, type Chain, type Transport, type PublicClient, type WalletClient } from 'viem';
import { sonic, avalanche, arbitrum, base, optimism, bsc, polygon, mainnet } from 'viem/chains';
import {
  SONIC_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
} from '@sodax/types';

/**
 * Maps chain IDs to viem chain objects
 */
function getEvmViemChain(id: ChainId): Chain {
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
    default:
      throw new Error(`Unsupported EVM chain ID: ${id}`);
  }
}

export type PrivateKeyEVMWalletProviderConfig = {
  privateKey: Hex;
  chainId: ChainId;
  rpcUrl?: `http${string}`;
};

/**
 * Simple EVM wallet provider that only handles private key-based wallets
 * Used for testing purposes in the SDK
 */
export class PrivateKeyEVMWalletProvider implements IEvmWalletProvider {
  private readonly walletClient: WalletClient<Transport, Chain, Account>;
  public readonly publicClient: PublicClient<Transport, Chain>;

  constructor(config: PrivateKeyEVMWalletProviderConfig) {
    const chain = getEvmViemChain(config.chainId);
    const account = privateKeyToAccount(config.privateKey);
    const rpcUrl = config.rpcUrl ?? chain.rpcUrls.default.http[0];

    this.walletClient = createWalletClient({
      chain,
      transport: http(rpcUrl),
      account,
    });

    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
  }

  async getWalletAddress(): Promise<Address> {
    return this.walletClient.account.address;
  }

  async sendTransaction(evmRawTx: EvmRawTransaction): Promise<Hash> {
    return this.walletClient.sendTransaction(evmRawTx);
  }

  async waitForTransactionReceipt(txHash: Hash): Promise<EvmRawTransactionReceipt> {
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return {
      transactionHash: receipt.transactionHash,
      transactionIndex: receipt.transactionIndex.toString(),
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber.toString(),
      from: receipt.from,
      to: receipt.to,
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      gasUsed: receipt.gasUsed.toString(),
      contractAddress: receipt.contractAddress?.toString() ?? null,
      logs: receipt.logs.map(log => ({
        address: log.address,
        topics: log.topics as [Hex, ...Hex[]] | [],
        data: log.data,
        blockHash: log.blockHash ?? null,
        blockNumber: log.blockNumber.toString() as `0x${string}` | null,
        logIndex: log.logIndex.toString() as `0x${string}` | null,
        transactionHash: log.transactionHash ?? null,
        transactionIndex: log.transactionIndex.toString() as `0x${string}` | null,
        removed: log.removed ?? false,
      })),
      logsBloom: receipt.logsBloom,
      status: receipt.status === 'success' ? '0x1' : '0x0',
      type: receipt.type ? receipt.type.toString() : undefined,
      effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
    };
  }
}
