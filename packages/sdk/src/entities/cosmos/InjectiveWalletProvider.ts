import { CosmWasmClient, type JsonObject } from '@cosmjs/cosmwasm-stargate';
import type { Coin } from '@cosmjs/proto-signing';
import type { StdFee } from '@cosmjs/stargate';
import { Network } from '@injectivelabs/networks';
import { MsgBroadcasterWithPk, PrivateKey, MsgExecuteContract, createTransaction } from '@injectivelabs/sdk-ts';
import type { CosmosNetworkEnv, CWRawTransaction, Hex } from '../../index.js';
import { ExecuteResponse, type ICWWalletProvider } from './CWSpokeProvider.js';
import { DEFAULT_GAS_LIMIT } from '@injectivelabs/utils';
import { toHex } from 'viem';

// TODO implement browser extension based login
export interface InjectiveWalletConfig {
  mnemonics: string;
  network: CosmosNetworkEnv;
  rpcUrl: string;
}
export class InjectiveWalletProvider implements ICWWalletProvider {
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
  ): CWRawTransaction {
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

  async getCosmwasmClient(): Promise<CosmWasmClient> {
    if (this.cosmosClient === undefined) {
      this.cosmosClient = await CosmWasmClient.connect(this.config.rpcUrl);
    }
    return this.cosmosClient;
  }

  getWalletAddress(): string {
    return this.address;
  }

  getWalletAddressBytes(): Hex {
    return toHex(Buffer.from(this.address, 'utf-8'));
  }

  async execute(
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    fee: StdFee | 'auto' | number,
    memo?: string,
    funds?: Coin[],
  ): Promise<ExecuteResponse> {
    const msgExec = MsgExecuteContract.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg,
      funds: funds as { amount: string; denom: string }[],
    });
    const txHash = await this.client.broadcast({ msgs: msgExec, gas: { gas: DEFAULT_GAS_LIMIT } });
    return ExecuteResponse.fromTxResponse(txHash);
  }

  async queryContractSmart(address: string, queryMsg: JsonObject): Promise<JsonObject> {
    const contractClient = await CosmWasmClient.connect(this.config.rpcUrl);
    return contractClient.queryContractSmart(address, queryMsg);
  }
}
