import { bcs } from '@mysten/sui/bcs';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction, type TransactionResult } from '@mysten/sui/transactions';
import { type Hex, toHex } from 'viem';
import type { PromiseSuiTxReturnType, SuiReturnType } from '../../types.js';
import type { ISpokeProvider } from '../index.js';
import type { ISuiWalletProvider, SuiSpokeChainConfig } from '@sodax/types';
import { SuiSpokeService } from '../../services/spoke/SuiSpokeService.js';

type SuiNativeCoinResult = { $kind: 'NestedResult'; NestedResult: [number, number] };
type SuiTxObject = { $kind: 'Input'; Input: number; type?: 'object' | undefined };
export class SuiSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: ISuiWalletProvider;
  public chainConfig: SuiSpokeChainConfig;
  public readonly publicClient: SuiClient;
  private assetManagerAddress: string | undefined;

  constructor(config: SuiSpokeChainConfig, wallet_provider: ISuiWalletProvider) {
    this.chainConfig = config;
    this.walletProvider = wallet_provider;
    this.publicClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
  }

  async getBalance(token: string): Promise<bigint> {
    const assetmanager = this.splitAddress(await this.getAssetManagerAddress());
    const tx = new Transaction();
    const result = await this.walletProvider.viewContract(
      tx,
      assetmanager.packageId,
      assetmanager.moduleId,
      'get_token_balance',
      [tx.object(assetmanager.stateId)],
      [token],
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

  async transfer<R extends boolean = false>(
    token: string,
    amount: bigint,
    to: Uint8Array,
    data: Uint8Array,
    raw?: R,
  ): PromiseSuiTxReturnType<R> {
    const isNative = token.toLowerCase() === this.chainConfig.nativeToken.toLowerCase();
    const tx = new Transaction();
    const walletAddress = await this.walletProvider.getWalletAddress();
    const coin: TransactionResult | SuiNativeCoinResult | SuiTxObject = isNative
      ? await this.getNativeCoin(tx, amount)
      : await this.getCoin(tx, token, amount, walletAddress);
    const connection = this.splitAddress(this.chainConfig.addresses.connection);
    const assetManager = this.splitAddress(await this.getAssetManagerAddress());

    // Call transfer function
    tx.moveCall({
      target: `${assetManager.packageId}::${assetManager.moduleId}::transfer`,
      typeArguments: [token],
      arguments: [
        tx.object(assetManager.stateId),
        tx.object(connection.stateId), // Connection state object
        coin,
        tx.pure(bcs.vector(bcs.u8()).serialize(to)),
        tx.pure(bcs.vector(bcs.u8()).serialize(data)),
      ],
    });

    if (raw) {
      tx.setSender(walletAddress);
      const transactionRaw = await tx.build({
        client: this.publicClient,
        onlyTransactionKind: true,
      });

      const transactionRawBase64String = Buffer.from(transactionRaw).toString('base64');

      return {
        from: walletAddress,
        to: `${assetManager.packageId}::${assetManager.moduleId}::transfer`,
        value: amount,
        data: transactionRawBase64String,
      } as SuiReturnType<R>;
    }
    // Execute transaction
    return this.walletProvider.signAndExecuteTxn(tx) as PromiseSuiTxReturnType<R>;
  }

  public async getNativeCoin(tx: Transaction, amount: bigint): Promise<SuiNativeCoinResult> {
    const coin = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])[0];

    if (coin === undefined) {
      return Promise.reject(Error('[SuiIntentService.getNativeCoin] coin undefined'));
    }

    return coin;
  }

  public async getCoin(
    tx: Transaction,
    coin: string,
    amount: bigint,
    address: string,
  ): Promise<TransactionResult | SuiTxObject> {
    const coins = await this.walletProvider.getCoins(address, coin);

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

  async sendMessage<R extends boolean = false>(
    dst_chain_id: bigint,
    dst_address: Uint8Array,
    data: Uint8Array,
    raw?: R,
  ): PromiseSuiTxReturnType<R> {
    const txb = new Transaction();
    const connection = this.splitAddress(this.chainConfig.addresses.connection);
    // Perform send message transaction
    txb.moveCall({
      target: `${connection.packageId}::${connection.moduleId}::send_message_ua`,
      arguments: [
        txb.object(connection.stateId),
        txb.pure.u256(dst_chain_id),
        txb.pure(bcs.vector(bcs.u8()).serialize(dst_address)),
        txb.pure(bcs.vector(bcs.u8()).serialize(data)),
      ],
    });
    const walletAddress = await this.walletProvider.getWalletAddress();
    if (raw) {
      txb.setSender(walletAddress);
      const transactionRaw = await txb.build({
        client: this.publicClient,
        onlyTransactionKind: true,
      });
      const transactionRawBase64String = Buffer.from(transactionRaw).toString('base64');

      return {
        from: walletAddress,
        to: `${connection.packageId}::${connection.moduleId}::send_message_ua`,
        value: 0n,
        data: transactionRawBase64String,
      } as SuiReturnType<R>;
    }

    return this.walletProvider.signAndExecuteTxn(txb) as PromiseSuiTxReturnType<R>;
  }

  async configureAssetManagerHub(hubNetworkId: number, hubAssetManager: Uint8Array): Promise<string> {
    const tx = new Transaction();
    const assetmanager = this.splitAddress(await this.getAssetManagerAddress());

    tx.moveCall({
      target: `${assetmanager.packageId}::${assetmanager.moduleId}::set_hub_details`,
      arguments: [tx.object(assetmanager.stateId), tx.pure.u64(hubNetworkId), tx.pure.vector('u8', hubAssetManager)],
    });

    const result = await this.walletProvider.signAndExecuteTxn(tx);
    return result;
  }

  async getWalletAddress(): Promise<string> {
    return this.walletProvider.getWalletAddress();
  }

  static getAddressBCSBytes(suiaddress: string): Hex {
    return toHex(bcs.Address.serialize(suiaddress).toBytes());
  }

  async getAssetManagerAddress(): Promise<string> {
    if (!this.assetManagerAddress) {
      this.assetManagerAddress = await SuiSpokeService.fetchAssetManagerAddress(this);
    }
    return this.assetManagerAddress.toString();
  }
}
