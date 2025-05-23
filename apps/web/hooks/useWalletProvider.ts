import type { EvmRawTransaction, EvmRawTransactionReceipt, Hex, IEvmWalletProvider } from '@new-world/sdk';
import { isEvmInitializedConfig } from '@new-world/sdk';
import { type XChainId, getXChainType, useWalletProviderOptions } from '@new-world/xwagmi';
import { useMemo } from 'react';
import type { Account, Address, Chain, CustomTransport, Hash, HttpTransport, PublicClient, WalletClient } from 'viem';

export class EvmWalletProvider implements IEvmWalletProvider {
  private readonly _walletClient?: WalletClient<CustomTransport | HttpTransport, Chain, Account>;
  public readonly publicClient: PublicClient<CustomTransport | HttpTransport>;

  // @ts-ignore
  constructor(payload) {
    if (isEvmInitializedConfig(payload)) {
      this._walletClient = payload.walletClient;
      this.publicClient = payload.publicClient;
    } else {
      throw new Error('Invalid configuration parameters');
    }
  }

  sendTransaction(evmRawTx: EvmRawTransaction) {
    if (!this._walletClient) {
      throw new Error('Wallet client not initialized');
    }
    return this._walletClient.sendTransaction(evmRawTx);
  }

  // export type EvmRawTransactionReceipt = {
  //   transactionHash: string; // 32-byte hash
  //   transactionIndex: string; // hex string, e.g., '0x1'
  //   blockHash: string; // 32-byte hash
  //   blockNumber: string; // hex string, e.g., '0x5BAD55'
  //   from: string; // 20-byte address
  //   to: string | null; // null if contract creation
  //   cumulativeGasUsed: string; // hex string
  //   gasUsed: string; // hex string
  //   contractAddress: string | null; // non-null only if contract creation
  //   logs: EvmRawLog[];
  //   logsBloom: string; // 256-byte bloom filter hex string
  //   status?: string; // '0x1' = success, '0x0' = failure (optional pre-Byzantium)
  //   type?: string; // '0x0', '0x1', or '0x2' for tx type
  //   effectiveGasPrice?: string; // hex string, only on EIP-1559 txs
  // };

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

  getWalletAddress(): Address {
    if (!this._walletClient) {
      throw new Error('Wallet client not initialized');
    }
    return this._walletClient.account.address;
  }

  getWalletAddressBytes(): Hex {
    if (!this._walletClient) {
      throw new Error('Wallet client not initialized');
    }
    return this._walletClient.account.address;
  }
}

export function useWalletProvider(xChainId: XChainId) {
  const xChainType = getXChainType(xChainId);
  const walletProviderOptions = useWalletProviderOptions(xChainId);

  return useMemo(() => {
    if (!walletProviderOptions) {
      return undefined;
    }

    switch (xChainType) {
      case 'EVM': {
        const { walletClient, publicClient } = walletProviderOptions;

        // @ts-ignore
        return new EvmWalletProvider({ walletClient, publicClient });
      }
      default:
        return undefined;
    }
  }, [xChainType, walletProviderOptions]);
}
