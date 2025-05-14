import type { Address } from 'viem';
import {
  encodeContractCalls,
  type EvmContractCall,
  type EvmHubProvider,
  type SuiSpokeProvider,
  type SolverConfig,
  type TxReturnType,
} from '../../index.js';
import { SpokeService, type CreateIntentParams, type Intent } from '../index.js';
import { EvmSolverService } from './EvmSolverService.js';

export class SuiSolverService {
  private constructor() {}

  /**
   * Creates an intent by handling token approval and intent creation
   * @param {Intent} intent - The intent to create
   * @param {Address} creatorHubWalletAddress - The address of the intent creator on the hub chain
   * @param {SolverConfig} intentConfig - The intent configuration
   * @param {SuiSpokeProvider} spokeProvider - The spoke provider
   * @param {EvmHubProvider} hubProvider - The hub provider
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<[TxReturnType<EvmSpokeProvider, R>, Intent]>} The transaction return type along with created intent
   */
  public static async createIntent<R extends boolean = false>(
    createIntentParams: CreateIntentParams,
    creatorHubWalletAddress: Address,
    intentConfig: SolverConfig,
    spokeProvider: SuiSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<[TxReturnType<SuiSpokeProvider, R>, Intent]> {
    const [data, intent] = EvmSolverService.constructCreateIntentData(
      createIntentParams,
      creatorHubWalletAddress,
      intentConfig,
    );

    return [
      await SpokeService.deposit(
        {
          from: spokeProvider.walletProvider.getWalletAddressBytes(),
          token: createIntentParams.inputToken,
          amount: createIntentParams.inputAmount,
          data: data,
        },
        spokeProvider,
        hubProvider,
        raw,
      ),
      intent,
    ];
  }

  /**
   * Cancels an intent
   * @param {Intent} intent - The intent to cancel
   * @param {SolverConfig} intentConfig - The intent configuration
   * @param {SuiSpokeProvider} spokeProvider - The spoke provider
   * @param {EvmHubProvider} hubProvider - The hub provider
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {TxReturnType<SuiSpokeProvider, R>} The transaction return type
   */
  public static async cancelIntent<R extends boolean = false>(
    intent: Intent,
    intentConfig: SolverConfig,
    spokeProvider: SuiSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<SuiSpokeProvider, R>> {
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
