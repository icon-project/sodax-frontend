import {
  type Address,
  type EvmChainId,
  type EvmRawTransaction,
  type EvmRawTransactionReceipt,
  getEvmViemChain,
  type Hash,
  type Hex,
  type IEvmWalletProvider,
} from '@new-world/sdk';
import {
  type WalletClient,
  type HttpTransport,
  type Chain,
  type Account,
  createWalletClient,
  http,
  type PublicClient,
  createPublicClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export class EvmWalletProvider implements IEvmWalletProvider {
  private readonly walletClient: WalletClient<HttpTransport, Chain, Account>;
  private readonly publicClient: PublicClient<HttpTransport>;

  constructor(privateKey: Hex, chainId: EvmChainId, rpcUrl?: string) {
    const chain = getEvmViemChain(chainId);
    const account = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl ?? chain.rpcUrls.default.http[0]),
    }) as WalletClient<HttpTransport, Chain, Account>;
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl ?? chain.rpcUrls.default.http[0]),
    });
  }

  getWalletAddress(): Address {
    return this.walletClient.account.address;
  }
  getWalletAddressBytes(): Hex {
    return this.walletClient.account.address;
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
    } satisfies EvmRawTransactionReceipt;
  }
}
