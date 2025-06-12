import type { EvmRawTransaction, EvmRawTransactionReceipt, Hex, IEvmWalletProvider } from '@sodax/types';
import type { Account, Address, Chain, CustomTransport, Hash, HttpTransport, PublicClient, WalletClient } from 'viem';

export class EvmWalletProvider implements IEvmWalletProvider {
  private readonly _walletClient?: WalletClient<CustomTransport | HttpTransport, Chain, Account>;
  public readonly publicClient: PublicClient<CustomTransport | HttpTransport>;

  constructor(
    publicClient: PublicClient<CustomTransport | HttpTransport>,
    walletClient: WalletClient<CustomTransport | HttpTransport, Chain, Account> | undefined,
  ) {
    this._walletClient = walletClient;
    this.publicClient = publicClient;
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
