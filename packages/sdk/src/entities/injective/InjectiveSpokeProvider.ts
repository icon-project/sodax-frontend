import { type Coin, coins } from '@cosmjs/stargate';
import { type Address, type Hex, fromHex } from 'viem';
import type { InjectiveSpokeChainConfig, InjectiveReturnType, PromiseInjectiveTxReturnType } from '../../types.js';
import type { ISpokeProvider } from '../Providers.js';
import type { IInjectiveWalletProvider, InjectiveExecuteResponse } from '@sodax/types';
import { Injective20Token } from './Injective20Token.js';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';
import { TxGrpcClient } from '@injectivelabs/sdk-ts';

export interface InstantiateMsg {
  connection: string;
  rate_limit: string;
  hub_chain_id: string; // u128 as string
  hub_asset_manager: Uint8Array;
}

export interface ConnMsg {
  send_message?: {
    dst_chain_id: number;
    dst_address: Array<number>;
    payload: Array<number>;
  };
}

export interface ExecuteMsg {
  transfer?: {
    token: string;
    to: Array<number>;
    amount: string; // should be string for u128 , but in injective it fails in type conversion.
    data: Array<number>;
  };
  recv_message?: {
    src_chain_id: string; // u128 as string
    src_address: Uint8Array;
    conn_sn: string; // u128 as string
    payload: Uint8Array;
    signatures: Uint8Array[];
  };
  set_rate_limit?: {
    rate_limit: string;
  };
  set_connection?: {
    connection: string;
  };
  set_owner?: {
    owner: string;
  };
}

export interface QueryMsg {
  get_state: {};
}

export interface State {
  connection: string;
  rate_limit: string;
  hub_asset_manager: Uint8Array;
  hub_chain_id: string; // u128 as string
  owner: string;
}

export class InjectiveSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IInjectiveWalletProvider;
  public readonly chainConfig: InjectiveSpokeChainConfig;
  public readonly txClient: TxGrpcClient;

  constructor(conf: InjectiveSpokeChainConfig, walletProvider: IInjectiveWalletProvider) {
    this.chainConfig = conf;
    this.walletProvider = walletProvider;
    this.txClient = new TxGrpcClient(
      getNetworkEndpoints(this.chainConfig.network === 'Mainnet' ? Network.Mainnet : Network.Testnet).grpc,
    );
  }

  // Query Methods
  async getState(): Promise<State> {
    return (await this.walletProvider.queryContractSmart(this.chainConfig.addresses.assetManager, {
      get_state: {},
    })) as State;
  }

  async getBalance(token: String): Promise<number> {
    return (await this.walletProvider.queryContractSmart(this.chainConfig.addresses.assetManager, {
      get_balance: { denom: token },
    })) as number;
  }

  // Execute Methods (requires SigningCosmWasmClient)

  private async transfer<R extends boolean = false>(
    senderAddress: string,
    token: string,
    to: Uint8Array,
    amount: string,
    data: Uint8Array = new Uint8Array(),
    funds: Coin[] = [],
    raw?: R,
  ): PromiseInjectiveTxReturnType<R> {
    const msg: ExecuteMsg = {
      transfer: {
        token,
        to: Array.from(to),
        amount: amount,
        data: Array.from(data),
      },
    };

    if (raw) {
      return this.walletProvider.getRawTransaction(
        this.chainConfig.networkId,
        this.chainConfig.prefix,
        senderAddress,
        this.chainConfig.addresses.connection,
        msg,
      ) as InjectiveReturnType<R>;
    }
    const res = await this.walletProvider.execute(
      senderAddress as `inj${string}`,
      this.chainConfig.addresses.assetManager,
      msg,
      'auto',
      undefined,
      funds,
    );
    return res.transactionHash as InjectiveReturnType<R>;
  }

  async depositToken<R extends boolean = false>(
    sender: string,
    tokenAddress: string,
    to: Uint8Array,
    amount: string,
    data: Uint8Array = new Uint8Array(),
    raw?: R,
  ) {
    const injective20Token = new Injective20Token(this.walletProvider, tokenAddress);
    await injective20Token.increaseAllowance(sender, this.chainConfig.addresses.assetManager, amount);
    return this.transfer(sender, tokenAddress, to, amount, data, [], raw);
  }

  static async deposit<R extends boolean = false>(
    sender: string,
    token_address: string,
    to: Address,
    amount: string,
    data: Hex = '0x',
    provider: InjectiveSpokeProvider,
    raw?: R,
  ): PromiseInjectiveTxReturnType<R> {
    const isNative = await provider.isNative(token_address);
    const toBytes = fromHex(to, 'bytes');
    const dataBytes = fromHex(data, 'bytes');

    if (isNative) {
      return provider.depositNative(sender, token_address, toBytes, amount, dataBytes, raw);
    }

    return provider.depositToken(sender, token_address, toBytes, amount, dataBytes, raw);
  }

  async depositNative<R extends boolean = false>(
    sender: string,
    token: string,
    to: Uint8Array,
    amount: string,
    data: Uint8Array = new Uint8Array([2, 2, 2]),
    raw?: R,
  ) {
    const funds = coins(amount, token);
    return this.transfer(sender, token, to, amount, data, funds, raw);
  }

  async isNative(token: string): Promise<boolean> {
    let isNative = true;
    const injective20Token = new Injective20Token(this.walletProvider, token);
    try {
      await injective20Token.getTokenInfo();
      isNative = false;
    } catch (err) {
      console.error('[InjectiveSpokeProvider] isNative error', err);
      throw err;
    }
    return isNative;
  }

  async receiveMessage(
    senderAddress: string,
    srcChainId: string,
    srcAddress: Uint8Array,
    connSn: string,
    payload: Uint8Array,
    signatures: Uint8Array[],
  ): Promise<InjectiveExecuteResponse> {
    const msg: ExecuteMsg = {
      recv_message: {
        src_chain_id: srcChainId,
        src_address: srcAddress,
        conn_sn: connSn,
        payload,
        signatures,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.chainConfig.addresses.assetManager, msg, 'auto');
  }

  async setRateLimit(senderAddress: string, rateLimit: string): Promise<InjectiveExecuteResponse> {
    const msg: ExecuteMsg = {
      set_rate_limit: {
        rate_limit: rateLimit,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.chainConfig.addresses.assetManager, msg, 'auto');
  }

  async setConnection(senderAddress: string, connection: string): Promise<InjectiveExecuteResponse> {
    const msg: ExecuteMsg = {
      set_connection: {
        connection,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.chainConfig.addresses.assetManager, msg, 'auto');
  }

  async setOwner(senderAddress: string, owner: string): Promise<InjectiveExecuteResponse> {
    const msg: ExecuteMsg = {
      set_owner: {
        owner,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.chainConfig.addresses.assetManager, msg, 'auto');
  }

  async send_message<R extends boolean = false>(
    sender: string,
    dst_chain_id: string,
    dst_address: Hex,
    payload: Hex,
    raw?: R,
  ): PromiseInjectiveTxReturnType<R> {
    const msg: ConnMsg = {
      send_message: {
        dst_chain_id: Number.parseInt(dst_chain_id),
        dst_address: Array.from(fromHex(dst_address, 'bytes')),
        payload: Array.from(fromHex(payload, 'bytes')),
      },
    };
    if (raw) {
      return this.walletProvider.getRawTransaction(
        this.chainConfig.networkId,
        this.chainConfig.prefix,
        sender,
        this.chainConfig.addresses.connection,
        msg,
      ) as InjectiveReturnType<R>;
    }
    const res = await this.walletProvider.execute(sender, this.chainConfig.addresses.connection, msg, 'auto');
    return res.transactionHash as InjectiveReturnType<R>;
  }

  // Helper Methods
  static stringToUint8Array(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  static uint8ArrayToString(arr: Uint8Array): string {
    return new TextDecoder().decode(arr);
  }

  static toBigIntString(num: number | bigint): string {
    return num.toString();
  }
}
