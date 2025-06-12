import { bcs } from '@mysten/sui/bcs';
import type { SuiClient } from '@mysten/sui/client';
import type { Transaction, TransactionArgument } from '@mysten/sui/transactions';
import { type Address, toHex } from 'viem';
import type { Hex } from '@sodax/types';
import type { ISuiWalletProvider, SuiTransaction, SuiExecutionResult, SuiPaginatedCoins } from '@sodax/types';
import { signTransaction } from '@mysten/wallet-standard';

export class SuiWalletProvider implements ISuiWalletProvider {
  private client: SuiClient;
  private wallet: any;
  private account: any;
  constructor({ client, wallet, account }) {
    this.client = client;
    this.wallet = wallet;
    this.account = account;
  }
  async signAndExecuteTxn(txn: SuiTransaction): Promise<Hex> {
    const { bytes, signature } = await signTransaction(this.wallet, {
      transaction: txn,
      account: this.account,
      chain: this.account.chains[0],
    });

    const res = await this.client.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: {
        showRawEffects: true,
      },
    });

    return `0x${res.digest}`;
  }

  async viewContract(
    tx: Transaction,
    packageId: string,
    module: string,
    functionName: string,
    args: unknown[],
    typeArgs: string[] = [],
  ): Promise<SuiExecutionResult> {
    tx.moveCall({
      target: `${packageId}::${module}::${functionName}`,
      arguments: args as TransactionArgument[],
      typeArguments: typeArgs,
    });

    const txResults = await this.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: this.account.getPublicKey().toSuiAddress(),
    });

    if (txResults.results && txResults.results[0] !== undefined) {
      return txResults.results[0] as SuiExecutionResult;
    }
    throw Error(`transaction didn't return any values: ${JSON.stringify(txResults, null, 2)}`);
  }

  async getCoins(address: string, token: string): Promise<SuiPaginatedCoins> {
    return this.client.getCoins({ owner: address, coinType: token, limit: 10 });
  }

  getWalletAddress() {
    return this.account.getPublicKey().toSuiAddress() as `0x${string}`;
  }

  getWalletAddressBytes(): Hex {
    return toHex(bcs.Address.serialize(this.getWalletAddress()).toBytes());
  }
}
