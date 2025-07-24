import { getNetworkEndpoints, Network } from '@injectivelabs/networks';
import {
  MsgBroadcasterWithPk,
  PrivateKey,
  MsgExecuteContract,
  createTransaction,
  ChainGrpcWasmApi,
  toBase64,
} from '@injectivelabs/sdk-ts';
import type {
  InjectiveNetworkEnv,
  InjectiveRawTransaction,
  Hex,
  IInjectiveWalletProvider,
  InjectiveCoin,
  JsonObject,
} from '@sodax/types';
import { InjectiveExecuteResponse } from '@sodax/types';
import { DEFAULT_GAS_LIMIT } from '@injectivelabs/utils';
import { toHex } from 'viem';

// TODO implement browser extension based login
export interface InjectiveWalletConfig {
  mnemonics: string;
  network: InjectiveNetworkEnv;
}
export class InjectiveWalletProvider implements IInjectiveWalletProvider {
  public pubkey: Uint8Array;

  private config: InjectiveWalletConfig;
  private client: MsgBroadcasterWithPk;
  private address: string;
  private chainGrpcWasmApi: ChainGrpcWasmApi;

  constructor(config: InjectiveWalletConfig) {
    this.config = config;
    const privateKey = PrivateKey.fromMnemonic(config.mnemonics);
    this.pubkey = privateKey.toPublicKey().toPubKeyBytes();
    this.address = privateKey.toAddress().toBech32();
    this.client = new MsgBroadcasterWithPk({
      privateKey: privateKey,
      network: this.config.network === 'Mainnet' ? Network.Mainnet : Network.Testnet,
    });
    const endpoints = getNetworkEndpoints(Network.Mainnet);
    this.chainGrpcWasmApi = new ChainGrpcWasmApi(endpoints.grpc);
  }

  getRawTransaction(
    chainId: string,
    _: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
  ): InjectiveRawTransaction {
    const msgExec = MsgExecuteContract.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds: [],
    });
    const { txRaw } = createTransaction({
      message: msgExec,
      memo: '',
      pubKey: Buffer.from(this.pubkey).toString(),
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

  async getWalletAddress(): Promise<string> {
    return Promise.resolve(this.address);
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
    const msgExec = MsgExecuteContract.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds: funds,
    });
    const txHash = await this.client.broadcast({ msgs: msgExec, gas: { gas: DEFAULT_GAS_LIMIT } });
    return InjectiveExecuteResponse.fromTxResponse(txHash);
  }

  async queryContractSmart(address: string, queryMsg: JsonObject): Promise<JsonObject> {
    return this.chainGrpcWasmApi.fetchSmartContractState(address, toBase64(queryMsg as object));
  }
}
