import { type Coin, coins } from '@cosmjs/stargate';
import { type Address, type Hex, fromHex } from 'viem';
import type { CosmosSpokeChainConfig, CWReturnType, PromiseCWTxReturnType } from '../../types.js';
import type { ISpokeProvider } from '../Providers.js';
import type { IInjectiveWalletProvider, ICWWalletProvider, CWExecuteResponse } from '@sodax/types';
import { CW20Token } from './CW20Token.js';

export type CWSpokeDepositParams = {
  from: string; // The address of the user on the spoke chain
  token: string; // The address of the token to deposit
  amount: string; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export interface InstantiateMsg {
  connection: string;
  rate_limit: string;
  hub_chain_id: string; // u128 as string
  hub_asset_manager: Uint8Array;
}

export interface ConnMsg {
  send_message?: {
    dst_chain_id: number;
    dst_address: Array<Number>;
    payload: Array<Number>;
  };
}

export interface ExecuteMsg {
  transfer?: {
    token: string;
    to: Array<Number>;
    amount: string; // should be string for u128 , but in injective it fails in type conversion.
    data: Array<Number>;
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

export class CWSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: ICWWalletProvider | IInjectiveWalletProvider;

  public chainConfig: CosmosSpokeChainConfig;

  constructor(conf: CosmosSpokeChainConfig, walletProvider: ICWWalletProvider | IInjectiveWalletProvider) {
    this.chainConfig = conf;
    this.walletProvider = walletProvider;
  }

  // Query Methods
  async getState(): Promise<State> {
    return await this.walletProvider.queryContractSmart(this.chainConfig.addresses.assetManager, {
      get_state: {},
    });
  }

  async getBalance(token: String): Promise<number> {
    return await this.walletProvider.queryContractSmart(this.chainConfig.addresses.assetManager, {
      get_balance: { denom: token },
    });
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
  ): PromiseCWTxReturnType<R> {
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
      ) as CWReturnType<R>;
    }
    const res = await this.walletProvider.execute(
      senderAddress as `inj${string}`,
      this.chainConfig.addresses.assetManager,
      msg,
      'auto',
      undefined,
      funds,
    );
    return `0x${res.transactionHash}` as CWReturnType<R>;
  }

  async depositToken<R extends boolean = false>(
    sender: string,
    tokenAddress: string,
    to: Uint8Array,
    amount: string,
    data: Uint8Array = new Uint8Array(),
    raw?: R,
  ) {
    const cw20Token = new CW20Token(this.walletProvider, tokenAddress);
    await cw20Token.increaseAllowance(sender, this.chainConfig.addresses.assetManager, amount);
    return this.transfer(sender, tokenAddress, to, amount, data, [], raw);
  }

  static async deposit<R extends boolean = false>(
    sender: string,
    token_address: string,
    to: Address,
    amount: string,
    data: Hex = '0x',
    provider: CWSpokeProvider,
    raw?: R,
  ): PromiseCWTxReturnType<R> {
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
    const cw20Token = new CW20Token(this.walletProvider, token);
    try {
      await cw20Token.getTokenInfo();
      isNative = false;
    } catch (err) {}
    return isNative;
  }

  async receiveMessage(
    senderAddress: string,
    srcChainId: string,
    srcAddress: Uint8Array,
    connSn: string,
    payload: Uint8Array,
    signatures: Uint8Array[],
  ): Promise<CWExecuteResponse> {
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

  async setRateLimit(senderAddress: string, rateLimit: string): Promise<CWExecuteResponse> {
    const msg: ExecuteMsg = {
      set_rate_limit: {
        rate_limit: rateLimit,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.chainConfig.addresses.assetManager, msg, 'auto');
  }

  async setConnection(senderAddress: string, connection: string): Promise<CWExecuteResponse> {
    const msg: ExecuteMsg = {
      set_connection: {
        connection,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.chainConfig.addresses.assetManager, msg, 'auto');
  }

  async setOwner(senderAddress: string, owner: string): Promise<CWExecuteResponse> {
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
  ): PromiseCWTxReturnType<R> {
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
      ) as CWReturnType<R>;
    }
    const res = await this.walletProvider.execute(sender, this.chainConfig.addresses.connection, msg, 'auto');
    return `0x${res.transactionHash}` as CWReturnType<R>;
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
