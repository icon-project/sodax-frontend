import { fromHex, toHex, type Hex } from 'viem';
import type {
  EstimateGasParams,
  GetDepositParams,
  DepositParams,
  SendMessageParams,
  WaitForTxReceiptParams,
  WaitForTxReceiptReturnType,
} from '../../types/spoke-types.js';
import type { ConfigService } from '../../config/ConfigService.js';
import { CustomSorobanServer } from '../../entities/stellar/CustomSorobanServer.js';
import { parseToStroops, sleep } from '../../utils/shared-utils.js';
import {
  rpc,
  Asset,
  Contract,
  Address,
  FeeBumpTransaction,
  rpc as StellarRpc,
  nativeToScVal,
  TimeoutInfinite,
  scValToBigInt,
  Horizon,
  Account,
  Operation,
  SorobanRpc,
  type xdr,
  type Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import {
  ChainKeys,
  getIntentRelayChainId,
  spokeChainConfig,
  type HubAddress,
  type IStellarWalletProvider,
  type Result,
  type StellarChainKey,
  type StellarGasEstimate,
  type StellarSorobanTransactionReceipt,
  type StellarSpokeChainConfig,
  type TxReturnType,
  type WalletProviderSlot,
} from '@sodax/types';

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

export type StellarSpokeDepositParams = {
  from: Hex; // The address of the user on the spoke chain
  to?: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: string; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export type StellarTransferToHubParams = {
  token: string;
  recipient: Address;
  amount: bigint;
  data: Hex;
};

export type RequestTrustlineParams<S extends StellarChainKey, Raw extends boolean> = {
  srcAddress: string;
  srcChainKey: S;
  token: string;
  amount: bigint;
} & WalletProviderSlot<S, Raw>;

export class StellarSpokeService {
  private readonly chainConfig: StellarSpokeChainConfig;
  public readonly server: Horizon.Server;
  public readonly sorobanServer: CustomSorobanServer;
  private readonly pollingIntervalMs: number;
  private readonly maxTimeoutMs: number;
  private readonly priorityFee: string;
  private readonly baseFee: string;

  constructor(config: ConfigService) {
    this.chainConfig = config.sodaxConfig.chains[ChainKeys.STELLAR_MAINNET];

    // since we only support mainnet for now, we can hardcode the single stellar chain config
    this.server = new Horizon.Server(this.chainConfig.horizonRpcUrl, {
      allowHttp: true,
    });
    this.sorobanServer = new CustomSorobanServer(this.chainConfig.sorobanRpcUrl, {});
    this.pollingIntervalMs = this.chainConfig.pollingConfig.pollingIntervalMs;
    this.maxTimeoutMs = this.chainConfig.pollingConfig.maxTimeoutMs;
    this.priorityFee = this.chainConfig.priorityFee;
    this.baseFee = this.chainConfig.baseFee;
  }

  public async getBalance(params: GetDepositParams<StellarChainKey>): Promise<number> {
    const contract = new Contract(spokeChainConfig[params.srcChainKey].addresses.assetManager);
    const [network, sourceAccount] = await Promise.all([
      this.sorobanServer.getNetwork(),
      this.sorobanServer.getAccount(params.srcAddress),
    ]);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: this.baseFee,
      networkPassphrase: network.passphrase,
    })
      .addOperation(contract.call('get_token_balance', nativeToScVal(params.srcAddress, { type: 'address' })))
      .setTimeout(TimeoutInfinite)
      .build();

    const result = await this.sorobanServer.simulateTransaction(tx);

    if (StellarRpc.Api.isSimulationError(result)) {
      throw new Error('Failed to simulate transaction');
    }

    const resultValue = result.result;

    if (resultValue) {
      return Number(scValToBigInt(resultValue.retval));
    }

    throw new Error('result undefined');
  }

  public async buildPriorityStellarTransaction(
    account: CustomStellarAccount,
    network: StellarRpc.Api.GetNetworkResponse,
    operation: xdr.Operation<Operation.InvokeHostFunction>,
  ): Promise<[Transaction, StellarRpc.Api.SimulateTransactionResponse]> {
    const simulationForFee = await this.sorobanServer.simulateTransaction(
      new TransactionBuilder(account.getAccountClone(), {
        fee: this.baseFee,
        networkPassphrase: network.passphrase,
      })
        .addOperation(operation)
        .setTimeout(this.maxTimeoutMs)
        .build(),
    );

    if (!StellarRpc.Api.isSimulationSuccess(simulationForFee)) {
      throw new Error(`Simulation error: ${JSON.stringify(simulationForFee)}`);
    }

    // note new account info must be loaded because local account sequence increments for every created tx
    const priorityTransaction = new TransactionBuilder(account.getAccountClone(), {
      fee: (BigInt(simulationForFee.minResourceFee) + BigInt(this.priorityFee) + BigInt(this.baseFee)).toString(),
      networkPassphrase: network.passphrase,
    })
      .addOperation(operation)
      .setTimeout(this.maxTimeoutMs)
      .build();

    const simulation = await this.sorobanServer.simulateTransaction(priorityTransaction);

    return [priorityTransaction, simulation];
  }

  public buildDepositCall<Raw extends boolean>(
    params: DepositParams<StellarChainKey, Raw>,
  ): xdr.Operation<Operation.InvokeHostFunction> {
    const contract = new Contract(spokeChainConfig[params.srcChainKey].addresses.assetManager);
    return contract.call(
      'transfer',
      nativeToScVal(Address.fromString(params.srcAddress), { type: 'address' }),
      nativeToScVal(Address.fromString(params.token), {
        type: 'address',
      }),
      nativeToScVal(BigInt(params.amount), { type: 'u128' }),
      nativeToScVal(Buffer.from(fromHex(params.to, 'bytes')), { type: 'bytes' }),
      nativeToScVal(Buffer.from(fromHex(params.data, 'bytes')), { type: 'bytes' }),
    );
  }

  public buildSendMessageCall<Raw extends boolean>(
    params: SendMessageParams<StellarChainKey, Raw>,
  ): xdr.Operation<Operation.InvokeHostFunction> {
    const connection = new Contract(this.chainConfig.addresses.connection);

    return connection.call(
      'send_message',
      nativeToScVal(Address.fromString(params.srcAddress), { type: 'address' }),
      nativeToScVal(BigInt(getIntentRelayChainId(params.dstChainKey)), { type: 'u128' }),
      nativeToScVal(Buffer.from(fromHex(params.dstAddress, 'bytes')), { type: 'bytes' }),
      nativeToScVal(Buffer.from(fromHex(params.payload, 'bytes')), { type: 'bytes' }),
    );
  }

  public async sendMessage<Raw extends boolean>(
    params: SendMessageParams<StellarChainKey, Raw>,
  ): Promise<TxReturnType<StellarChainKey, Raw>> {
    try {
      const { srcAddress: from, srcChainKey: fromChainId } = params;
      const [network, accountResponse] = await Promise.all([
        this.sorobanServer.getNetwork(),
        this.server.loadAccount(from),
      ]);
      const stellarAccount = new CustomStellarAccount(accountResponse);

      const sendMessageCall = this.buildSendMessageCall(params);

      const [rawPriorityTx, simulation] = await this.buildPriorityStellarTransaction(
        stellarAccount,
        network,
        sendMessageCall,
      );

      const assembledPriorityTx = SorobanRpc.assembleTransaction(rawPriorityTx, simulation).build();

      if (params.raw) {
        const transactionXdr = rawPriorityTx.toXDR();

        return {
          from: from,
          to: spokeChainConfig[fromChainId].addresses.assetManager,
          value: 0n,
          data: transactionXdr,
        } satisfies TxReturnType<StellarChainKey, true> as TxReturnType<StellarChainKey, Raw>;
      }

      const walletProvider = params.walletProvider;
      const hash = await this.submitOrRestoreAndRetry(
        walletProvider,
        stellarAccount,
        network,
        assembledPriorityTx,
        sendMessageCall,
        simulation,
      );

      return `${hash}` satisfies TxReturnType<StellarChainKey, false> as TxReturnType<StellarChainKey, Raw>;
    } catch (error) {
      console.error('Error during sendMessage:', error);
      throw error;
    }
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
    walletProvider: IStellarWalletProvider,
    tx: Transaction | FeeBumpTransaction,
    waitForTransaction = true,
  ): Promise<string> {
    const signedTransaction = await walletProvider.signTransaction(tx.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedTransaction, tx.networkPassphrase) as Transaction;

    const response = this.handleSendTransactionError(await this.sorobanServer.sendTransaction(signedTx));

    if (waitForTransaction) {
      const result = await this.waitForTransactionReceipt({
        txHash: response.hash,
        chainKey: ChainKeys.STELLAR_MAINNET,
      });
      if (result.ok && result.value.status === 'success') {
        return response.hash;
      }
      const error = result.ok && 'error' in result.value ? result.value.error : new Error('Transaction failed');
      throw error;
    }

    return response.hash;
  }

  public async submitOrRestoreAndRetry(
    walletProvider: IStellarWalletProvider,
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
          walletProvider,
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
      return await this.signAndSendTransaction(walletProvider, tx);
    }

    // increment sequence number because restore tx used current sequence number
    const newAccount = account.getAccountClone();
    newAccount.incrementSequenceNumber();

    return await this.signAndSendTransaction(
      walletProvider,
      new TransactionBuilder(newAccount, {
        fee: this.baseFee,
        networkPassphrase: network.passphrase,
      })
        .addOperation(operation)
        .setTimeout(this.maxTimeoutMs)
        .build(),
    );
  }

  private async handleSimulationRestore(
    walletProvider: IStellarWalletProvider,
    minResourceFee: string,
    transactionData: xdr.SorobanTransactionData,
    account: CustomStellarAccount,
    network: StellarRpc.Api.GetNetworkResponse,
  ): Promise<string> {
    // Build the restoration operation using the RPC server's hints.
    const totalFee = (BigInt(this.baseFee) + BigInt(this.priorityFee) + BigInt(minResourceFee)).toString();

    return this.signAndSendTransaction(
      walletProvider,
      new TransactionBuilder(account.getAccountClone(), { fee: totalFee })
        .setNetworkPassphrase(network.passphrase)
        .setSorobanData(transactionData)
        .addOperation(Operation.restoreFootprint({}))
        .setTimeout(this.maxTimeoutMs)
        .build(),
    );
  }

  static getAddressBCSBytes(stellaraddress: string): Hex {
    return `0x${Address.fromString(stellaraddress).toScVal().toXDR('hex')}`;
  }

  static getTsWalletBytes(stellaraddress: string): Hex {
    return toHex(Buffer.from(stellaraddress, 'hex'));
  }

  /**
   * Deposit tokens to the spoke chain.
   * @param {DepositParams<StellarChainKey, R>} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<TxReturnType<StellarChainKey, R>>} A promise that resolves to the transaction hash or raw transaction.
   */
  public async deposit<R extends boolean = false>(
    params: DepositParams<StellarChainKey, R>,
  ): Promise<TxReturnType<StellarChainKey, R>> {
    try {
      const { srcAddress: from, srcChainKey: fromChainId, amount } = params;
      const network = await this.sorobanServer.getNetwork();

      const accountResponse = await this.server.loadAccount(from);
      const stellarAccount = new CustomStellarAccount(accountResponse);

      const depositCall = this.buildDepositCall(params);
      const [rawPriorityTx, simulation] = await this.buildPriorityStellarTransaction(
        stellarAccount,
        network,
        depositCall,
      );

      const assembledPriorityTx = SorobanRpc.assembleTransaction(rawPriorityTx, simulation).build();

      if (params.raw) {
        const transactionXdr = rawPriorityTx.toXDR();

        return {
          from: from,
          to: spokeChainConfig[fromChainId].addresses.assetManager,
          value: BigInt(amount),
          data: transactionXdr,
        } satisfies TxReturnType<StellarChainKey, true> as TxReturnType<StellarChainKey, R>;
      }

      const walletProvider = params.walletProvider;
      const hash = await this.submitOrRestoreAndRetry(
        walletProvider,
        stellarAccount,
        network,
        assembledPriorityTx,
        depositCall,
        simulation,
      );

      return `${hash}` satisfies TxReturnType<StellarChainKey, false> as TxReturnType<StellarChainKey, R>;
    } catch (error) {
      console.error('Error during deposit:', error);
      throw error;
    }
  }

  /**
   * Check if the user has sufficient trustline established for the token.
   * @param token - The token address to check the trustline for.
   * @param amount - The amount of tokens to check the trustline for.
   * @param walletAddress - The Stellar wallet address.
   * @returns True if the user has sufficient trustline established for the token, false otherwise.
   */
  public async hasSufficientTrustline(token: string, amount: bigint, walletAddress: string): Promise<boolean> {
    const stellarChainConfig = spokeChainConfig[ChainKeys.STELLAR_MAINNET];
    // native token and legacy bnUSD do not require trustline
    if (
      token.toLowerCase() === stellarChainConfig.nativeToken.toLowerCase() ||
      token.toLowerCase() === stellarChainConfig.supportedTokens.legacybnUSD.address.toLowerCase()
    ) {
      return true;
    }

    const trustlineConfig = stellarChainConfig.trustlineConfigs.find(
      config => config.contractId.toLowerCase() === token.toLowerCase(),
    );

    if (!trustlineConfig) {
      throw new Error(`Trustline config not found for token: ${token}`);
    }

    const { balances } = await this.server.accounts().accountId(walletAddress).call();

    const tokenBalance = balances.find(
      balance =>
        'limit' in balance &&
        'balance' in balance &&
        'asset_code' in balance &&
        trustlineConfig.assetCode.toLowerCase() === balance.asset_code?.toLowerCase() &&
        'asset_issuer' in balance &&
        trustlineConfig.assetIssuer.toLowerCase() === balance.asset_issuer?.toLowerCase(),
    ) as Horizon.HorizonApi.BalanceLineAsset<'credit_alphanum4' | 'credit_alphanum12'> | undefined;

    if (!tokenBalance) {
      console.error(`No token balances found for token: ${token}`);
      return false;
    }

    const limit = parseToStroops(tokenBalance.limit);
    const balance = parseToStroops(tokenBalance.balance);
    const availableTrustAmount: bigint = limit - balance;

    return availableTrustAmount >= amount;
  }

  /**
   * Request a trustline for a given token and amount.
   * @param token - The token address to request the trustline for.
   * @param amount - The amount of tokens to request the trustline for.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns The transaction result.
   */
  public async requestTrustline<Raw extends boolean>(
    params: RequestTrustlineParams<StellarChainKey, Raw>,
  ): Promise<TxReturnType<StellarChainKey, Raw>> {
    try {
      const { srcAddress: from, srcChainKey: fromChainId, token, amount } = params;
      const asset = spokeChainConfig[fromChainId].trustlineConfigs.find(
        t => t.contractId.toLowerCase() === token.toLowerCase(),
      );

      if (!asset) {
        throw new Error(`Asset ${token} not found. Cannot proceed with trustline.`);
      }

      const [network, accountResponse] = await Promise.all([
        this.sorobanServer.getNetwork(),
        this.server.loadAccount(from),
      ]);

      const stellarAccount = new CustomStellarAccount(accountResponse);

      const transaction = new TransactionBuilder(stellarAccount.getAccountClone(), {
        fee: this.baseFee,
        networkPassphrase: network.passphrase,
      })
        .addOperation(
          Operation.changeTrust({
            asset: new Asset(asset?.assetCode, asset?.assetIssuer),
          }),
        )
        .setTimeout(this.maxTimeoutMs)
        .build();

      if (params.raw) {
        const transactionXdr = transaction.toXDR();

        return {
          from: from,
          to: spokeChainConfig[fromChainId].addresses.assetManager,
          value: amount,
          data: transactionXdr,
        } satisfies TxReturnType<StellarChainKey, true> as TxReturnType<StellarChainKey, Raw>;
      }

      const walletProvider = params.walletProvider;
      const hash = await this.signAndSendTransaction(walletProvider, transaction);

      return `${hash}` satisfies TxReturnType<StellarChainKey, false> as TxReturnType<StellarChainKey, Raw>;
    } catch (error) {
      console.error('Error during requestTrustline:', error);
      throw error;
    }
  }

  /**
   * Estimate the gas for a transaction.
   * @param rawTx - The raw transaction to estimate the gas for.
   * @param spokeProvider - The spoke provider.
   * @returns The estimated gas (minResourceFee) for the transaction.
   */
  public async estimateGas(params: EstimateGasParams<StellarChainKey>): Promise<StellarGasEstimate> {
    const network = await this.sorobanServer.getNetwork();
    let tx: Transaction | FeeBumpTransaction = TransactionBuilder.fromXDR(params.tx.data, network.passphrase);

    if (tx instanceof FeeBumpTransaction) {
      tx = tx.innerTransaction;
    }

    const simulationForFee = await this.sorobanServer.simulateTransaction(tx);

    if (!rpc.Api.isSimulationSuccess(simulationForFee)) {
      throw new Error(`Simulation error: ${JSON.stringify(simulationForFee)}`);
    }

    return BigInt(simulationForFee.minResourceFee);
  }

  /**
   * Get the balance of the token in the spoke chain asset manager.
   * @param token - The address of the token to get the balance of.
   * @param spokeProvider - The spoke provider.
   * @returns The balance of the token.
   */
  public async getDeposit(params: GetDepositParams<StellarChainKey>): Promise<bigint> {
    return BigInt(await this.getBalance(params));
  }

  public async waitForTransactionReceipt(
    params: WaitForTxReceiptParams<StellarChainKey>,
  ): Promise<Result<WaitForTxReceiptReturnType<StellarChainKey>>> {
    const { txHash, pollingIntervalMs = this.pollingIntervalMs, maxTimeoutMs = this.maxTimeoutMs } = params;
    const maxAttempts = Math.round(maxTimeoutMs / pollingIntervalMs);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const tx = await this.sorobanServer.getTransaction(txHash);

        if (tx && tx.status === 'SUCCESS') {
          return { ok: true, value: { status: 'success', receipt: tx satisfies StellarSorobanTransactionReceipt } };
        }

        if (tx && tx.status === 'FAILED') {
          return {
            ok: true,
            value: { status: 'failure', error: new Error(`Transaction failed: ${JSON.stringify(tx)}`) },
          };
        }

        if (tx && tx.status === 'NOT_FOUND') {
          await sleep(pollingIntervalMs);
          continue;
        }

        await sleep(pollingIntervalMs);
      } catch {
        await sleep(pollingIntervalMs);
      }
    }

    return {
      ok: true,
      value: { status: 'timeout', error: new Error(`Transaction was not confirmed within ${maxAttempts} attempts`) },
    };
  }
}
