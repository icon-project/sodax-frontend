import { bcs } from '@mysten/sui/bcs';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import type { Transaction, TransactionArgument } from '@mysten/sui/transactions';
import { toHex } from 'viem';
import type { Address, Hex } from '@sodax/sdk';
import type { ISuiWalletProvider } from '@sodax/sdk';
import type { SuiTransaction, SuiExecutionResult, SuiPaginatedCoins } from '@sodax/sdk';

export class SuiWalletProvider implements ISuiWalletProvider {
  private keyPair: Ed25519Keypair;
  private client: SuiClient;
  constructor(rpcUrl: string, mnemonics: string) {
    this.client = new SuiClient({
      url: rpcUrl,
    });

    this.keyPair = Ed25519Keypair.deriveKeypair(mnemonics);
  }
  async signAndExecuteTxn(txn: SuiTransaction): Promise<string> {
    const res = await this.client.signAndExecuteTransaction({
      transaction: txn as unknown as Transaction,
      signer: this.keyPair,
    });
    return res.digest;
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
      sender: this.keyPair.getPublicKey().toSuiAddress(),
    });

    if (txResults.results && txResults.results[0] !== undefined) {
      return txResults.results[0] as SuiExecutionResult;
    }
    throw Error(`transaction didn't return any values: ${JSON.stringify(txResults, null, 2)}`);
  }

  async getCoins(address: string, token: string): Promise<SuiPaginatedCoins> {
    return this.client.getCoins({ owner: address, coinType: token, limit: 10 });
  }

  async getWalletAddress(): Promise<Address> {
    return Promise.resolve(this.keyPair.toSuiAddress() as Address);
  }

  async getWalletAddressBytes(): Promise<Hex> {
    const walletAddress = await this.getWalletAddress();
    return toHex(bcs.Address.serialize(walletAddress).toBytes());
  }
}
