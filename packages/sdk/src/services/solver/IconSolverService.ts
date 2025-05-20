import type { Address } from 'viem';
import {
  type EvmContractCall,
  type EvmHubProvider,
  type Hex,
  type IconAddress,
  type IconSpokeProvider,
  type SolverConfig,
  type TxReturnType,
  encodeContractCalls,
} from '../../index.js';
import { type CreateIntentParams, type Intent, SpokeService } from '../index.js';
import { EvmSolverService } from './EvmSolverService.js';

export class IconSolverService {
  private constructor() {}

  /**
   * Creates an intent by handling token approval and intent creation
   * @param {CreateIntentParams} createIntentParams - The intent to create
   * @param {Address} creatorHubWalletAddress - The creator's hub wallet address
   * @param {IconSpokeProvider} spokeProvider - The spoke provider
   * @param {EvmHubProvider} hubProvider - The hub provider
   * @param {bigint} feeAmount - The fee amount
   * @param {Hex} data - The data to be encoded
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<TxReturnType<IconSpokeProvider, R>>} The transaction return type
   */
  public static async createIntentDeposit<R extends boolean = false>(
    createIntentParams: CreateIntentParams,
    creatorHubWalletAddress: Address,
    spokeProvider: IconSpokeProvider,
    hubProvider: EvmHubProvider,
    feeAmount: bigint,
    data: Hex,
    raw?: R,
  ): Promise<TxReturnType<IconSpokeProvider, R>> {
    return SpokeService.deposit(
      {
        from: spokeProvider.walletProvider.getWalletAddress() as IconAddress,
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
   * @param {IconSpokeProvider} spokeProvider - The spoke provider
   * @param {EvmHubProvider} hubProvider - The hub provider
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {TxReturnType<IconSpokeProvider, R>} The transaction return type
   */
  public static async cancelIntent<R extends boolean = false>(
    intent: Intent,
    intentConfig: SolverConfig,
    spokeProvider: IconSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<IconSpokeProvider, R>> {
    const calls: EvmContractCall[] = [];
    const intentsContract = intentConfig.intentsContract;
    calls.push(EvmSolverService.encodeCancelIntent(intent, intentsContract));
    const data = encodeContractCalls(calls);
    return SpokeService.callWallet(
      spokeProvider.walletProvider.getWalletAddress() as IconAddress,
      data,
      spokeProvider,
      hubProvider,
      raw,
    );
  }
}
