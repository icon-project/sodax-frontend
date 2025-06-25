import { MsgExecuteContract, MsgExecuteContractCompat, MsgSend } from '@injectivelabs/sdk-ts';
import { toHex } from 'viem';
import { fromBase64, toBase64, createTransaction } from '@injectivelabs/sdk-ts';
import type { ChainGrpcWasmApi } from '@injectivelabs/sdk-ts';

import type { MsgBroadcaster } from '@injectivelabs/wallet-ts';
import type { Hex, JsonObject, InjectiveCoin, IInjectiveWalletProvider, InjectiveEoaAddress } from '@sodax/types';
import { InjectiveExecuteResponse, type CWRawTransaction } from '@sodax/types';

globalThis.Buffer = Buffer;
window.Buffer = Buffer;

export class InjectiveWalletProvider implements IInjectiveWalletProvider {
  private client: MsgBroadcaster;
  public walletAddress: InjectiveEoaAddress | undefined;
  public chainGrpcWasmApi: ChainGrpcWasmApi;

  getRawTransaction(
    chainId: string,
    _: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    memo?: string,
  ): CWRawTransaction {
    if (!this.walletAddress) {
      throw new Error('Wallet address not found');
    }

    const msgExec = MsgExecuteContract.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg,
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
    return {
      from: senderAddress as Hex,
      to: contractAddress as Hex,
      signedDoc: {
        bodyBytes: txRaw.bodyBytes,
        chainId: chainId,
        accountNumber: BigInt(0),
        authInfoBytes: txRaw.authInfoBytes,
      },
    };
  }

  constructor({
    client,
    walletAddress,
    chainGrpcWasmApi,
  }: { client: MsgBroadcaster; walletAddress: InjectiveEoaAddress | undefined; chainGrpcWasmApi: ChainGrpcWasmApi }) {
    this.client = client;
    this.walletAddress = walletAddress;
    this.chainGrpcWasmApi = chainGrpcWasmApi;
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
    fee: 'auto' | number,
    memo?: string,
    funds?: InjectiveCoin[],
  ): Promise<InjectiveExecuteResponse> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not found');
    }

    const msgExec = MsgExecuteContractCompat.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg,
      funds: funds as { amount: string; denom: string }[],
    });

    console.log('msgExec', msgExec);
    const txResult = await this.client.broadcastWithFeeDelegation({
      msgs: msgExec,
      injectiveAddress: this.walletAddress,
    });

    console.log('txResult', txResult);

    return InjectiveExecuteResponse.fromTxResponse(txResult);
  }

  async queryContractSmart(address: string, queryMsg: JsonObject): Promise<JsonObject> {
    const response: any = await this.chainGrpcWasmApi.fetchSmartContractState(address, toBase64(queryMsg));
    return fromBase64(response.data);
  }
}
