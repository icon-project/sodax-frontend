import { Account } from '@near-js/accounts';
import { JsonRpcProvider } from '@near-js/providers';
import { KeyPairSigner } from '@near-js/signers';
import type { KeyPairString } from '@near-js/crypto';
import { fromHex, toHex, type Hex } from 'viem';
import { actionCreators } from '@near-js/transactions';
import type { RateLimitConfig } from '../../types.js';
import type {
  CallContractParams,
  FillData,
  FillIntent,
  INearWalletProvider,
  NearRawTransaction,
  NearSpokeChainConfig,
  SendMsgArgs,
  TransferArgs,
  WalletAddressProvider,
} from '@sodax/types';
import type { IRawSpokeProvider, ISpokeProvider } from '../Providers.js';
export type QueryResponse = string | number | boolean | object | undefined;
export type CallResponse = string | number | object | bigint | boolean;

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

  queryContract(contractId: string, method: string, args: {}): Promise<QueryResponse> {
    return this.rpcProvider.callFunction(contractId, method, args);
  }

  async getRawTransaction(params: CallContractParams): Promise<NearRawTransaction> {
    return {
      signerId: this.account.accountId,
      params: params,
    } satisfies NearRawTransaction;
  }

  async signAndSubmitTxn(transaction: NearRawTransaction) {
    const publicKey = await this.account.getSigner()?.getPublicKey();

    if (!publicKey) {
      throw new Error('Signer not found');
    }

    const nearTx = await this.account.createTransaction(
      transaction.params.contractId,
      [
        actionCreators.functionCall(
          transaction.params.method,
          transaction.params.args,
          transaction.params.gas,
          transaction.params.deposit,
        ),
      ],
      publicKey,
    );

    const res = await this.account.signAndSendTransaction({ ...nearTx, throwOnFailure: true, waitUntil: 'FINAL' });
    return res.transaction_outcome.id as Hex;
  }
  async deployContract(buff: Uint8Array) {
    const res = await this.account.deployContract(buff);
    return res;
  }
}

export class NearBaseSpokeProvider {
  public readonly chainConfig: NearSpokeChainConfig;
  public readonly rpcProvider: JsonRpcProvider;

  constructor(chainConfig: NearSpokeChainConfig) {
    this.chainConfig = chainConfig;
    this.rpcProvider = new JsonRpcProvider({ url: chainConfig.rpcUrl });
  }

  queryContract(contractId: string, method: string, args: {}): Promise<QueryResponse> {
    return this.rpcProvider.callFunction(contractId, method, args);
  }

  async getRawTransaction(params: CallContractParams): Promise<NearRawTransaction> {
    throw new Error('Not implemented');
  }

  transfer(params: TransferArgs, deposit: bigint = BigInt('1'), gas: bigint = BigInt('300000000000000')) {
    if (this.isNative(params.token)) {
      deposit = BigInt(params.amount);
      return this.depositNear(params, deposit, gas);
    }
    return this.depositToken(params, deposit, gas);
  }

  private depositNear(params: TransferArgs, deposit: bigint, gas: bigint): Promise<NearRawTransaction> {
    return this.getRawTransaction({
      contractId: this.chainConfig.addresses.assetManager,
      method: 'transfer',
      args: { to: params.to, amount: params.amount, data: params.data },
      deposit,
      gas,
    });
  }

  private depositToken(params: TransferArgs, deposit: bigint, gas: bigint) {
    return this.getRawTransaction({
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
    return this.getRawTransaction({
      contractId: this.chainConfig.addresses.connection,
      method: 'send_message',
      args: params,
      deposit,
      gas,
    });
  }

  isNative(token: string): boolean {
    return token === 'NEAR';
  }

  public async getBalance(token: string): Promise<QueryResponse> {
    if (this.isNative(token)) {
      return this.queryContract(this.chainConfig.addresses.assetManager, 'get_balance', {});
    }
    return this.queryContract(token, 'ft_balance_of', {
      account_id: this.chainConfig.addresses.assetManager,
    });
  }

  public async getRateLimit(token: string): Promise<RateLimitConfig> {
    const res = (await this.queryContract(this.chainConfig.addresses.rateLimit, 'get_rate_limit', {
      token: token,
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
      deposit = BigInt(fillData.amount);
      return this.getRawTransaction({
        contractId: this.chainConfig.addresses.intentFiller,
        method: 'fill_intent',
        args: { fill: this.toFillIntent(fillData) },
        deposit: deposit,
        gas: gas,
      });
    }
    return this.getRawTransaction({
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

export class NearSpokeProvider extends NearBaseSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: INearWalletProvider;

  constructor(walletProvider: INearWalletProvider, chainConfig: NearSpokeChainConfig) {
    super(chainConfig);
    this.walletProvider = walletProvider;
  }

  async submit(transaction: NearRawTransaction): Promise<string> {
    return await this.walletProvider.signAndSubmitTxn(transaction);
  }

  override async getRawTransaction(params: CallContractParams): Promise<NearRawTransaction> {
    return {
      signerId: await this.walletProvider.getWalletAddress(),
      params: params,
    } satisfies NearRawTransaction;
  }
}

export class NearRawSpokeProvider extends NearBaseSpokeProvider implements IRawSpokeProvider {
  public readonly walletProvider: WalletAddressProvider;
  public readonly raw = true;

  constructor(chainConfig: NearSpokeChainConfig, walletAddress: string) {
    super(chainConfig);
    this.walletProvider = {
      getWalletAddress: async () => walletAddress,
    };
  }

  override async getRawTransaction(params: CallContractParams): Promise<NearRawTransaction> {
    return {
      signerId: await this.walletProvider.getWalletAddress(),
      params: params,
    } satisfies NearRawTransaction;
  }
}
