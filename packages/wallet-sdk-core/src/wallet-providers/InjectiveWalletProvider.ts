import { MsgExecuteContract, MsgExecuteContractCompat } from '@injectivelabs/sdk-ts';
import { toHex } from 'viem';
import { createTransaction } from '@injectivelabs/sdk-ts';
import type { MsgBroadcaster } from '@injectivelabs/wallet-core';
import type { Hex, JsonObject, InjectiveCoin, IInjectiveWalletProvider, InjectiveEoaAddress } from '@sodax/types';
import { InjectiveExecuteResponse, type InjectiveRawTransaction } from '@sodax/types';

export class InjectiveWalletProvider implements IInjectiveWalletProvider {
  private client: MsgBroadcaster;
  public walletAddress: InjectiveEoaAddress | undefined;

  constructor({
    client,
    walletAddress,
  }: { client: MsgBroadcaster; walletAddress: InjectiveEoaAddress | undefined; rpcUrl: string }) {
    this.client = client;
    this.walletAddress = walletAddress;
  }

  getRawTransaction(
    chainId: string,
    _: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    memo?: string,
  ): Promise<InjectiveRawTransaction> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not found');
    }

    const msgExec = MsgExecuteContract.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds: [],
    });
    const { txRaw } = createTransaction({
      message: msgExec,
      memo: '',
      pubKey: Buffer.from(this.walletAddress).toString(),
      sequence: 0,
      accountNumber: 0,
      chainId: chainId,
    });

    const rawTx = {
      from: senderAddress as Hex,
      to: contractAddress as Hex,
      signedDoc: {
        bodyBytes: txRaw.bodyBytes,
        chainId: chainId,
        accountNumber: BigInt(0),
        authInfoBytes: txRaw.authInfoBytes,
      },
    };
    return Promise.resolve(rawTx);
  }

  async getWalletAddress(): Promise<InjectiveEoaAddress> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not found');
    }

    return Promise.resolve(this.walletAddress);
  }

  async getWalletAddressBytes(): Promise<Hex> {
    return toHex(Buffer.from(await this.getWalletAddress(), 'utf-8'));
  }

  async execute(
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    funds?: InjectiveCoin[],
  ): Promise<InjectiveExecuteResponse> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not found');
    }

    const msgExec = MsgExecuteContractCompat.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds: funds || [],
    });

    const txResult = await this.client.broadcastWithFeeDelegation({
      msgs: msgExec,
      injectiveAddress: this.walletAddress,
    });

    return InjectiveExecuteResponse.fromTxResponse(txResult);
  }
}
