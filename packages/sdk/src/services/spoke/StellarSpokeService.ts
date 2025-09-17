import { type Address, type Hex, fromHex } from 'viem';
import type { EvmHubProvider } from '../../entities/index.js';
import type { StellarSpokeProvider } from '../../entities/stellar/StellarSpokeProvider.js';
import {
  CustomStellarAccount,
  type DepositSimulationParams,
  type HubAddress,
  type PromiseStellarTxReturnType,
  STELLAR_DEFAULT_TX_TIMEOUT_SECONDS,
  type StellarGasEstimate,
  type StellarRawTransaction,
  type StellarReturnType,
  encodeAddress,
  getIntentRelayChainId,
  parseToStroops,
  spokeChainConfig,
} from '../../index.js';
import { EvmWalletAbstraction } from '../hub/index.js';
import {
  FeeBumpTransaction,
  type Transaction,
  TransactionBuilder,
  rpc,
  type Horizon,
  Operation,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { STELLAR_MAINNET_CHAIN_ID } from '@sodax/types';

export type StellarSpokeDepositParams = {
  from: Hex; // The address of the user on the spoke chain
  to?: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: string; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export type TransferToHubParams = {
  token: string;
  recipient: Address;
  amount: bigint;
  data: Hex;
};

export class StellarSpokeService {
  private constructor() {}

  /**
   * Check if the user has sufficent trustline established for the token.
   * @param token - The token address to check the trustline for.
   * @param amount - The amount of tokens to check the trustline for.
   * @param spokeProvider - The Stellar spoke provider.
   * @returns True if the user has sufficent trustline established for the token, false otherwise.
   */
  public static async hasSufficientTrustline(
    token: string,
    amount: bigint,
    spokeProvider: StellarSpokeProvider,
  ): Promise<boolean> {
    // native token and legacy bnUSD do not require trustline
    if (
      token.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase() ||
      token.toLowerCase() ===
        spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.legacybnUSD.address.toLowerCase()
    ) {
      return true;
    }

    const trustlineConfig = spokeProvider.chainConfig.trustlineConfigs.find(
      config => config.contractId.toLowerCase() === token.toLowerCase(),
    );

    if (!trustlineConfig) {
      throw new Error(`Trustline config not found for token: ${token}`);
    }

    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const { balances } = await spokeProvider.server.accounts().accountId(walletAddress).call();

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
  public static async requestTrustline<R extends boolean = false>(
    token: string,
    amount: bigint,
    spokeProvider: StellarSpokeProvider,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    try {
      const asset = spokeProvider.chainConfig.trustlineConfigs.find(
        t => t.contractId.toLowerCase() === token.toLowerCase(),
      );

      if (!asset) {
        throw new Error(`Asset ${token} not found. Cannot proceed with trustline.`);
      }

      const [network, walletAddress] = await Promise.all([
        spokeProvider.sorobanServer.getNetwork(),
        spokeProvider.walletProvider.getWalletAddress(),
      ]);

      const accountResponse = await spokeProvider.server.loadAccount(walletAddress);
      const stellarAccount = new CustomStellarAccount(accountResponse);

      const transaction = new TransactionBuilder(stellarAccount.getAccountClone(), {
        fee: BASE_FEE,
        networkPassphrase: network.passphrase,
      })
        .addOperation(
          Operation.changeTrust({
            asset: new Asset(asset?.assetCode, asset?.assetIssuer),
          }),
        )
        .setTimeout(STELLAR_DEFAULT_TX_TIMEOUT_SECONDS)
        .build();

      if (raw) {
        const transactionXdr = transaction.toXDR();

        return {
          from: walletAddress,
          to: spokeProvider.chainConfig.addresses.assetManager,
          value: amount,
          data: transactionXdr,
        } satisfies StellarReturnType<true> as StellarReturnType<R>;
      }

      const hash = await spokeProvider.signAndSendTransaction(transaction);

      return `${hash}` as StellarReturnType<R>;
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
  public static async estimateGas(
    rawTx: StellarRawTransaction,
    spokeProvider: StellarSpokeProvider,
  ): Promise<StellarGasEstimate> {
    const network = await spokeProvider.sorobanServer.getNetwork();
    let tx: Transaction | FeeBumpTransaction = TransactionBuilder.fromXDR(rawTx.data, network.passphrase);

    if (tx instanceof FeeBumpTransaction) {
      tx = tx.innerTransaction;
    }

    const simulationForFee = await spokeProvider.sorobanServer.simulateTransaction(tx);

    if (!rpc.Api.isSimulationSuccess(simulationForFee)) {
      throw new Error(`Simulation error: ${JSON.stringify(simulationForFee)}`);
    }

    return BigInt(simulationForFee.minResourceFee);
  }

  public static async deposit<R extends boolean = false>(
    params: StellarSpokeDepositParams,
    spokeProvider: StellarSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    const userWallet: Address =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
        hubProvider,
      ));

    return StellarSpokeService.transfer(
      {
        token: params.token,
        recipient: userWallet,
        amount: params.amount,
        data: params.data,
      },
      spokeProvider,
      raw,
    );
  }

  /**
   * Get the balance of the token in the spoke chain asset manager.
   * @param token - The address of the token to get the balance of.
   * @param spokeProvider - The spoke provider.
   * @returns The balance of the token.
   */
  public static async getDeposit(token: string, spokeProvider: StellarSpokeProvider): Promise<bigint> {
    return BigInt(await spokeProvider.getBalance(token));
  }

  /**
   * Generate simulation parameters for deposit from StellarSpokeDepositParams.
   * @param {StellarSpokeDepositParams} params - The deposit parameters.
   * @param {StellarSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<DepositSimulationParams>} The simulation parameters.
   */
  public static async getSimulateDepositParams(
    params: StellarSpokeDepositParams,
    spokeProvider: StellarSpokeProvider,
    hubProvider: EvmHubProvider,
  ): Promise<DepositSimulationParams> {
    const to =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
        hubProvider,
      ));

    return {
      spokeChainID: spokeProvider.chainConfig.chain.id,
      token: encodeAddress(spokeProvider.chainConfig.chain.id, params.token),
      from: encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
      to,
      amount: params.amount,
      data: params.data,
      srcAddress: encodeAddress(
        spokeProvider.chainConfig.chain.id,
        spokeProvider.chainConfig.addresses.assetManager as `0x${string}`,
      ),
    };
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param from - The address of the user on the hub chain.
   * @param payload - The payload to send to the contract.
   * @param spokeProvider - The spoke provider.
   * @param hubProvider - The hub provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns The transaction result.
   */
  public static async callWallet<R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: StellarSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return StellarSpokeService.call(BigInt(relayId), from, payload, spokeProvider, raw);
  }

  private static async transfer<R extends boolean = false>(
    { token, recipient, amount, data = '0x' }: TransferToHubParams,
    spokeProvider: StellarSpokeProvider,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    return await spokeProvider.deposit(
      token,
      amount.toString(),
      fromHex(recipient, 'bytes'),
      fromHex(data, 'bytes'),
      raw,
    );
  }

  private static async call<R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: HubAddress,
    payload: Hex,
    spokeProvider: StellarSpokeProvider,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    return await spokeProvider.sendMessage(
      dstChainId.toString(),
      fromHex(dstAddress, 'bytes'),
      fromHex(payload, 'bytes'),
      raw,
    );
  }
}
