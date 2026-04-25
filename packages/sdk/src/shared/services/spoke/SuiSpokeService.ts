import { bcs } from '@mysten/sui/bcs';
import { fromHex, toHex } from 'viem';
import { Transaction, type TransactionResult, type TransactionArgument } from '@mysten/sui/transactions';
import {
  getIntentRelayChainId,
  type Hex,
  type Result,
  type SuiPaginatedCoins,
  type SuiExecutionResult,
  type SuiRawTransactionReceipt,
  type SuiChainKey,
  spokeChainConfig,
  ChainKeys,
  isNativeToken,
  type TxReturnType,
  type SuiGasEstimate,
} from '@sodax/types';
import { SuiClient } from '@mysten/sui/client';
import type {
  DepositParams,
  EstimateGasParams,
  GetDepositParams,
  SendMessageParams,
  WaitForTxReceiptParams,
  WaitForTxReceiptReturnType,
} from '../../types/spoke-types.js';
import type { ConfigService } from '../../config/ConfigService.js';

export type SuiNativeCoinResult = { $kind: 'NestedResult'; NestedResult: [number, number] };
export type SuiTxObject = { $kind: 'Input'; Input: number; type?: 'object' | undefined };

export class SuiSpokeService {
  public readonly publicClient: SuiClient;
  public assetManagerAddress: string | undefined;
  private readonly pollingIntervalMs: number;
  private readonly maxTimeoutMs: number;

  public constructor(config: ConfigService) {
    // since we only support mainnet for now, we can hardcode the single sui chain config
    const chainConfig = config.sodaxConfig.chains[ChainKeys.SUI_MAINNET];
    this.publicClient = new SuiClient({ url: chainConfig.rpc_url });
    this.pollingIntervalMs = chainConfig.pollingConfig.pollingIntervalMs;
    this.maxTimeoutMs = chainConfig.pollingConfig.maxTimeoutMs;
  }

  async getCoins(address: string, token: string): Promise<SuiPaginatedCoins> {
    return this.publicClient.getCoins({ owner: address, coinType: token, limit: 10 });
  }

  public async getCoin(
    tx: Transaction,
    coin: string,
    amount: bigint,
    address: string,
  ): Promise<TransactionResult | SuiTxObject> {
    const coins = await this.getCoins(address, coin);

    const objects: string[] = [];
    let totalAmount = BigInt(0);

    for (const coin of coins.data) {
      totalAmount += BigInt(coin.balance);
      objects.push(coin.coinObjectId);

      if (totalAmount >= amount) {
        break;
      }
    }

    const firstObject = objects[0];

    if (!firstObject) {
      throw new Error(`[SuiIntentService.getCoin] Coin=${coin} not found for address=${address} and amount=${amount}`);
    }

    if (objects.length > 1) {
      tx.mergeCoins(firstObject, objects.slice(1));
    }

    if (totalAmount === amount) {
      return tx.object(firstObject);
    }

    return tx.splitCoins(firstObject, [amount]);
  }

  splitAddress(address: string): { packageId: string; moduleId: string; stateId: string } {
    const parts = address.split('::');
    if (parts.length === 3) {
      if (parts[0] && parts[1] && parts[2]) {
        return { packageId: parts[0], moduleId: parts[1], stateId: parts[2] };
      }
      throw new Error('Invalid package address');
    }
    throw new Error('Invalid package address');
  }

  public async getNativeCoin(tx: Transaction, amount: bigint): Promise<SuiNativeCoinResult> {
    const coin = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])[0];

    if (coin === undefined) {
      return Promise.reject(Error('[SuiIntentService.getNativeCoin] coin undefined'));
    }

    return coin;
  }

  static getAddressBCSBytes(suiaddress: string): Hex {
    return toHex(bcs.Address.serialize(suiaddress).toBytes());
  }

  public encodeSimulationParams(token: string, assetManager: string): { encodedToken: Hex; encodedSrcAddress: Hex } {
    // Sui tokens and the asset manager are Move type strings ("0xPKG::module::STATE"), not plain 32-byte
    // hex addresses. BCS Address serialization expects 32-byte hex and fails on composed Move strings.
    // The hub expects UTF-8-encoded Move type strings, matching what the Sui contract sends on-chain.
    const encoder = new TextEncoder();
    return {
      encodedToken: toHex(encoder.encode(token)),
      encodedSrcAddress: toHex(encoder.encode(assetManager)),
    };
  }

  async getAssetManagerAddress(chainId: SuiChainKey): Promise<string> {
    if (!this.assetManagerAddress) {
      this.assetManagerAddress = await this.fetchAssetManagerAddress(chainId);
    }
    return this.assetManagerAddress.toString();
  }

  public async viewContract(
    tx: Transaction,
    packageId: string,
    module: string,
    functionName: string,
    args: unknown[],
    typeArgs: string[] = [],
    sender: string,
  ): Promise<SuiExecutionResult> {
    tx.moveCall({
      target: `${packageId}::${module}::${functionName}`,
      arguments: args as TransactionArgument[],
      typeArguments: typeArgs,
    });

    const txResults = await this.publicClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender,
    });

    if (txResults.results && txResults.results[0] !== undefined) {
      return txResults.results[0] as SuiExecutionResult;
    }
    throw Error(`transaction didn't return any values: ${JSON.stringify(txResults, null, 2)}`);
  }

  /**
   * Deposit tokens to the spoke chain.
   * @param {DepositParams<SuiChainKey, R>} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<TxReturnType<SuiChainKey, R>>} A promise that resolves to the transaction hash or raw transaction base64 string.
   */
  async deposit<R extends boolean = false>(
    params: DepositParams<SuiChainKey, R>,
  ): Promise<TxReturnType<SuiChainKey, R>> {
    const { srcAddress: from, srcChainKey: fromChainId, token, to, amount, data = '0x' } = params;
    const isNative = isNativeToken(fromChainId, token);
    const tx = new Transaction();
    const coin: TransactionResult | SuiNativeCoinResult | SuiTxObject = isNative
      ? await this.getNativeCoin(tx, amount)
      : await this.getCoin(tx, token, amount, from);
    const connection = this.splitAddress(spokeChainConfig[fromChainId].addresses.connection);
    const assetManager = this.splitAddress(await this.getAssetManagerAddress(fromChainId));

    // Call transfer function
    tx.moveCall({
      target: `${assetManager.packageId}::${assetManager.moduleId}::transfer`,
      typeArguments: [token],
      arguments: [
        tx.object(assetManager.stateId),
        tx.object(connection.stateId), // Connection state object
        coin,
        tx.pure(bcs.vector(bcs.u8()).serialize(fromHex(to, 'bytes'))),
        tx.pure(bcs.vector(bcs.u8()).serialize(fromHex(data, 'bytes'))),
      ],
    });

    if (params.raw === true) {
      tx.setSender(from);
      const transactionRaw = await tx.build({
        client: this.publicClient,
        onlyTransactionKind: true,
      });

      const transactionRawBase64String = Buffer.from(transactionRaw).toString('base64');

      return {
        from: from,
        to: `${assetManager.packageId}::${assetManager.moduleId}::transfer`,
        value: amount,
        data: transactionRawBase64String,
      } satisfies TxReturnType<SuiChainKey, true> as TxReturnType<SuiChainKey, R>;
    }

    return params.walletProvider.signAndExecuteTxn(tx) satisfies Promise<TxReturnType<SuiChainKey, false>> as Promise<
      TxReturnType<SuiChainKey, R>
    >;
  }

  public async sendMessage<Raw extends boolean>(
    params: SendMessageParams<SuiChainKey, Raw>,
  ): Promise<TxReturnType<SuiChainKey, Raw>> {
    const { srcAddress: from, srcChainKey: fromChainId, dstChainKey: dstChainId, dstAddress, payload } = params;

    const txb = new Transaction();
    const connection = this.splitAddress(spokeChainConfig[fromChainId].addresses.connection);

    const relayId = getIntentRelayChainId(dstChainId);
    // Perform send message transaction
    txb.moveCall({
      target: `${connection.packageId}::${connection.moduleId}::send_message_ua`,
      arguments: [
        txb.object(connection.stateId),
        txb.pure.u256(relayId),
        txb.pure(bcs.vector(bcs.u8()).serialize(fromHex(dstAddress, 'bytes'))),
        txb.pure(bcs.vector(bcs.u8()).serialize(fromHex(payload, 'bytes'))),
      ],
    });

    if (params.raw === true) {
      txb.setSender(from);
      const transactionRaw = await txb.build({
        client: this.publicClient,
        onlyTransactionKind: true,
      });
      const transactionRawBase64String = Buffer.from(transactionRaw).toString('base64');

      return {
        from: from,
        to: `${connection.packageId}::${connection.moduleId}::send_message_ua`,
        value: 0n,
        data: transactionRawBase64String,
      } satisfies TxReturnType<SuiChainKey, true> as TxReturnType<SuiChainKey, Raw>;
    }

    return params.walletProvider.signAndExecuteTxn(txb) satisfies Promise<TxReturnType<SuiChainKey, false>> as Promise<
      TxReturnType<SuiChainKey, Raw>
    >;
  }

  /**
   * Estimate the gas for a transaction.
   * @param {EstimateGasParams<SuiChainKey>} params - The parameters for the gas estimation, including the from, to, value, and data.
   * @returns {Promise<bigint>} The estimated computation cost.
   */
  public async estimateGas({ tx }: EstimateGasParams<SuiChainKey>): Promise<SuiGasEstimate> {
    const txb = Transaction.fromKind(tx.data);
    const result = await this.publicClient.devInspectTransactionBlock({
      sender: tx.from,
      transactionBlock: txb,
    });

    return result.effects.gasUsed;
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {SuiSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public async getDeposit(params: GetDepositParams<SuiChainKey>): Promise<bigint> {
    const assetmanager = this.splitAddress(await this.getAssetManagerAddress(params.srcChainKey));
    const tx = new Transaction();
    const result = await this.viewContract(
      tx,
      assetmanager.packageId,
      assetmanager.moduleId,
      'get_token_balance',
      [tx.object(assetmanager.stateId)],
      [params.token],
      params.srcAddress,
    );
    if (
      !Array.isArray(result?.returnValues) ||
      !Array.isArray(result.returnValues[0]) ||
      result.returnValues[0][0] === undefined
    ) {
      throw new Error('Failed to get Balance');
    }
    const val: number[] = result.returnValues[0][0];
    const str_u64 = bcs.U64.parse(Uint8Array.from(val));
    return BigInt(str_u64);
  }

  /**
   * Fetch the asset manager config from the spoke chain.
   * @param {SuiBaseSpokeProvider} suiSpokeProvider - The spoke provider.
   * @returns {Promise<string>} The asset manager config.
   */
  public async fetchAssetManagerAddress(chainId: SuiChainKey): Promise<string> {
    const latestPackageId = await this.fetchLatestAssetManagerPackageId(chainId);

    return `${latestPackageId}::asset_manager::${spokeChainConfig[chainId].addresses.assetManagerConfigId}`;
  }

  /**
   * Fetch the latest asset manager package id from the spoke chain.
   * @param {SuiBaseSpokeProvider} suiSpokeProvider - The spoke provider.
   * @returns {Promise<string>} The latest asset manager package id.
   */
  public async fetchLatestAssetManagerPackageId(chainId: SuiChainKey): Promise<string> {
    const configData = await this.publicClient.getObject({
      id: spokeChainConfig[chainId].addresses.assetManagerConfigId,
      options: {
        showContent: true,
      },
    });

    if (configData.error) {
      throw new Error(`Failed to fetch asset manager id. Details: ${JSON.stringify(configData.error)}`);
    }

    if (!configData.data) {
      throw new Error('Asset manager id not found (no data)');
    }

    if (configData.data.content?.dataType !== 'moveObject') {
      throw new Error('Asset manager id not found (not a move object)');
    }

    if (!('latest_package_id' in configData.data.content.fields)) {
      throw new Error('Asset manager id not found (no latest package id)');
    }

    const latestPackageId = configData.data.content.fields['latest_package_id'];

    if (typeof latestPackageId !== 'string') {
      throw new Error('Asset manager id invalid (latest package id is not a string)');
    }

    if (!latestPackageId) {
      throw new Error('Asset manager id not found (no latest package id)');
    }

    return latestPackageId.toString();
  }

  public async waitForTransactionReceipt(
    params: WaitForTxReceiptParams<SuiChainKey>,
  ): Promise<Result<WaitForTxReceiptReturnType<SuiChainKey>>> {
    try {
      const result = await this.publicClient.waitForTransaction({
        digest: params.txHash,
        timeout: params.maxTimeoutMs ?? this.maxTimeoutMs,
        pollInterval: params.pollingIntervalMs ?? this.pollingIntervalMs,
      });

      if (result.effects?.status?.status === 'failure') {
        return {
          ok: true,
          value: { status: 'failure', error: new Error(`Transaction failed: ${result.effects.status.error}`) },
        };
      }

      return { ok: true, value: { status: 'success', receipt: result satisfies SuiRawTransactionReceipt } };
    } catch (error) {
      const isTimeout = error instanceof Error && error.message.includes('timeout');
      return {
        ok: true,
        value: {
          status: isTimeout ? 'timeout' : 'failure',
          error: error instanceof Error ? error : new Error(String(error)),
        },
      };
    }
  }
}
