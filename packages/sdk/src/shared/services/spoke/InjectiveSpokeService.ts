import { fromHex } from 'viem';
import type {
  SendMessageParams,
  DepositParams,
  EstimateGasParams,
  GetDepositParams,
  WaitForTxReceiptParams,
  WaitForTxReceiptReturnType,
} from '../../types/spoke-types.js';
import type { ConfigService } from '../../config/ConfigService.js';
import { sleep } from '../../utils/shared-utils.js';
import {
  toBase64,
  ChainGrpcWasmApi,
  TxGrpcApi,
  fromBase64,
  MsgExecuteContract,
  createTransactionForAddressAndMsg,
  CosmosTxV1Beta1TxPb,
} from '@injectivelabs/sdk-ts';
import type { CreateTransactionResult } from '@injectivelabs/sdk-ts';
import { Network, getNetworkEndpoints, type NetworkEndpoints } from '@injectivelabs/networks';
import {
  getIntentRelayChainId,
  ChainKeys,
  type InjectiveChainKey,
  type InjectiveRawTransaction,
  type Result,
  spokeChainConfig,
  type JsonObject,
  type InjectiveExecuteResponse,
  type IInjectiveWalletProvider,
  type Hex,
  type InjectiveGasEstimate,
  type TxReturnType,
} from '@sodax/types';

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

/**
 * InjectiveSpokeService provides methods for interacting with the Injective spoke chain,
 * specifically for managing token deposits and transfers between the spoke chain and hub chain.
 * It handles the cross-chain communication and token bridging functionality, allowing users to:
 * - Deposit tokens from Injective to the hub chain
 * - Check token balances on the spoke chain
 * - Transfer tokens with custom data payloads
 */

export class InjectiveSpokeService {
  private readonly config: ConfigService;
  public readonly chainGrpcWasmApi: ChainGrpcWasmApi;
  public readonly txClient: TxGrpcApi;
  public readonly endpoints: NetworkEndpoints;
  private readonly pollingIntervalMs: number;
  private readonly maxTimeoutMs: number;

  public constructor(config: ConfigService) {
    this.config = config;
    this.endpoints = getNetworkEndpoints(Network.Mainnet);
    this.chainGrpcWasmApi = new ChainGrpcWasmApi(this.endpoints.grpc);
    this.txClient = new TxGrpcApi(this.endpoints.grpc);
    this.pollingIntervalMs =
      this.config.sodaxConfig.chains[ChainKeys.INJECTIVE_MAINNET].pollingConfig.pollingIntervalMs;
    this.maxTimeoutMs = this.config.sodaxConfig.chains[ChainKeys.INJECTIVE_MAINNET].pollingConfig.maxTimeoutMs;
  }

  /**
   * Estimate the gas for a transaction.
   * @param {InjectiveRawTransaction} rawTx - The raw transaction to estimate the gas for.
   * @param {InjectiveSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<InjectiveGasEstimate>} The estimated gas for the transaction.
   */
  public async estimateGas({ tx }: EstimateGasParams<InjectiveChainKey>): Promise<InjectiveGasEstimate> {
    const txRaw = CosmosTxV1Beta1TxPb.TxRaw.fromPartial({
      bodyBytes: tx.signedDoc.bodyBytes,
      authInfoBytes: tx.signedDoc.authInfoBytes,
      signatures: [], // not required for simulation
    });

    const { gasInfo } = await this.txClient.simulate(txRaw);

    return {
      gasWanted: gasInfo.gasWanted,
      gasUsed: gasInfo.gasUsed,
    } satisfies InjectiveGasEstimate;
  }

  /**
   * Deposit tokens to the spoke chain.
   * @param {InjectiveSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {InjectiveSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<TxReturnType<InjectiveSpokeProviderType, R>>} A promise that resolves to the transaction hash.
   */
  public async deposit<R extends boolean = false>(
    params: DepositParams<InjectiveChainKey, R>,
  ): Promise<TxReturnType<InjectiveChainKey, R>> {
    const { srcChainKey: fromChainId, srcAddress: from, token, to, amount, data = '0x' } = params;

    const toBytes = fromHex(to, 'bytes');
    const dataBytes = fromHex(data, 'bytes');

    const msg: ExecuteMsg = {
      transfer: {
        token: token,
        to: Array.from(toBytes),
        amount: amount.toString(),
        data: Array.from(dataBytes),
      },
    };

    const funds = [{ amount: amount.toString(), denom: token }];

    if (params.raw === true) {
      return (await this.getRawTransaction(
        spokeChainConfig[fromChainId].networkId,
        from,
        spokeChainConfig[fromChainId].addresses.assetManager,
        msg,
      )) satisfies TxReturnType<InjectiveChainKey, true> as TxReturnType<InjectiveChainKey, R>;
    }

    const res = await params.walletProvider.execute(
      from,
      spokeChainConfig[fromChainId].addresses.assetManager,
      msg,
      funds,
    );
    return res.transactionHash satisfies TxReturnType<InjectiveChainKey, false> as TxReturnType<InjectiveChainKey, R>;
  }

  /**
   * Get the balance of the token that deposited in the spoke chain Asset Manager.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {InjectiveSpokeProviderType} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public async getDeposit(params: GetDepositParams<InjectiveChainKey>): Promise<bigint> {
    const response = await this.chainGrpcWasmApi.fetchSmartContractState(
      this.config.sodaxConfig.chains[params.srcChainKey].addresses.assetManager,
      toBase64({
        get_balance: { denom: params.token },
      }),
    );

    // TODO: check if this is correct
    return BigInt(fromBase64(response.data as unknown as string) as unknown as number);
  }

  public async getRawTransaction(
    chainId: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    memo?: string,
  ): Promise<InjectiveRawTransaction> {
    const msgExec = MsgExecuteContract.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds: [],
    });
    const { txRaw }: CreateTransactionResult = await createTransactionForAddressAndMsg({
      message: msgExec,
      memo: memo || '',
      address: senderAddress,
      endpoint: this.endpoints.grpc,
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
    return rawTx;
  }

  // Query Methods
  async getState(chainId: InjectiveChainKey): Promise<State> {
    return this.chainGrpcWasmApi.fetchSmartContractState(
      spokeChainConfig[chainId].addresses.assetManager,
      toBase64({
        get_state: {},
      }),
    ) as unknown as Promise<State>;
  }

  /**
   * Sends a message to the hub chain.
   * @param {SendMessageParams<InjectiveChainKey, R>} params - The parameters for the call wallet, including:
   *   - {FromParams<InjectiveChainKey>} fromParams: The parameters for the from chain.
   *   - {HubChainKey} dstChainId: The chain ID of the hub chain.
   *   - {HubAddress} dstAddress: The address on the hub chain.
   *   - {Hex} payload: The payload to send.
   *   - {boolean} raw: The return type raw or just transaction hash.
   * @returns {Promise<TxReturnType<InjectiveChainKey, R>>} A promise that resolves to the transaction hash.
   */
  async sendMessage<Raw extends boolean>(
    params: SendMessageParams<InjectiveChainKey, Raw>,
  ): Promise<TxReturnType<InjectiveChainKey, Raw>> {
    const { srcAddress: from, srcChainKey: fromChainId, dstChainKey: dstChainId, dstAddress, payload } = params;
    const relayId = getIntentRelayChainId(dstChainId);

    const msg: ConnMsg = {
      send_message: {
        dst_chain_id: Number(relayId),
        dst_address: Array.from(fromHex(dstAddress, 'bytes')),
        payload: Array.from(fromHex(payload, 'bytes')),
      },
    };

    if (params.raw === true) {
      return (await this.getRawTransaction(
        spokeChainConfig[fromChainId].networkId,
        from,
        spokeChainConfig[fromChainId].addresses.connection,
        msg,
      )) satisfies TxReturnType<InjectiveChainKey, true> as TxReturnType<InjectiveChainKey, Raw>;
    }

    const res = await params.walletProvider.execute(from, spokeChainConfig[fromChainId].addresses.connection, msg);
    return res.transactionHash satisfies TxReturnType<InjectiveChainKey, false> as TxReturnType<InjectiveChainKey, Raw>;
  }

  async receiveMessage(
    senderAddress: string,
    srcChainId: InjectiveChainKey,
    srcAddress: Uint8Array,
    connSn: string,
    payload: Uint8Array,
    signatures: Uint8Array[],
    walletProvider: IInjectiveWalletProvider,
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

    return await walletProvider.execute(senderAddress, spokeChainConfig[srcChainId].addresses.assetManager, msg);
  }

  async setRateLimit(
    chainId: InjectiveChainKey,
    senderAddress: string,
    rateLimit: string,
    walletProvider: IInjectiveWalletProvider,
  ): Promise<InjectiveExecuteResponse> {
    const msg: ExecuteMsg = {
      set_rate_limit: {
        rate_limit: rateLimit,
      },
    };

    return await walletProvider.execute(senderAddress, spokeChainConfig[chainId].addresses.assetManager, msg);
  }

  async setConnection(
    chainId: InjectiveChainKey,
    senderAddress: string,
    connection: string,
    walletProvider: IInjectiveWalletProvider,
  ): Promise<InjectiveExecuteResponse> {
    const msg: ExecuteMsg = {
      set_connection: {
        connection,
      },
    };

    return await walletProvider.execute(senderAddress, spokeChainConfig[chainId].addresses.assetManager, msg);
  }

  async setOwner(
    senderAddress: string,
    owner: string,
    chainId: InjectiveChainKey,
    walletProvider: IInjectiveWalletProvider,
  ): Promise<InjectiveExecuteResponse> {
    const msg: ExecuteMsg = {
      set_owner: {
        owner,
      },
    };

    return await walletProvider.execute(senderAddress, spokeChainConfig[chainId].addresses.assetManager, msg);
  }

  public async waitForTransactionReceipt(
    params: WaitForTxReceiptParams<InjectiveChainKey>,
  ): Promise<Result<WaitForTxReceiptReturnType<InjectiveChainKey>>> {
    const { txHash, pollingIntervalMs = this.pollingIntervalMs, maxTimeoutMs = this.maxTimeoutMs } = params;
    const deadline = Date.now() + maxTimeoutMs;

    while (Date.now() < deadline) {
      try {
        const tx = await this.txClient.fetchTx(txHash);
        if (tx) {
          if (tx.code === 0) {
            return { ok: true, value: { status: 'success', receipt: tx } };
          }
          return {
            ok: true,
            value: { status: 'failure', error: new Error(`Transaction failed with code ${tx.code}: ${tx.rawLog}`) },
          };
        }
      } catch {
        // Transaction not yet indexed — retry
      }
      await sleep(pollingIntervalMs);
    }

    return {
      ok: true,
      value: {
        status: 'timeout',
        error: new Error(`Timed out after ${maxTimeoutMs}ms waiting for Injective transaction ${txHash}`),
      },
    };
  }
}
