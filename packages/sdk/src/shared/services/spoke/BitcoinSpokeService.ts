// import * as bitcoin from 'bitcoinjs-lib';
import { type Hex, type HubAddress, type HubChainId } from '@sodax/types';
import type { BitcoinSpokeProviderType, TxReturnType } from '../../types.js';
import type { EvmHubProvider } from '../../entities/index.js';
// import { isBitcoinRawSpokeProvider } from '../../guards.js';
import { encodeAddress } from '../../utils/shared-utils.js';
import { EvmWalletAbstraction } from '../hub/index.js';
import { BitcoinBaseSpokeProvider } from '../../entities/btc/BitcoinSpokeProvider.js';

export type BitcoinSpokeDepositParams = {
  from: string; // Bitcoin address of the user on the spoke chain
  to?: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: string; // Token identifier
  amount: bigint; // Amount in satoshis
  data: Hex; // Additional data to send with the deposit
  useTradingWallet?: boolean; // Use the trading wallet
  accessToken?: string; // Access token to use trading wallet
};

export type BitcoinTransferToHubParams = {
  token: string;
  amount: bigint;
  data?: Hex;
  useTradingWallet?: boolean;
  accessToken?: string;
};

export type DepositSimulationParams = {
  spokeChainID: number | string;
  token: Hex;
  from: Hex;
  to: HubAddress;
  amount: bigint;
  data: Hex;
  srcAddress: Hex;
};

export class BitcoinSpokeService {
  private constructor() { }

  /**
   * Estimate transaction fee for a Bitcoin transaction
   * 
   * @param {Hex} rawTx - The raw transaction parameters
   * @param {BitcoinSpokeProviderType} spokeProvider - The Bitcoin spoke provider
   * @returns {Promise<bigint>} Estimated fee in satoshis
   */
  public static async estimateGas(
    rawTx: Hex,
    spokeProvider: BitcoinSpokeProviderType,
  ): Promise<bigint> {
    const txBytes = Buffer.from(rawTx, "hex");
    const vsize = Math.ceil(txBytes.length);
    const feeRate = await spokeProvider.getFeeEstimate();
    const feeRateBigInt =
      typeof feeRate === "bigint" ? feeRate : BigInt(Math.ceil(feeRate));
    return BigInt(vsize) * feeRateBigInt;
  }

  /**
   * Deposit tokens to the spoke chain and bridge to hub
   * 
   * @param {BitcoinSpokeDepositParams} params - Deposit parameters
   * @param {BitcoinSpokeProviderType} spokeProvider - The Bitcoin spoke provider
   * @param {EvmHubProvider} EvmHubProvider - The hub chain provider
   * @param {boolean} raw - Whether to return raw PSBT or transaction hash
   * @returns {Promise<TxReturnType<BitcoinSpokeProviderType, R>>} Transaction hash or raw PSBT
   */
  public static async deposit<R extends boolean = false>(
    params: BitcoinSpokeDepositParams,
    spokeProvider: BitcoinSpokeProviderType,
    raw?: R,
  ): Promise<TxReturnType<BitcoinSpokeProviderType, R>> {

    return BitcoinSpokeService.transfer(
      {
        token: params.token,
        amount: params.amount,
        data: params.data ?? '0x',
        useTradingWallet: params.useTradingWallet,
        accessToken: params.accessToken,
      },
      spokeProvider,
      raw,
    );
  }

  /**
   * Get the balance of deposited tokens in the asset manager
   * 
   * @param {string} token - Token identifier ('BTC' for native Bitcoin)
   * @param {BitcoinSpokeProviderType} spokeProvider - The Bitcoin spoke provider
   * @returns {Promise<bigint>} Balance in satoshis
   */
  public static async getDeposit(
    token: string,
    spokeProvider: BitcoinSpokeProviderType,
  ): Promise<bigint> {
    const assetManagerAddress = spokeProvider.chainConfig.addresses.assetManager;
    const utxos = await spokeProvider.fetchUTXOs(assetManagerAddress);
    const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

    return BigInt(totalBalance);
  }

  /**
   * Generate simulation parameters for deposit
   * 
   * @param {BitcoinSpokeDepositParams} params - Deposit parameters
   * @param {BitcoinSpokeProviderType} spokeProvider - The Bitcoin spoke provider
   * @param {EvmHubProvider} EvmHubProvider - The hub chain provider
   * @returns {Promise<DepositSimulationParams>} Simulation parameters
   */
  public static async getSimulateDepositParams(
    params: BitcoinSpokeDepositParams,
    spokeProvider: BitcoinSpokeProviderType,
    EvmHubProvider: EvmHubProvider,
  ): Promise<DepositSimulationParams> {
    const to =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
        EvmHubProvider,
      ));
    
    const token = spokeProvider.chainConfig.supportedTokens[params.token]?.address!;
    return {
      spokeChainID: spokeProvider.chainConfig.chain.id,
      token: encodeAddress(spokeProvider.chainConfig.chain.id, token),
      from: encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
      to,
      amount: params.amount,
      data: params.data,
      srcAddress: encodeAddress(
        spokeProvider.chainConfig.chain.id,
        spokeProvider.chainConfig.addresses.assetManager,
      ),
    };
  }

  /**
   * Call a contract on the hub chain from Bitcoin spoke
   * 
   * @param {HubAddress} from - The hub wallet address
   * @param {Hex} payload - The payload to send
   * @param {BitcoinSpokeProviderType} spokeProvider - The Bitcoin spoke provider
   * @param {EvmHubProvider} EvmHubProvider - The hub chain provider
   * @param {boolean} raw - Whether to return raw PSBT or transaction hash
   * @returns {Promise<TxReturnType<BitcoinSpokeProviderType, R>>} Stringified JSON for payload and signature
   */
  public static async callWallet<R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: BitcoinSpokeProviderType,
    EvmHubProvider: EvmHubProvider,
    raw?: R,
    useTradingWallet?: boolean
  ): Promise<TxReturnType<BitcoinSpokeProviderType, R>> {
    return BitcoinSpokeService.call(
      EvmHubProvider.chainConfig.chain.id,
      from,
      payload,
      spokeProvider,
      raw,
      useTradingWallet
    );
  }

  /**
   * Transfer tokens to the hub chain
   * 
   * @param {BitcoinTransferToHubParams} params - Transfer parameters
   * @param {BitcoinSpokeProviderType} spokeProvider - The Bitcoin spoke provider
   * @param {boolean} raw - Whether to return raw PSBT or transaction hash
   * @returns {Promise<TxReturnType<BitcoinSpokeProviderType, R>>} Transaction hash or raw PSBT
   */
  private static async transfer<R extends boolean = false>(
    { token, amount, data = '0x', useTradingWallet = false, accessToken }: BitcoinTransferToHubParams,
    spokeProvider: BitcoinSpokeProviderType,
    raw?: R,
  ): Promise<TxReturnType<BitcoinSpokeProviderType, R>> {

    return await BitcoinBaseSpokeProvider.deposit(
      token,
      amount,
      data,
      spokeProvider,
      raw,
      useTradingWallet,
      accessToken
    )
  }

  /**
   * Send a message to the hub chain
   * 
   * @param {HubChainId} dstChainId - Destination chain ID
   * @param {HubAddress} dstAddress - Destination address on hub
   * @param {Hex} payload - Message payload
   * @param {BitcoinSpokeProviderType} spokeProvider - The Bitcoin spoke provider
   * @param {boolean} raw - Whether to return raw PSBT or transaction hash
   * @returns {Promise<TxReturnType<BitcoinSpokeProviderType, R>>} Transaction hash or raw PSBT
   */
  private static async call<R extends boolean = false>(
    dstChainId: HubChainId,
    dstAddress: HubAddress,
    payload: Hex,
    spokeProvider: BitcoinSpokeProviderType,
    raw?: R,
    useTradingWallet?: boolean
  ): Promise<TxReturnType<BitcoinSpokeProviderType, R>> {
    return await BitcoinBaseSpokeProvider.encodeWithdrawalData(
      dstChainId,
      payload,
      spokeProvider,
      raw,
      useTradingWallet
    ) as TxReturnType<BitcoinSpokeProviderType, R>
  }
}