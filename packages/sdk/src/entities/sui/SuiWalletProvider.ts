import { bcs } from '@mysten/sui/bcs';
import { type PaginatedCoins, SuiClient, type SuiExecutionResult } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import type { Transaction, TransactionArgument } from '@mysten/sui/transactions';
import { toHex } from 'viem';
import type { Hex } from '../../types.js';
import type { WalletAddressProvider } from '../index.js';

export class SuiWalletProvider implements WalletAddressProvider {
  private keyPair: Ed25519Keypair;
  private client: SuiClient;
  constructor(rpcUrl: string, mnemonics: string) {
    this.client = new SuiClient({
      url: rpcUrl,
    });

    this.keyPair = Ed25519Keypair.deriveKeypair(mnemonics);
  }
  async signAndExecuteTxn(txn: Transaction): Promise<Hex> {
    const res = await this.client.signAndExecuteTransaction({ transaction: txn, signer: this.keyPair });
    return `0x${res.digest}`;
  }

  async viewContract(
    tx: Transaction,
    packageId: string,
    module: string,
    functionName: string,
    args: TransactionArgument[],
    typeArgs: string[] = [],
  ): Promise<SuiExecutionResult> {
    tx.moveCall({
      target: `${packageId}::${module}::${functionName}`,
      arguments: args,
      typeArguments: typeArgs,
    });

    const txResults = await this.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: this.keyPair.getPublicKey().toSuiAddress(),
    });

    if (txResults.results && txResults.results[0] !== undefined) {
      return txResults.results[0];
    }
    throw Error(`transaction didn't return any values: ${JSON.stringify(txResults, null, 2)}`);
  }

  async getCoins(address: string, token: string): Promise<PaginatedCoins> {
    return this.client.getCoins({ owner: address, coinType: token, limit: 10 });
  }

  getWalletAddress(): string {
    return this.keyPair.toSuiAddress();
  }

  getWalletAddressBytes(): Hex {
    return toHex(bcs.Address.serialize(this.getWalletAddress()).toBytes());
  }
}
