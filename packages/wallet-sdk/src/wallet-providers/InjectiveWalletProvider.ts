import { MsgExecuteContract, MsgExecuteContractCompat, toBase64 } from '@injectivelabs/sdk-ts';
import { toHex } from 'viem';
import { createTransaction, ChainGrpcWasmApi } from '@injectivelabs/sdk-ts';
import type { MsgBroadcaster } from '@injectivelabs/wallet-core';
import type { Hex, JsonObject, InjectiveCoin, IInjectiveWalletProvider, InjectiveEoaAddress } from '@sodax/types';
import { InjectiveExecuteResponse, type InjectiveRawTransaction } from '@sodax/types';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';

export class InjectiveWalletProvider implements IInjectiveWalletProvider {
  private client: MsgBroadcaster;
  public walletAddress: InjectiveEoaAddress | undefined;
  private chainGrpcWasmApi: ChainGrpcWasmApi;

  constructor({
    client,
    walletAddress,
  }: { client: MsgBroadcaster; walletAddress: InjectiveEoaAddress | undefined; rpcUrl: string }) {
    this.client = client;
    this.walletAddress = walletAddress;
    const endpoints = getNetworkEndpoints(Network.Mainnet);
    this.chainGrpcWasmApi = new ChainGrpcWasmApi(endpoints.grpc);
  }

  getRawTransaction(
    chainId: string,
    _: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    memo?: string,
  ): InjectiveRawTransaction {
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
      funds: funds as { amount: string; denom: string }[],
    });

    const txResult = await this.client.broadcastWithFeeDelegation({
      msgs: msgExec,
      injectiveAddress: this.walletAddress,
    });

    return InjectiveExecuteResponse.fromTxResponse(txResult);
  }

  async queryContractSmart(address: string, queryMsg: JsonObject): Promise<JsonObject> {
    return this.chainGrpcWasmApi.fetchSmartContractState(address, toBase64(queryMsg as object));
  }
}
