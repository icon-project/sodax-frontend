import { type Address, type Hex, fromHex } from 'viem';
import type { InjectiveReturnType, PromiseInjectiveTxReturnType } from '../../types.js';
import type { IRawSpokeProvider, ISpokeProvider } from '../Providers.js';
import type { IInjectiveWalletProvider, InjectiveExecuteResponse , InjectiveSpokeChainConfig, WalletAddressProvider} from '@sodax/types';
import { toBase64, ChainGrpcWasmApi, TxGrpcApi, fromBase64 } from '@injectivelabs/sdk-ts';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';

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

export class InjectiveBaseSpokeProvider {
  public readonly chainConfig: InjectiveSpokeChainConfig;
  public readonly chainGrpcWasmApi: ChainGrpcWasmApi;
  public readonly txClient: TxGrpcApi;

  constructor(chainConfig: InjectiveSpokeChainConfig) {
    this.chainConfig = chainConfig;
    const endpoints = getNetworkEndpoints(Network.Mainnet);
    this.chainGrpcWasmApi = new ChainGrpcWasmApi(endpoints.grpc);
    this.txClient = new TxGrpcApi(endpoints.grpc);
  }
}

export class InjectiveRawSpokeProvider extends InjectiveBaseSpokeProvider implements IRawSpokeProvider {
  public readonly walletProvider: WalletAddressProvider;
  public readonly raw = true;

  constructor(chainConfig: InjectiveSpokeChainConfig, walletAddress: string) {
    super(chainConfig);
    this.walletProvider = {
      getWalletAddress: async () => walletAddress,
    };
  }
}

export class InjectiveSpokeProvider extends InjectiveBaseSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IInjectiveWalletProvider;


  constructor(conf: InjectiveSpokeChainConfig, walletProvider: IInjectiveWalletProvider) {
    super(conf);
    this.walletProvider = walletProvider;
  }

  // Query Methods
  async getState(): Promise<State> {
    return this.chainGrpcWasmApi.fetchSmartContractState(
      this.chainConfig.addresses.assetManager,
      toBase64({
        get_state: {},
      }),
    ) as unknown as Promise<State>;
  }

  async getBalance(token: String): Promise<number> {
    const response = await this.chainGrpcWasmApi.fetchSmartContractState(
      this.chainConfig.addresses.assetManager,
      toBase64({
        get_balance: { denom: token },
      }),
    );

    return fromBase64(response.data as unknown as string) as unknown as number;
  }

  // Execute Methods (requires SigningCosmWasmClient)

  /**
   * Deposit tokens including native token to Injective Asset Manager.
   **/
  static async deposit<R extends boolean = false>(
    sender: string,
    token_address: string,
    to: Address,
    amount: string,
    data: Hex = '0x',
    spokeProvider: InjectiveSpokeProvider,
    raw?: R,
  ): PromiseInjectiveTxReturnType<R> {
    const toBytes = fromHex(to, 'bytes');
    const dataBytes = fromHex(data, 'bytes');

    const msg: ExecuteMsg = {
      transfer: {
        token: token_address,
        to: Array.from(toBytes),
        amount: amount,
        data: Array.from(dataBytes),
      },
    };

    const funds = [{ amount, denom: token_address }];

    if (raw) {
      return (await spokeProvider.walletProvider.getRawTransaction(
        spokeProvider.chainConfig.networkId,
        spokeProvider.chainConfig.prefix,
        sender,
        spokeProvider.chainConfig.addresses.assetManager,
        msg,
      )) as InjectiveReturnType<R>;
    }

    const res = await spokeProvider.walletProvider.execute(
      sender as `inj${string}`,
      spokeProvider.chainConfig.addresses.assetManager,
      msg,
      funds,
    );
    return res.transactionHash as InjectiveReturnType<R>;
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

    return await this.walletProvider.execute(senderAddress, this.chainConfig.addresses.assetManager, msg);
  }

  async setRateLimit(senderAddress: string, rateLimit: string): Promise<InjectiveExecuteResponse> {
    const msg: ExecuteMsg = {
      set_rate_limit: {
        rate_limit: rateLimit,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.chainConfig.addresses.assetManager, msg);
  }

  async setConnection(senderAddress: string, connection: string): Promise<InjectiveExecuteResponse> {
    const msg: ExecuteMsg = {
      set_connection: {
        connection,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.chainConfig.addresses.assetManager, msg);
  }

  async setOwner(senderAddress: string, owner: string): Promise<InjectiveExecuteResponse> {
    const msg: ExecuteMsg = {
      set_owner: {
        owner,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.chainConfig.addresses.assetManager, msg);
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
      return (await this.walletProvider.getRawTransaction(
        this.chainConfig.networkId,
        this.chainConfig.prefix,
        sender,
        this.chainConfig.addresses.connection,
        msg,
      )) as InjectiveReturnType<R>;
    }
    const res = await this.walletProvider.execute(sender, this.chainConfig.addresses.connection, msg);
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
