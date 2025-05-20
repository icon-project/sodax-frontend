import type { Address } from 'viem';
import {
  type CWSpokeProvider,
  type EvmContractCall,
  type EvmHubProvider,
  type Hex,
  type SolverConfig,
  type TxReturnType,
  encodeContractCalls,
} from '../../index.js';
import { type CreateIntentParams, type Intent, SpokeService } from '../index.js';
import { EvmSolverService } from './EvmSolverService.js';

export class CWSolverService {
  private constructor() {}

  /**
   * Creates an intent by handling token approval and intent creation
   * @param {CreateIntentParams} createIntentParams - The intent to create
   * @param {Address} creatorHubWalletAddress - The creator's hub wallet address
   * @param {CWSpokeProvider} spokeProvider - The spoke provider
   * @param {EvmHubProvider} hubProvider - The hub provider
   * @param {bigint} feeAmount - The fee amount
   * @param {Hex} data - The data to be encoded
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<TxReturnType<CWSpokeProvider, R>>} The transaction return type
   */
  public static async createIntentDeposit<R extends boolean = false>(
    createIntentParams: CreateIntentParams,
    creatorHubWalletAddress: Address,
    spokeProvider: CWSpokeProvider,
    hubProvider: EvmHubProvider,
    feeAmount: bigint,
    data: Hex,
    raw?: R,
  ): Promise<TxReturnType<CWSpokeProvider, R>> {

    return SpokeService.deposit(
      {
        from: spokeProvider.walletProvider.getWalletAddress(),
        to: creatorHubWalletAddress,
        token: createIntentParams.inputToken,
        amount: createIntentParams.inputAmount + feeAmount,
        data: data,
      },
      spokeProvider,
      hubProvider,
      raw,
    );
  }

  /**
   * Cancels an intent
   * @param {Intent} intent - The intent to cancel
   * @param {SolverConfig} intentConfig - The intent configuration
   * @param {CWSpokeProvider} spokeProvider - The spoke provider
   * @param {EvmHubProvider} hubProvider - The hub provider
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {TxReturnType<CWSpokeProvider, R>} The transaction return type
   */
  public static async cancelIntent<R extends boolean = false>(
    intent: Intent,
    intentConfig: SolverConfig,
    spokeProvider: CWSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<CWSpokeProvider, R>> {
    const calls: EvmContractCall[] = [];
    const intentsContract = intentConfig.intentsContract;
    calls.push(EvmSolverService.encodeCancelIntent(intent, intentsContract));
    const data = encodeContractCalls(calls);
    return SpokeService.callWallet(
      spokeProvider.walletProvider.getWalletAddress(),
      data,
      spokeProvider,
      hubProvider,
      raw,
    );
  }
}
