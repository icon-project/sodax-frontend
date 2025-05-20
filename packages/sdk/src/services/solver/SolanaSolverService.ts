import type { Address } from 'viem';
import {
  encodeContractCalls,
  type EvmContractCall,
  type EvmHubProvider,
  type Hex,
  type SolanaSpokeProvider,
  type SolverConfig,
  type TxReturnType,
} from '../../index.js';
import { SpokeService, type CreateIntentParams, type Intent } from '../index.js';
import { EvmSolverService } from './EvmSolverService.js';
import { PublicKey } from '@solana/web3.js';

export class SolanaSolverService {
  private constructor() {}

  /**
   * Creates an intent by handling token approval and intent creation
   * @param {CreateIntentParams} createIntentParams - The intent to create
   * @param {Address} creatorHubWalletAddress - The creator's hub wallet address
   * @param {SolanaSpokeProvider} spokeProvider - The spoke provider
   * @param {EvmHubProvider} hubProvider - The hub provider
   * @param {bigint} feeAmount - The fee amount
   * @param {Hex} data - The encoded fee data
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<TxReturnType<SolanaSpokeProvider, R>>} The transaction return type
   */
  public static async createIntentDeposit<R extends boolean = false>(
    createIntentParams: CreateIntentParams,
    creatorHubWalletAddress: Address,
    spokeProvider: SolanaSpokeProvider,
    hubProvider: EvmHubProvider,
    feeAmount: bigint,
    data: Hex,
    raw?: R,
  ): Promise<TxReturnType<SolanaSpokeProvider, R>> {
    const token = new PublicKey(createIntentParams.inputToken);

    return SpokeService.deposit(
      {
        from: spokeProvider.walletProvider.getAddress(),
        to: creatorHubWalletAddress,
        token: token,
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
   * @param {SolanaSpokeProvider} spokeProvider - The spoke provider
   * @param {EvmHubProvider} hubProvider - The hub provider
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {TxReturnType<SolanaSpokeProvider, R>} The transaction return type
   */
  public static async cancelIntent<R extends boolean = false>(
    intent: Intent,
    intentConfig: SolverConfig,
    spokeProvider: SolanaSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<SolanaSpokeProvider, R>> {
    const calls: EvmContractCall[] = [];
    const intentsContract = intentConfig.intentsContract;
    calls.push(EvmSolverService.encodeCancelIntent(intent, intentsContract));
    const data = encodeContractCalls(calls);
    return SpokeService.callWallet(
      spokeProvider.walletProvider.getWalletAddressBytes(),
      data,
      spokeProvider,
      hubProvider,
      raw,
    );
  }
}
