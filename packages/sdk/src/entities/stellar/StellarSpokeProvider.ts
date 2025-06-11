import {
  Keypair,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Address,
  rpc as StellarRpc,
  nativeToScVal,
  TimeoutInfinite,
  scValToBigInt,
} from '@stellar/stellar-sdk';
import type { PromiseStellarTxReturnType, StellarReturnType } from '../../types.js';
import { toHex, type Hex } from 'viem';
import type { ISpokeProvider, WalletAddressProvider } from '../Providers.js';
import type { Server } from '@stellar/stellar-sdk/rpc';
import type { StellarSpokeChainConfig } from '@sodax/types';

export class StellarWalletProvider implements WalletAddressProvider {
  private readonly _keypair: Keypair;

  constructor(secretKey: string) {
    this._keypair = Keypair.fromSecret(secretKey);
  }

  getWalletAddress(): string {
    console.log('Public key is:', this._keypair.publicKey());
    return this._keypair.publicKey();
  }

  getWalletAddressBytes(): Hex {
    return StellarSpokeProvider.getAddressBCSBytes(this.getWalletAddress());
  }

  get keypair(): Keypair {
    return this._keypair;
  }
}

export class StellarSpokeProvider implements ISpokeProvider {
  private readonly server: Server;
  private readonly contract: Contract;
  public readonly chainConfig: StellarSpokeChainConfig;
  public readonly walletProvider: StellarWalletProvider;

  constructor(
    walletProvider: StellarWalletProvider,
    contractAddress: string,
    config: StellarSpokeChainConfig,
    rpc: string,
  ) {
    this.server = new StellarRpc.Server(rpc);
    this.walletProvider = walletProvider;
    this.contract = new Contract(contractAddress);
    this.chainConfig = config;
  }

  async getBalance(tokenAddress: string): Promise<number> {
    const sourceAccount = await this.server.getAccount(this.walletProvider.keypair.publicKey());

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: (await this.server.getNetwork()).passphrase,
    })
      .addOperation(this.contract.call('get_token_balance', nativeToScVal(tokenAddress, { type: 'address' })))
      .setTimeout(TimeoutInfinite)
      .build();

    const result = await this.server.simulateTransaction(tx);

    if (StellarRpc.Api.isSimulationError(result)) {
      throw new Error('Failed to simulate transaction');
    }

    const resultValue = result.result;

    if (resultValue) {
      return Number(scValToBigInt(resultValue.retval));
    }

    throw new Error('result undefined');
  }

  async deposit<R extends boolean = false>(
    token: string,
    amount: string,
    recipient: Uint8Array,
    data: Uint8Array,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    try {
      const sourceAccount = await this.server.getAccount(this.walletProvider.keypair.publicKey());
      const simulateTx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: (await this.server.getNetwork()).passphrase,
      })
        .addOperation(
          this.contract.call(
            'transfer',
            nativeToScVal(Address.fromString(this.walletProvider.keypair.publicKey()), { type: 'address' }),
            nativeToScVal(Address.fromString(token), {
              type: 'address',
            }),
            nativeToScVal(BigInt(amount), { type: 'u128' }),
            nativeToScVal(recipient),
            nativeToScVal(Buffer.from(data), { type: 'bytes' }),
          ),
        )
        .setTimeout(100)
        .build();

      const simResult = await this.server.simulateTransaction(simulateTx);
      const tx = StellarRpc.assembleTransaction(simulateTx, simResult).build();

      if (raw) {
        const transactionXdr = tx.toXDR();

        return {
          from: this.walletProvider.getWalletAddress(),
          to: this.chainConfig.addresses.assetManager,
          value: BigInt(amount),
          data: transactionXdr,
        } as StellarReturnType<R>;
      }

      if (tx) {
        tx.sign(this.walletProvider.keypair);
        const sendResponse = await this.server.sendTransaction(tx);
        if (sendResponse.hash) {
          return `0x${sendResponse.hash}` as StellarReturnType<R>;
        }
      }
      throw new Error('Failed to create transaction');
    } catch (error) {
      console.error('Error during deposit:', error);
      throw error;
    }
  }

  async sendMessage<R extends boolean = false>(
    dst_chain_id: string,
    dst_address: Uint8Array,
    payload: Uint8Array,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    try {
      const sourceAccount = await this.server.getAccount(this.walletProvider.keypair.publicKey());
      const connection = new Contract(this.chainConfig.addresses.connection);

      const simulateTx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: (await this.server.getNetwork()).passphrase,
      })
        .addOperation(
          connection.call(
            'send_message',
            nativeToScVal(Address.fromString(this.walletProvider.keypair.publicKey()), { type: 'address' }),
            nativeToScVal(dst_chain_id, { type: 'u128' }),
            nativeToScVal(Buffer.from(dst_address), { type: 'bytes' }),
            nativeToScVal(Buffer.from(payload), { type: 'bytes' }),
          ),
        )
        .setTimeout(100)
        .build();

      const simResult = await this.server.simulateTransaction(simulateTx);
      const tx = StellarRpc.assembleTransaction(simulateTx, simResult).build();

      if (raw) {
        const transactionXdr = tx.toXDR();
        return {
          from: this.walletProvider.getWalletAddress(),
          to: this.chainConfig.addresses.assetManager,
          value: 0n,
          data: transactionXdr,
        } as StellarReturnType<R>;
      }
      if (tx) {
        tx.sign(this.walletProvider.keypair);
        const sendResponse = await this.server.sendTransaction(tx);
        if (sendResponse.hash) {
          return `0x${sendResponse.hash}` as StellarReturnType<R>;
        }
      }
      throw new Error('Failed to create transaction');
    } catch (error) {
      console.error('Error during deposit:', error);
      throw error;
    }
  }

  static getAddressBCSBytes(stellaraddress: string): Hex {
    return `0x${Address.fromString(stellaraddress).toScVal().toXDR('hex')}`;
  }

  static getTsWalletBytes(stellaraddress: string): Hex {
    return toHex(Buffer.from(stellaraddress, 'hex'));
  }
}
