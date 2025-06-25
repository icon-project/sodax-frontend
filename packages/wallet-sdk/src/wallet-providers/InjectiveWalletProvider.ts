import { MsgExecuteContract, MsgExecuteContractCompat, MsgSend } from '@injectivelabs/sdk-ts';
import { toHex } from 'viem';

import type { MsgBroadcaster } from '@injectivelabs/wallet-ts';
import type {
  Hex,
  Hash,
  JsonObject,
  InjectiveCoin,
  IInjectiveWalletProvider,
  InjectiveEoaAddress,
  InjectiveExecuteResponse,
} from '@sodax/types';

globalThis.Buffer = Buffer;
window.Buffer = Buffer;

export class InjectiveWalletProvider implements IInjectiveWalletProvider {
  private client: MsgBroadcaster;
  public walletAddress: InjectiveEoaAddress | undefined;

  constructor({ client, walletAddress }: { client: MsgBroadcaster; walletAddress: InjectiveEoaAddress | undefined }) {
    this.client = client;
    this.walletAddress = walletAddress;
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

    const testValues = [Buffer.from('hello'), 'hello', new Uint8Array([1, 2, 3])];

    testValues.forEach(value => {
      console.log(value, 'is Buffer? ->', Buffer.isBuffer(value));
    });

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

    // const msg1 = MsgSend.fromJSON({
    //   amount: {
    //     denom: 'inj',
    //     amount: '10000000000000000',
    //   },
    //   srcInjectiveAddress: this.walletAddress,
    //   dstInjectiveAddress: this.walletAddress,
    // });

    // const txResult = await this.client.broadcast({
    //   injectiveAddress: this.walletAddress,
    //   msgs: msg1,
    // });

    return txResult.txHash as Hash;
  }

  async queryContractSmart(address: string, queryMsg: JsonObject): Promise<JsonObject> {
    const contractClient = await CosmWasmClient.connect(this.config.rpcUrl);
    return contractClient.queryContractSmart(address, queryMsg);
  }
}
