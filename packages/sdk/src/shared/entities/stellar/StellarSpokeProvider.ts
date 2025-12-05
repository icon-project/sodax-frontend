import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Address,
  rpc as StellarRpc,
  nativeToScVal,
  TimeoutInfinite,
  scValToBigInt,
  Horizon,
  Account,
  type FeeBumpTransaction,
  Operation,
  SorobanRpc,
  type xdr,
  type Transaction,
} from '@stellar/stellar-sdk';
import type { StellarSpokeProviderType, TxReturnType } from '../../types.js';
import { toHex, type Hex } from 'viem';
import type { IRawSpokeProvider, ISpokeProvider } from '../Providers.js';
import type {
  IStellarWalletProvider,
  StellarRpcConfig,
  StellarSpokeChainConfig,
  WalletAddressProvider,
} from '@sodax/types';
import { STELLAR_DEFAULT_TX_TIMEOUT_SECONDS, STELLAR_PRIORITY_FEE } from '../../constants.js';
import { CustomSorobanServer } from './CustomSorobanServer.js';
import { isStellarRawSpokeProvider } from '../../guards.js';

export class CustomStellarAccount {
  private readonly accountId: string;
  private sequenceNumber: bigint;
  private readonly startingSequenceNumber: bigint;

  constructor({ account_id, sequence }: { account_id: string; sequence: string }) {
    this.accountId = account_id;
    this.sequenceNumber = BigInt(sequence);
    this.startingSequenceNumber = BigInt(sequence);
  }

  getSequenceNumber(): bigint {
    return this.sequenceNumber;
  }

  getStartingSequenceNumber(): bigint {
    return this.startingSequenceNumber;
  }

  getAccountId(): string {
    return this.accountId;
  }

  getAccountClone(): Account {
    return new Account(this.accountId, this.sequenceNumber.toString());
  }

  incrementSequenceNumber(): void {
    this.sequenceNumber++;
  }

  decrementSequenceNumber(): void {
    if (this.sequenceNumber > this.startingSequenceNumber) {
      this.sequenceNumber--;
    }

    throw new Error(
      `Sequence number cannot be decremented below the starting sequence number: ${this.startingSequenceNumber}`,
    );
  }

  resetSequenceNumber(): void {
    this.sequenceNumber = this.startingSequenceNumber;
  }
}

export class StellarBaseSpokeProvider {
  public readonly server: Horizon.Server;
  public readonly sorobanServer: CustomSorobanServer;
  public readonly contract: Contract;
  public readonly chainConfig: StellarSpokeChainConfig;

  constructor(config: StellarSpokeChainConfig, rpcConfig?: StellarRpcConfig) {
    this.chainConfig = config;
    this.server = new Horizon.Server(
      rpcConfig && rpcConfig.horizonRpcUrl ? rpcConfig.horizonRpcUrl : config.horizonRpcUrl,
      { allowHttp: true },
    );
    this.sorobanServer = new CustomSorobanServer(
      rpcConfig && rpcConfig.sorobanRpcUrl ? rpcConfig.sorobanRpcUrl : config.sorobanRpcUrl,
      {},
    );
    this.contract = new Contract(config.addresses.assetManager);
  }

  public static async getBalance(tokenAddress: string, provider: StellarSpokeProviderType): Promise<number> {
    const [network, walletAddress] = await Promise.all([
      provider.sorobanServer.getNetwork(),
      provider.walletProvider.getWalletAddress(),
    ]);
    const sourceAccount = await provider.sorobanServer.getAccount(walletAddress);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: network.passphrase,
    })
      .addOperation(provider.contract.call('get_token_balance', nativeToScVal(tokenAddress, { type: 'address' })))
      .setTimeout(TimeoutInfinite)
      .build();

    const result = await provider.sorobanServer.simulateTransaction(tx);

    if (StellarRpc.Api.isSimulationError(result)) {
      throw new Error('Failed to simulate transaction');
    }

    const resultValue = result.result;

    if (resultValue) {
      return Number(scValToBigInt(resultValue.retval));
    }

    throw new Error('result undefined');
  }

  public static async buildPriorityStellarTransaction(
    account: CustomStellarAccount,
    network: StellarRpc.Api.GetNetworkResponse,
    operation: xdr.Operation<Operation.InvokeHostFunction>,
    provider: StellarSpokeProviderType,
  ): Promise<[Transaction, StellarRpc.Api.SimulateTransactionResponse]> {
    const simulationForFee = await provider.sorobanServer.simulateTransaction(
      new TransactionBuilder(account.getAccountClone(), {
        fee: BASE_FEE,
        networkPassphrase: network.passphrase,
      })
        .addOperation(operation)
        .setTimeout(STELLAR_DEFAULT_TX_TIMEOUT_SECONDS)
        .build(),
    );

    if (!StellarRpc.Api.isSimulationSuccess(simulationForFee)) {
      throw new Error(`Simulation error: ${JSON.stringify(simulationForFee)}`);
    }

    // note new account info must be loaded because local account sequence increments for every created tx
    const priorityTransaction = new TransactionBuilder(account.getAccountClone(), {
      fee: (
        BigInt(simulationForFee.minResourceFee) +
        BigInt(STELLAR_PRIORITY_FEE) +
        BigInt(BASE_FEE.toString())
      ).toString(),
      networkPassphrase: network.passphrase,
    })
      .addOperation(operation)
      .setTimeout(STELLAR_DEFAULT_TX_TIMEOUT_SECONDS)
      .build();

    const simulation = await provider.sorobanServer.simulateTransaction(priorityTransaction);

    return [priorityTransaction, simulation];
  }

  public static async deposit<S extends StellarSpokeProviderType, R extends boolean = false>(
    token: string,
    amount: string,
    recipient: Uint8Array,
    data: Uint8Array,
    provider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    try {
      const [network, walletAddress] = await Promise.all([
        provider.sorobanServer.getNetwork(),
        provider.walletProvider.getWalletAddress(),
      ]);

      const accountResponse = await provider.server.loadAccount(walletAddress);
      const stellarAccount = new CustomStellarAccount(accountResponse);

      const depositCall = StellarBaseSpokeProvider.buildDepositCall(
        walletAddress,
        token,
        amount,
        recipient,
        data,
        provider,
      );
      const [rawPriorityTx, simulation] = await StellarBaseSpokeProvider.buildPriorityStellarTransaction(
        stellarAccount,
        network,
        depositCall,
        provider,
      );
      const assembledPriorityTx = SorobanRpc.assembleTransaction(rawPriorityTx, simulation).build();
      if (raw || isStellarRawSpokeProvider(provider)) {
        const transactionXdr = rawPriorityTx.toXDR();

        return {
          from: walletAddress,
          to: provider.chainConfig.addresses.assetManager,
          value: BigInt(amount),
          data: transactionXdr,
        } satisfies TxReturnType<StellarSpokeProviderType, true> as TxReturnType<S, R>;
      }

      const hash = await provider.submitOrRestoreAndRetry(
        stellarAccount,
        network,
        assembledPriorityTx,
        depositCall,
        simulation,
      );

      return `${hash}` satisfies TxReturnType<StellarSpokeProviderType, false> as TxReturnType<S, R>;
    } catch (error) {
      console.error('Error during deposit:', error);
      throw error;
    }
  }

  public static buildDepositCall(
    walletAddress: string,
    token: string,
    amount: string,
    recipient: Uint8Array,
    data: Uint8Array,
    provider: StellarSpokeProviderType,
  ): xdr.Operation<Operation.InvokeHostFunction> {
    return provider.contract.call(
      'transfer',
      nativeToScVal(Address.fromString(walletAddress), { type: 'address' }),
      nativeToScVal(Address.fromString(token), {
        type: 'address',
      }),
      nativeToScVal(BigInt(amount), { type: 'u128' }),
      nativeToScVal(Buffer.from(recipient), { type: 'bytes' }),
      nativeToScVal(Buffer.from(data), { type: 'bytes' }),
    );
  }

  public static async sendMessage<S extends StellarSpokeProviderType, R extends boolean = false>(
    dst_chain_id: string,
    dst_address: Uint8Array,
    payload: Uint8Array,
    provider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    try {
      const [network, walletAddress] = await Promise.all([
        provider.sorobanServer.getNetwork(),
        provider.walletProvider.getWalletAddress(),
      ]);
      const accountResponse = await provider.server.loadAccount(walletAddress);
      const stellarAccount = new CustomStellarAccount(accountResponse);

      const sendMessageCall = StellarBaseSpokeProvider.buildSendMessageCall(
        walletAddress,
        dst_chain_id,
        dst_address,
        payload,
        provider,
      );

      const [rawPriorityTx, simulation] = await StellarBaseSpokeProvider.buildPriorityStellarTransaction(
        stellarAccount,
        network,
        sendMessageCall,
        provider,
      );

      const assembledPriorityTx = SorobanRpc.assembleTransaction(rawPriorityTx, simulation).build();

      if (raw || isStellarRawSpokeProvider(provider)) {
        const transactionXdr = rawPriorityTx.toXDR();

        return {
          from: walletAddress,
          to: provider.chainConfig.addresses.assetManager,
          value: 0n,
          data: transactionXdr,
        } satisfies TxReturnType<StellarSpokeProviderType, true> as TxReturnType<S, R>;
      }

      const hash = await provider.submitOrRestoreAndRetry(
        stellarAccount,
        network,
        assembledPriorityTx,
        sendMessageCall,
        simulation,
      );

      return `${hash}` satisfies TxReturnType<StellarSpokeProviderType, false> as TxReturnType<S, R>;
    } catch (error) {
      console.error('Error during sendMessage:', error);
      throw error;
    }
  }

  public static buildSendMessageCall(
    walletAddress: string,
    dst_chain_id: string,
    dst_address: Uint8Array,
    payload: Uint8Array,
    provider: StellarSpokeProviderType,
  ): xdr.Operation<Operation.InvokeHostFunction> {
    const connection = new Contract(provider.chainConfig.addresses.connection);

    return connection.call(
      'send_message',
      nativeToScVal(Address.fromString(walletAddress), { type: 'address' }),
      nativeToScVal(dst_chain_id, { type: 'u128' }),
      nativeToScVal(Buffer.from(dst_address), { type: 'bytes' }),
      nativeToScVal(Buffer.from(payload), { type: 'bytes' }),
    );
  }
}

export class StellarRawSpokeProvider extends StellarBaseSpokeProvider implements IRawSpokeProvider {
  public readonly walletProvider: WalletAddressProvider;
  public readonly raw = true;

  constructor(walletAddress: string, chainConfig: StellarSpokeChainConfig, rpcConfig?: StellarRpcConfig) {
    super(chainConfig, rpcConfig);
    this.walletProvider = {
      getWalletAddress: async () => walletAddress,
    };
  }
}

export class StellarSpokeProvider extends StellarBaseSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IStellarWalletProvider;

  constructor(walletProvider: IStellarWalletProvider, config: StellarSpokeChainConfig, rpcConfig?: StellarRpcConfig) {
    super(config, rpcConfig);
    this.walletProvider = walletProvider;
  }

  private handleSendTransactionError(
    response: SorobanRpc.Api.SendTransactionResponse,
  ): SorobanRpc.Api.SendTransactionResponse {
    if (response.status === 'ERROR') {
      console.error(JSON.stringify(response, null, 2));
      throw new Error(JSON.stringify(response, null, 2));
    }

    return response;
  }

  public async signAndSendTransaction(
    tx: Transaction | FeeBumpTransaction,
    waitForTransaction = true,
  ): Promise<string> {
    const signedTransaction = await this.walletProvider.signTransaction(tx.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedTransaction, tx.networkPassphrase) as Transaction;

    const response = this.handleSendTransactionError(await this.sorobanServer.sendTransaction(signedTx));

    if (waitForTransaction) {
      return await this.waitForTransaction(response.hash);
    }

    return response.hash;
  }

  private async waitForTransaction(hash: string, attempts = 60): Promise<string> {
    if (attempts === 0) {
      throw new Error(
        '[StellarSpokeProvider.waitForTransaction] Timeout error. Transaction not found after 5 attempts',
      );
    }

    const response = await this.sorobanServer.getTransaction(hash);

    if (response.status === StellarRpc.Api.GetTransactionStatus.SUCCESS) {
      return hash;
    }
    if (response.status === StellarRpc.Api.GetTransactionStatus.FAILED) {
      throw response;
    }

    // sleep for 1000ms
    await new Promise(resolve => setTimeout(resolve, 1000));

    return this.waitForTransaction(hash, attempts - 1);
  }

  public async submitOrRestoreAndRetry(
    account: CustomStellarAccount,
    network: StellarRpc.Api.GetNetworkResponse,
    tx: Transaction,
    operation: xdr.Operation<Operation.InvokeHostFunction>,
    simulation?: StellarRpc.Api.SimulateTransactionResponse,
  ): Promise<string> {
    const initialSimulation = simulation ?? (await this.sorobanServer.simulateTransaction(tx));

    if (!StellarRpc.Api.isSimulationSuccess(initialSimulation)) {
      throw new Error(
        `[StellarSpokeProvider.submitOrRestoreAndRetry] Simulation Failed: ${JSON.stringify(initialSimulation)}`,
      );
    }

    // check if restore is needed
    let restored = false;
    if (StellarRpc.Api.isSimulationRestore(initialSimulation)) {
      try {
        await this.handleSimulationRestore(
          initialSimulation.restorePreamble.minResourceFee,
          initialSimulation.restorePreamble.transactionData.build(),
          account,
          network,
        );
        restored = true;
      } catch (error) {
        throw new Error(
          `[StellarSpokeProvider.submitOrRestoreAndRetry] Simulation Restore Failed: ${JSON.stringify(error)}`,
        );
      }
    }

    // if restore is not needed, submit the tx and return the response
    if (!restored) {
      return await this.signAndSendTransaction(tx);
    }

    // increment sequence number because restore tx used current sequence number
    const newAccount = account.getAccountClone();
    newAccount.incrementSequenceNumber();

    return await this.signAndSendTransaction(
      new TransactionBuilder(newAccount, {
        fee: BASE_FEE,
        networkPassphrase: network.passphrase,
      })
        .addOperation(operation)
        .setTimeout(STELLAR_DEFAULT_TX_TIMEOUT_SECONDS)
        .build(),
    );
  }

  private async handleSimulationRestore(
    minResourceFee: string,
    transactionData: xdr.SorobanTransactionData,
    account: CustomStellarAccount,
    network: StellarRpc.Api.GetNetworkResponse,
  ): Promise<string> {
    // Build the restoration operation using the RPC server's hints.
    const totalFee = (BigInt(BASE_FEE) + BigInt(STELLAR_PRIORITY_FEE) + BigInt(minResourceFee)).toString();

    return this.signAndSendTransaction(
      new TransactionBuilder(account.getAccountClone(), { fee: totalFee })
        .setNetworkPassphrase(network.passphrase)
        .setSorobanData(transactionData)
        .addOperation(Operation.restoreFootprint({}))
        .setTimeout(STELLAR_DEFAULT_TX_TIMEOUT_SECONDS)
        .build(),
    );
  }

  static getAddressBCSBytes(stellaraddress: string): Hex {
    return `0x${Address.fromString(stellaraddress).toScVal().toXDR('hex')}`;
  }

  static getTsWalletBytes(stellaraddress: string): Hex {
    return toHex(Buffer.from(stellaraddress, 'hex'));
  }
}
