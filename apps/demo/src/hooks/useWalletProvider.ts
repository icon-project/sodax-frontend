import type {
  EvmRawTransaction,
  EvmRawTransactionReceipt,
  Hex,
  IEvmWalletProvider,
  SpokeChainId,
  EvmChainId,
} from '@new-world/sdk';
import { getEvmViemChain, isEvmInitializedConfig, spokeChainConfig } from '@new-world/sdk';
import { useMemo } from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  type Account,
  type Address,
  type Chain,
  type CustomTransport,
  type Hash,
  type HttpTransport,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { http } from 'wagmi';

export class EvmWalletProvider implements IEvmWalletProvider {
  private readonly _walletClient?: WalletClient<CustomTransport | HttpTransport, Chain, Account>;
  public readonly publicClient: PublicClient<CustomTransport | HttpTransport>;

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
    if (!this._walletClient.account) {
      throw new Error('Wallet account not initialized');
    }
    return this._walletClient.account.address;
  }

  getWalletAddressBytes(): Hex {
    if (!this._walletClient) {
      throw new Error('Wallet client not initialized');
    }
    if (!this._walletClient.account) {
      throw new Error('Wallet account not initialized');
    }
    return this._walletClient.account.address;
  }
}

export function useWalletProvider(xChainId: SpokeChainId, address: Address): EvmWalletProvider {
  const xChainType = spokeChainConfig[xChainId].chain.type;

  return useMemo(() => {
    switch (xChainType) {
      case 'evm': {
        return new EvmWalletProvider({
          walletClient: createWalletClient({
            chain: getEvmViemChain(xChainId as EvmChainId),
            transport: custom(window.ethereum),
            account: address,
          }),
          publicClient: createPublicClient({
            chain: getEvmViemChain(xChainId as EvmChainId),
            transport: http(),
          }),
        });
      }
      default:
        throw new Error(`Unsupported chain type: ${xChainType}`);
    }
  }, [xChainType, xChainId, address]);
}
