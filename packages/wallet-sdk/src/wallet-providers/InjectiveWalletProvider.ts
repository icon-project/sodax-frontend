import { MsgExecuteContract, MsgExecuteContractCompat, MsgSend } from '@injectivelabs/sdk-ts';
import { toHex } from 'viem';
import { createTransaction } from '@injectivelabs/sdk-ts';

import type { MsgBroadcaster } from '@injectivelabs/wallet-ts';
import type { Hex, JsonObject, InjectiveCoin, IInjectiveWalletProvider, InjectiveEoaAddress } from '@sodax/types';
import { InjectiveExecuteResponse, type CWRawTransaction } from '@sodax/types';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

export class InjectiveWalletProvider implements IInjectiveWalletProvider {
  private client: MsgBroadcaster;
  public walletAddress: InjectiveEoaAddress | undefined;
  private rpcUrl: string;

  constructor({
    client,
    walletAddress,
    rpcUrl,
  }: { client: MsgBroadcaster; walletAddress: InjectiveEoaAddress | undefined; rpcUrl: string }) {
    this.client = client;
    this.walletAddress = walletAddress;
    this.rpcUrl = rpcUrl;
  }

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

    const txResult = await this.client.broadcastWithFeeDelegation({
      msgs: msgExec,
      injectiveAddress: this.walletAddress,
    });

    return InjectiveExecuteResponse.fromTxResponse(txResult);
  }

  async queryContractSmart(address: string, queryMsg: JsonObject): Promise<JsonObject> {
    const contractClient = await CosmWasmClient.connect(this.rpcUrl);
    return contractClient.queryContractSmart(address, queryMsg);
  }
}
