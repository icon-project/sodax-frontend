import type { EvmRawTransaction, EvmRawTransactionReceipt, Hex, IEvmWalletProvider } from '@sodax/sdk';
import { isEvmInitializedConfig } from '@sodax/sdk';
import { type XChainId, getXChainType, useWalletProviderOptions } from '@sodax/xwagmi';
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
