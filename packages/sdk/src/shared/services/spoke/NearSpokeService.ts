import { fromHex } from 'viem';

import {
  type ConfigService,
  type DepositParams,
  type EstimateGasParams,
  type GetDepositParams,
  type RateLimitConfig,
  type SendMessageParams,
  type WaitForTxReceiptParams,
  type WaitForTxReceiptReturnType,
  sleep,
} from '../../index.js';
import {
  getIntentRelayChainId,
  ChainKeys,
  type FillData,
  type FillIntent,
  type NearRawTransaction,
  type NearChainKey,
  type NearRawTransactionReceipt,
  type Result,
  type TxReturnType,
  spokeChainConfig,
  isNativeToken,
} from '@sodax/types';
import { JsonRpcProvider } from 'near-api-js';

export type QueryResponse = string | number | boolean | object | undefined;
export type CallResponse = string | number | object | bigint | boolean;

export const NEAR_DEFAULT_GAS = BigInt('300000000000000'); // 30 TGas derived from near documentation as max limit

export class NearSpokeService {
  public readonly rpcProvider: JsonRpcProvider;
  private readonly pollingIntervalMs: number;
  private readonly maxTimeoutMs: number;

  public constructor(config: ConfigService) {
    // since we only support mainnet for now, we can hardcode the single near chain config
    const chainConfig = config.sodaxConfig.chains[ChainKeys.NEAR_MAINNET];
    this.rpcProvider = new JsonRpcProvider({ url: chainConfig.rpcUrl });
    this.pollingIntervalMs = chainConfig.pollingConfig.pollingIntervalMs;
    this.maxTimeoutMs = chainConfig.pollingConfig.maxTimeoutMs;
  }

  public async estimateGas(_: EstimateGasParams<NearChainKey>): Promise<bigint> {
    return NEAR_DEFAULT_GAS;
  }

  queryContract(contractId: string, method: string, args: {}): Promise<QueryResponse> {
    return this.rpcProvider.callFunction({ contractId, method, args });
  }

  public async getRateLimit(token: string, fromChainId: NearChainKey): Promise<RateLimitConfig> {
    const res = (await this.queryContract(spokeChainConfig[fromChainId].addresses.rateLimit, 'get_rate_limit', {
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

  async fillIntent(
    fromInfo: {
      srcAddress: string;
      srcChainKey: NearChainKey;
    },
    fillData: FillData,
    deposit: bigint = BigInt('0'),
    gas: bigint = BigInt('300000000000000'),
  ): Promise<NearRawTransaction> {
    if (isNativeToken(fromInfo.srcChainKey, fillData.token)) {
      deposit = BigInt(fillData.amount);
      return {
        signerId: fromInfo.srcAddress,
        params: {
          contractId: spokeChainConfig[fromInfo.srcChainKey].addresses.intentFiller,
          method: 'fill_intent',
          args: { fill: this.toFillIntent(fillData) },
          deposit: deposit,
          gas: gas,
        },
      };
    }
    return {
      signerId: fromInfo.srcAddress,
      params: {
        contractId: fillData.token,
        method: 'ft_transfer_call',
        args: {
          receiver_id: spokeChainConfig[fromInfo.srcChainKey].addresses.intentFiller,
          amount: fillData.amount.toString(),
          memo: '',
          msg: JSON.stringify(this.toFillIntent(fillData)),
        },
        deposit: deposit,
        gas: gas,
      },
    };
  }

  /**
   * Deposit tokens to the spoke chain.
   * @param {CWSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {CWSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseNearTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  public async deposit<R extends boolean = false>(
    params: DepositParams<NearChainKey, R>,
  ): Promise<TxReturnType<NearChainKey, R>> {
    const inputParams = {
      token: params.token,
      to: Array.from(fromHex(params.to, 'bytes')),
      amount: params.amount.toString(),
      data: Array.from(fromHex(params.data, 'bytes')),
    };

    let tx: NearRawTransaction;
    if (isNativeToken(params.srcChainKey, params.token)) {
      tx = {
        signerId: params.srcAddress,
        params: {
          contractId: spokeChainConfig[params.srcChainKey].addresses.assetManager,
          method: 'transfer',
          args: { to: inputParams.to, amount: inputParams.amount, data: inputParams.data },
          deposit: BigInt(inputParams.amount),
          gas: NEAR_DEFAULT_GAS,
        },
      };
    } else {
      tx = {
        signerId: params.srcAddress,
        params: {
          contractId: inputParams.token,
          method: 'ft_transfer_call',
          args: {
            receiver_id: spokeChainConfig[params.srcChainKey].addresses.assetManager,
            amount: inputParams.amount.toString(),
            memo: '',
            msg: JSON.stringify({
              to: inputParams.to,
              data: inputParams.data,
            }),
          },
          deposit: BigInt('0'),
          gas: NEAR_DEFAULT_GAS,
        },
      };
    }

    if (params.raw === true) {
      return tx satisfies TxReturnType<NearChainKey, true> as TxReturnType<NearChainKey, R>;
    }
    return params.walletProvider.signAndSubmitTxn(tx) satisfies Promise<TxReturnType<NearChainKey, false>> as Promise<
      TxReturnType<NearChainKey, R>
    >;
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {CWSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public async getDeposit(params: GetDepositParams<NearChainKey>): Promise<bigint> {
    let bal: unknown;
    if (isNativeToken(params.srcChainKey, params.token)) {
      bal = await this.queryContract(spokeChainConfig[params.srcChainKey].addresses.assetManager, 'get_balance', {});
    } else {
      bal = await this.queryContract(params.token, 'ft_balance_of', {
        account_id: spokeChainConfig[params.srcChainKey].addresses.assetManager,
      });
    }

    if (typeof bal !== 'string') {
      throw new Error('[NearSpokeService.getDeposit] Failed to get balance. Unexpected response type.');
    }

    return BigInt(bal);
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the hub chain.
   * @param {Address} dstAddress - The address on the hub chain.
   * @param {Hex} payload - The payload to send.
   * @param {CWSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<TxReturnType<S, R>>} A promise that resolves to the transaction hash.
   */
  public async sendMessage<Raw extends boolean>(
    params: SendMessageParams<NearChainKey, Raw>,
  ): Promise<TxReturnType<NearChainKey, Raw>> {
    const dstChainId = getIntentRelayChainId(params.dstChainKey);

    const tx: NearRawTransaction = {
      signerId: params.srcAddress,
      params: {
        contractId: spokeChainConfig[params.srcChainKey].addresses.connection,
        method: 'send_message',
        args: {
          dst_address: Array.from(fromHex(params.dstAddress, 'bytes')),
          dst_chain_id: Number.parseInt(dstChainId.toString()),
          payload: Array.from(fromHex(params.payload, 'bytes')),
        },
        deposit: BigInt('0'),
        gas: NEAR_DEFAULT_GAS, // TODO: estimate gas properly?
      },
    } satisfies NearRawTransaction;

    if (params.raw === true) {
      return tx satisfies TxReturnType<NearChainKey, true> as TxReturnType<NearChainKey, Raw>;
    }

    return params.walletProvider.signAndSubmitTxn(tx) satisfies Promise<TxReturnType<NearChainKey, false>> as Promise<
      TxReturnType<NearChainKey, Raw>
    >;
  }

  /**
   * Get Max Withdrawable Balance for the token.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {NearSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The max limit of the token.
   */
  public async getLimit(token: string, fromChainId: NearChainKey): Promise<bigint> {
    const rate_limit = await this.getRateLimit(token, fromChainId);
    return BigInt(rate_limit.maxAvailable);
  }

  /**
   * Get available withdrawable amount for the token.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {NearSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The available withdrawable amount of the token.
   */
  public async getAvailable(token: string, fromChainId: NearChainKey): Promise<bigint> {
    const rate_limit = await this.getRateLimit(token, fromChainId);
    return BigInt(rate_limit.available);
  }

  public async waitForTransactionReceipt(
    params: WaitForTxReceiptParams<NearChainKey>,
  ): Promise<Result<WaitForTxReceiptReturnType<NearChainKey>>> {
    const { txHash, pollingIntervalMs = this.pollingIntervalMs, maxTimeoutMs = this.maxTimeoutMs } = params;
    const accountId = spokeChainConfig[params.chainKey].addresses.assetManager;
    const maxRetries = Math.round(maxTimeoutMs / pollingIntervalMs);

    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        const outcome = await this.rpcProvider.viewTransactionStatus({ txHash, accountId, waitUntil: 'FINAL' });

        const status = outcome?.status as Record<string, unknown> | undefined;
        if (status && ('SuccessValue' in status || 'SuccessReceiptId' in status)) {
          return { ok: true, value: { status: 'success', receipt: outcome satisfies NearRawTransactionReceipt } };
        }
        if (status && 'Failure' in status) {
          return {
            ok: true,
            value: { status: 'failure', error: new Error(`Transaction failed: ${JSON.stringify(status.Failure)}`) },
          };
        }

        if (retry < maxRetries) {
          await sleep(pollingIntervalMs);
        }
      } catch {
        if (retry < maxRetries) {
          await sleep(pollingIntervalMs);
        }
      }
    }

    return {
      ok: true,
      value: {
        status: 'timeout',
        error: new Error(`NEAR transaction ${txHash} was not confirmed after ${maxRetries} retries`),
      },
    };
  }
}
