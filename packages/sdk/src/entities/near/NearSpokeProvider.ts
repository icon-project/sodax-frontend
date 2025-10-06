import { Account } from '@near-js/accounts';
import { JsonRpcProvider } from '@near-js/providers';
import { KeyPairSigner } from '@near-js/signers';
import type { KeyPairString } from '@near-js/crypto';
import type { FinalExecutionOutcome } from '@near-js/types';
import { fromHex, toHex, type Hex } from 'viem';
import { actionCreators, type Transaction as NearTransaction } from '@near-js/transactions';
import type { NearSpokeChainConfig, RateLimitConfig } from '../../types.js';

export type QueryResponse = string | number | boolean | object | undefined;
export type CallResponse = string | number | object | bigint|boolean;

export interface TransferArgs {
  token: string;
  to: Array<Number>;
  amount: string;
  data: Array<Number>;
}

export interface SendMsgArgs {
  dst_chain_id: number;
  dst_address: Array<Number>;
  payload: Array<Number>;
}

export interface FillData {
  token: string;
  fill_id: bigint;
  intent_hash: Hex;
  solver: Hex;
  receiver: string;
  amount: bigint;
}

export interface FillIntent {
  token: Array<Number>;
  fill_id: string;
  intent_hash: Array<Number>;
  solver: Array<Number>;
  receiver: Array<Number>;
  amount: string;
}

export interface FillIntentArgs {
  fill:FillIntent,
}

export interface FTTransferCallArgs {
  receiver_id: string;
  amount: string;
  memo?: string;
  msg?: string;
}

export interface NearTransferArgs {
  to: Array<Number>;
  amount: string;
  data: Array<Number>;
}

export interface InitArgs {
  connection: string;
  rate_limit: string;
  hub_chain_id: number;
  hub_asset_manager: number[];
}
export interface SetHubConfig {
  hub_chain_id: number;
  hub_asset_manager: number[];
}

export type ContractArgs =
  | TransferArgs
  | InitArgs
  | SetHubConfig
  | FTTransferCallArgs
  | NearTransferArgs
  | SendMsgArgs
  | FillIntentArgs;

export interface CallContractParams {
  contractId: string;
  method: string;
  args: ContractArgs;
  gas?: bigint;
  deposit?: bigint;
}

export interface INearWalletProvider {
  callContract(params: CallContractParams): Promise<CallResponse>;
  queryContract(contractId: string, method: string, args: {}): Promise<QueryResponse>;
  getWalletAddress: () => Promise<string>;
  getWalletAddressBytes: () => Promise<Hex>;
  getRawTransaction(params: CallContractParams): Promise<NearTransaction>;
  signAndSubmitTxn(tx: NearTransaction): Promise<FinalExecutionOutcome>;
}

export class LocalWalletProvider implements INearWalletProvider {
  account: Account;
  rpcProvider: JsonRpcProvider;

  constructor(rpc: string, accountId: string, secret: string) {
    this.rpcProvider = new JsonRpcProvider({ url: rpc });
    const signer = KeyPairSigner.fromSecretKey(secret as KeyPairString);
    this.account = new Account(accountId, this.rpcProvider, signer);
  }
  async getWalletAddress(): Promise<string> {
    return this.account.accountId;
  }
  async getWalletAddressBytes(): Promise<Hex> {
    return toHex(Buffer.from(this.account.accountId, 'utf-8'));
  }
  async callContract(params: CallContractParams) {
    return await this.account.callFunction({
      contractId: params.contractId,
      methodName: params.method,
      args: params.args,
      deposit: params.deposit,
      gas: params.gas,
      waitUntil: 'FINAL',
    });
  }

  queryContract(contractId: string, method: string, args: {}): Promise<QueryResponse> {
    return this.rpcProvider.callFunction(contractId, method, args);
  }

  async getRawTransaction(params: CallContractParams): Promise<NearTransaction> {
    const pubKey = await this.account.getSigner()?.getPublicKey();
    if (pubKey) {
      return this.account.createTransaction(
        params.contractId,
        [actionCreators.functionCall(params.method, params.args, params.gas, params.deposit)],
        pubKey,
      );
    }
    throw new Error('Pubkey not set');
  }
  async signAndSubmitTxn(transaction: NearTransaction) {
    return this.account.signAndSendTransaction({ ...transaction, throwOnFailure: true, waitUntil: 'FINAL' });
  }
  async deployContract(buff: Uint8Array) {
    const res = await this.account.deployContract(buff);
    return res;
  }
}

export class NearSpokeProvider {
  walletProvider: INearWalletProvider;
  chainConfig: NearSpokeChainConfig;
  constructor(walletProvider: INearWalletProvider, config: NearSpokeChainConfig) {
    this.walletProvider = walletProvider;
    this.chainConfig = config;
  }

  transfer(params: TransferArgs, deposit: bigint = BigInt('1'), gas: bigint = BigInt('300000000000000')) {
    if (this.isNative(params.token)) {
      deposit = BigInt(params.amount);
      return this.depositNear(params, deposit, gas);
    }
    return this.depositToken(params, deposit, gas);
  }

  private depositNear(params: TransferArgs, deposit: bigint, gas: bigint): Promise<NearTransaction> {
    return this.walletProvider.getRawTransaction({
      contractId: this.chainConfig.addresses.assetManager,
      method: 'transfer',
      args: { to: params.to, amount: params.amount, data: params.data },
      deposit,
      gas,
    });
  }

  private depositToken(params: TransferArgs, deposit: bigint, gas: bigint) {
    return this.walletProvider.getRawTransaction({
      contractId: params.token,
      method: 'ft_transfer_call',
      args: {
        receiver_id: this.chainConfig.addresses.assetManager,
        amount: params.amount.toString(),
        memo: '',
        msg: JSON.stringify({
          to: params.to,
          data: params.data,
        }),
      },
      deposit: deposit,
      gas: gas,
    });
  }

  sendMessage(params: SendMsgArgs, deposit: bigint = BigInt('0'), gas: bigint = BigInt('300000000000000')) {
    return this.walletProvider.getRawTransaction({
      contractId: this.chainConfig.addresses.connection,
      method: 'send_message',
      args: params,
      deposit,
      gas,
    });
  }

  isNative(token: string) {
    return token === 'NEAR';
  }

  getBalance(token: string) {
    if (this.isNative(token)) {
      return this.walletProvider.queryContract(this.chainConfig.addresses.assetManager, 'get_balance', {});
    }
    return this.walletProvider.queryContract(token, 'ft_balance_of', {
      account_id: this.chainConfig.addresses.assetManager,
    });
  }
  async submit(transaction: NearTransaction): Promise<Hex> {
    const res = await this.walletProvider.signAndSubmitTxn(transaction);
    return res.transaction_outcome.id as Hex;
  }

  async getRateLimit(token: string): Promise<RateLimitConfig> {
    const res = (await this.walletProvider.queryContract(this.chainConfig.addresses.rateLimit, 'get_rate_limit', {
      token: token
    })) as { max_available: number; available: number; rate_per_second: number } | undefined;
    if (res == null || res === undefined) {
      return {
        maxAvailable: 0,
        available: 0,
        ratePerSecond: 0,
      };
    }
    return {
      maxAvailable: res.max_available,
      available: res.available,
      ratePerSecond: res.rate_per_second,
    } as RateLimitConfig;
  }

  private toFillIntent(fillData: FillData): FillIntent {
    return {
      amount: fillData.amount.toString(),
      fill_id: fillData.fill_id.toString(),
      intent_hash: Array.from(fromHex(fillData.intent_hash, 'bytes')),
      receiver: Array.from(Buffer.from(fillData.receiver, 'utf-8')),
      solver: Array.from(fromHex(fillData.solver, 'bytes')),
      token: Array.from(Buffer.from(fillData.token, 'utf-8')),
    } as FillIntent;
  }

  async fillIntent(fillData: FillData, deposit: bigint = BigInt('1'), gas: bigint = BigInt('300000000000000')) {
    if (this.isNative(fillData.token)) {
      deposit=BigInt(fillData.amount);
      return this.walletProvider.getRawTransaction({
        contractId: this.chainConfig.addresses.intentFiller,
        method: 'fill_intent',
        args: {fill:this.toFillIntent(fillData)},
        deposit: deposit,
        gas: gas,
      });
    }
    return this.walletProvider.getRawTransaction({
      contractId: fillData.token,
      method: 'ft_transfer_call',
      args: {
        receiver_id: this.chainConfig.addresses.intentFiller,
        amount: fillData.amount.toString(),
        memo: '',
        msg: JSON.stringify(this.toFillIntent(fillData)),
      },
      deposit: deposit,
      gas: gas,
    });
  }
}