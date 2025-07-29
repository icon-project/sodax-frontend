import { CosmWasmClient, type JsonObject } from '@cosmjs/cosmwasm-stargate';
import type { Coin } from '@cosmjs/proto-signing';
import type { StdFee } from '@cosmjs/stargate';
import { Network } from '@injectivelabs/networks';
import { MsgBroadcasterWithPk, PrivateKey, MsgExecuteContract, createTransaction } from '@injectivelabs/sdk-ts';
import type { InjectiveNetworkEnv, InjectiveRawTransaction, Hex, IInjectiveWalletProvider } from '@sodax/types';
import { InjectiveExecuteResponse } from '@sodax/types';
import { DEFAULT_GAS_LIMIT } from '@injectivelabs/utils';
import { toHex } from 'viem';

// TODO implement browser extension based login
export interface InjectiveWalletConfig {
  mnemonics: string;
  network: InjectiveNetworkEnv;
  rpcUrl: string;
}
export class InjectiveWalletProvider implements IInjectiveWalletProvider {
  private config: InjectiveWalletConfig;
  private client: MsgBroadcasterWithPk;
  private cosmosClient: CosmWasmClient | undefined;
  private address: string;
  public pubkey: Uint8Array;

  constructor(config: InjectiveWalletConfig) {
    this.config = config;
    const privateKey = PrivateKey.fromMnemonic(config.mnemonics);
    this.pubkey = privateKey.toPublicKey().toPubKeyBytes();
    this.address = privateKey.toAddress().toBech32();
    this.client = new MsgBroadcasterWithPk({
      privateKey: privateKey,
      network: this.config.network === 'Mainnet' ? Network.Mainnet : Network.Testnet,
    });
  }

  getRawTransaction(
    chainId: string,
    _: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    memo?: string,
  ): Promise<InjectiveRawTransaction> {
    const msgExec = MsgExecuteContract.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg,
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

  async getCosmwasmClient(): Promise<CosmWasmClient> {
    if (this.cosmosClient === undefined) {
      this.cosmosClient = await CosmWasmClient.connect(this.config.rpcUrl);
    }
    return this.cosmosClient;
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
    fee: StdFee | 'auto' | number,
    memo?: string,
    funds?: Coin[],
  ): Promise<InjectiveExecuteResponse> {
    const msgExec = MsgExecuteContract.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg,
      funds: funds as { amount: string; denom: string }[],
    });
    const txHash = await this.client.broadcast({ msgs: msgExec, gas: { gas: DEFAULT_GAS_LIMIT } });
    return InjectiveExecuteResponse.fromTxResponse(txHash);
  }

  async queryContractSmart(address: string, queryMsg: JsonObject): Promise<JsonObject> {
    const contractClient = await CosmWasmClient.connect(this.config.rpcUrl);
    return contractClient.queryContractSmart(address, queryMsg);
  }
}
