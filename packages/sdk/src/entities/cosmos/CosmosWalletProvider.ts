import { type JsonObject, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { type Coin, DirectSecp256k1HdWallet, type OfflineSigner, encodePubkey } from '@cosmjs/proto-signing';
import { GasPrice, type StdFee } from '@cosmjs/stargate';

import { AuthInfo, SignerInfo, TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx.js';
import type { Any } from 'cosmjs-types/google/protobuf/any.js';
import { toHex } from 'viem';
import type { CWRawTransaction, CosmosNetworkEnv, Hex } from '../../index.js';
import { ExecuteResponse, type ICWWalletProvider } from './CWSpokeProvider.js';

// TODO implement browser extension based login
export interface CosmosWalletConfig {
  prefix: string;
  mnemonics: string;
  network: CosmosNetworkEnv;
  rpcUrl: string;
  gasPrice: string;
}

export class CosmosWalletProvider implements ICWWalletProvider {
  private client: SigningCosmWasmClient | undefined;
  private config: CosmosWalletConfig;
  private wallet: OfflineSigner | undefined;
  private address: string | undefined;
  public pubkey: Uint8Array | undefined;

  constructor(config: CosmosWalletConfig) {
    this.config = config;
  }
  getRawTransaction(
    chainId: string,
    prefix: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    memo?: string,
  ): CWRawTransaction {
    const msgExecuteContract = MsgExecuteContract.fromPartial({
      sender: senderAddress,
      contract: contractAddress,
      msg: msg,
      funds: [],
    });
    const msgAny: Any = {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.encode(msgExecuteContract).finish(),
    };
    const txBody = TxBody.fromPartial({
      messages: [msgAny],
      memo: memo || '',
    });
    const bodyBytes = TxBody.encode(txBody).finish();
    if (!this.pubkey) {
      throw new Error('[CosmosWalletProvider] ppubkey is undefined');
    }
    const signerInfo = SignerInfo.fromPartial({
      publicKey: encodePubkey({
        type: 'tendermint/PubKeySecp256k1',
        value: Buffer.from(this.pubkey).toString('base64'),
      }),
      sequence: BigInt(0),
    });
    const authInfo = AuthInfo.fromPartial({
      signerInfos: [signerInfo],
    });
    const authInfoBytes = AuthInfo.encode(authInfo).finish();

    return {
      from: senderAddress as Hex,
      to: contractAddress as Hex,
      signedDoc: {
        bodyBytes: bodyBytes,
        chainId: chainId,
        accountNumber: BigInt(0),
        authInfoBytes: authInfoBytes,
      },
    };
  }

  async getClient(): Promise<SigningCosmWasmClient> {
    if (this.client === undefined) {
      const wallet = await this.getWallet();
      this.client = await SigningCosmWasmClient.connectWithSigner(this.config.rpcUrl, wallet, {
        gasPrice: GasPrice.fromString(this.config.gasPrice), // Adjust according to your chain
      });
    }
    return this.client;
  }

  async getWallet(): Promise<OfflineSigner> {
    if (this.wallet === undefined) {
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.config.mnemonics, {
        prefix: this.config.prefix, // Change this according to your chain
      });
      const accounts = await this.wallet.getAccounts();
      if (accounts.length > 0 && accounts[0]) {
        this.address = accounts[0].address;
        this.pubkey = accounts[0].pubkey;
      } else {
        throw Error('Failed to get Account');
      }
    }
    return this.wallet;
  }

  async getWalletAddress(): Promise<string> {
    if (this.address) {
      return Promise.resolve(this.address);
    }
    throw Error('Address Not Set');
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
  ): Promise<ExecuteResponse> {
    const client = await this.getClient();
    const res = await client.execute(senderAddress, contractAddress, msg, fee, memo, funds);
    return ExecuteResponse.fromExecResult(res);
  }
  async queryContractSmart(address: string, queryMsg: JsonObject): Promise<JsonObject> {
    const client = await this.getClient();
    return client.queryContractSmart(address, queryMsg);
  }
}
