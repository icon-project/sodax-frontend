import type { InjectiveSpokeProvider } from '../../entities/injective/InjectiveSpokeProvider.js';
import type { IconSpokeProvider } from '../../entities/icon/IconSpokeProvider.js';
import type {
  EvmHubProvider,
  EvmSpokeProvider,
  SolanaSpokeProvider,
  SonicSpokeProvider,
  SpokeProvider,
  SpokeProviderType,
  StellarSpokeProvider,
  SuiSpokeProvider,
} from '../../entities/index.js';
import type {
  GetEstimateGasReturnType,
  GetSpokeDepositParamsType,
  TxReturnType,
  DepositSimulationParams,
  WalletSimulationParams,
  Result,
  EvmSpokeProviderType,
  SonicSpokeProviderType,
  InjectiveSpokeProviderType,
  IconSpokeProviderType,
  SuiSpokeProviderType,
  SolanaSpokeProviderType,
  StellarSpokeProviderType,
  BitcoinSpokeProviderType,
} from '../../types.js';
import { getIntentRelayChainId, type Address, type Hex, type HubAddress } from '@sodax/types';
import { InjectiveSpokeService } from './InjectiveSpokeService.js';
import { EvmSpokeService } from './EvmSpokeService.js';
import { IconSpokeService } from './IconSpokeService.js';
import { SolanaSpokeService } from './SolanaSpokeService.js';
import { StellarSpokeService } from './StellarSpokeService.js';
import { SuiSpokeService } from './SuiSpokeService.js';
import { SonicSpokeService, type SonicSpokeDepositParams } from './SonicSpokeService.js';
import {
  isSolanaSpokeProvider,
  isSonicSpokeProvider,
  isStellarSpokeProvider,
  isSonicRawSpokeProvider,
  isSolanaSpokeProviderType,
  isStellarSpokeProviderType,
  isSuiSpokeProviderType,
  isIconSpokeProviderType,
  isInjectiveSpokeProviderType,
  isEvmSpokeProviderType,
  isSonicSpokeProviderType,
  isBitcoinSpokeProviderType,
} from '../../guards.js';
import * as rlp from 'rlp';
import { encodeFunctionData } from 'viem';
import { encodeAddress } from '../../utils/shared-utils.js';
import { BitcoinSpokeService } from './BitcoinSpokeService.js';

/**
 * SpokeService is a main class that provides functionalities for dealing with spoke chains.
 * It uses command pattern to execute different spoke chain operations.
 */

export class SpokeService {
  private constructor() { }

  /**
   * Estimate the gas for a raw transaction.
   * @param {TxReturnType<T, true>} params - The parameters for the raw transaction.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<GetEstimateGasReturnType<T>>} A promise that resolves to the gas.
   */
  public static async estimateGas<T extends SpokeProviderType>(
    params: TxReturnType<T, true>,
    spokeProvider: T,
  ): Promise<GetEstimateGasReturnType<T>> {
    if (isEvmSpokeProviderType(spokeProvider)) {
      return EvmSpokeService.estimateGas(
        params as TxReturnType<EvmSpokeProviderType, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<EvmSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (isSonicSpokeProviderType(spokeProvider)) {
      return SonicSpokeService.estimateGas(
        params as TxReturnType<SonicSpokeProviderType, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<SonicSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (isInjectiveSpokeProviderType(spokeProvider)) {
      return InjectiveSpokeService.estimateGas(
        params as TxReturnType<InjectiveSpokeProviderType, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<InjectiveSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (isIconSpokeProviderType(spokeProvider)) {
      return IconSpokeService.estimateGas(
        params as TxReturnType<IconSpokeProviderType, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<IconSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (isSuiSpokeProviderType(spokeProvider)) {
      return SuiSpokeService.estimateGas(
        params as TxReturnType<SuiSpokeProviderType, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<SuiSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (isSolanaSpokeProviderType(spokeProvider)) {
      return SolanaSpokeService.estimateGas(
        params as TxReturnType<SolanaSpokeProviderType, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<SolanaSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (isStellarSpokeProviderType(spokeProvider)) {
      return StellarSpokeService.estimateGas(
        params as TxReturnType<StellarSpokeProviderType, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<StellarSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }

    throw new Error('Invalid spoke provider');
  }

  /**

  * Encodes transfer data using RLP encoding to match Solidity Transfer struct.
   * @param {Hex} token - The token contract address.
   * @param {Hex} from - The sender address.
   * @param {Hex} to - The recipient address.
   * @param {bigint} amount - The transfer amount.
   * @param {Hex} data - The encoded data payload.
   * @returns {Promise<Hex>} A promise that resolves to the RLP encoded transfer data.
   */
  public static encodeTransfer(token: Hex, from: Hex, to: Hex, amount: bigint, data: Hex): Hex {
    // Create RLP input array matching Solidity Transfer struct:
    // bytes token, bytes from, bytes to, uint256 amount, bytes data

    const rlpInput: rlp.Input = [
      token, // token (bytes)
      from, // from (bytes)
      to, // to (bytes)
      amount, // amount (uint256)
      data, // data (bytes)
    ];

    const rlpEncodedData = rlp.encode(rlpInput);

    return `0x${Buffer.from(rlpEncodedData).toString('hex')}`;
  }
  public static async simulateDeposit(
    params: DepositSimulationParams,
    hubProvider: EvmHubProvider,
  ): Promise<{ success: boolean; error?: string }> {
    const chainId = getIntentRelayChainId(params.spokeChainID);
    const hubAssetManager = hubProvider.chainConfig.addresses.assetManager;
    const payload = SpokeService.encodeTransfer(params.token, params.from, params.to, params.amount, params.data);

    return SpokeService.simulateRecvMessage(
      { target: hubAssetManager, srcChainId: chainId, srcAddress: params.srcAddress, payload },
      hubProvider,
    );
  }

  /**
   * Simulates receiving a message without signature verification.
   * This function calls simulateRecvMessage which always reverts with 'Simulation completed'.
   * @param {bigint} srcChainId - The chain ID of the originating chain.
   * @param {Hex} srcAddress - The address of the sender on the originating chain.
   * @param {Hex} payload - The encoded payload containing call data (from encodeTransfer).
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<{ success: boolean; error?: string }>} Result of the simulation.
   */
  public static async simulateRecvMessage(
    params: WalletSimulationParams,
    hubProvider: EvmHubProvider,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Call simulateRecvMessage using staticCall (read-only)
      const result = await hubProvider.publicClient.call({
        to: params.target,
        data: encodeFunctionData({
          abi: [
            {
              name: 'simulateRecvMessage',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'srcChainId', type: 'uint256' },
                { name: 'srcAddress', type: 'bytes' },
                { name: 'payload', type: 'bytes' },
              ],
              outputs: [],
            },
          ],
          functionName: 'simulateRecvMessage',
          args: [params.srcChainId, params.srcAddress, params.payload],
        }),
      });

      // If we get here, the function didn't revert as expected
      console.warn('simulateRecvMessage did not revert as expected', { result });
      return {
        success: false,
        error: 'Function should have reverted with "Simulation completed"',
      };
    } catch (error: unknown) {
      // Check if it's the expected revert
      if (error instanceof Error && error.message?.includes('Simulation completed')) {
        console.warn('simulateRecvMessage completed successfully with expected revert');
        return { success: true };
      }

      // Handle other contract errors
      console.error('simulateRecvMessage failed with unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message || 'Unknown simulation error' : 'Unknown simulation error',
      };
    }
  }

  /**
   * Deposit tokens to the spoke chain.
   * @param {GetSpokeDepositParamsType<T extends SpokeProvider>} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @param {boolean} raw - Whether to return raw transaction data.
   * @param {boolean} skipSimulation - Whether to skip deposit simulation (optional, defaults to false).
   * @returns {Promise<TxReturnType<T, R>>} A promise that resolves to the transaction hash.
   */
  public static async deposit<S extends SpokeProviderType, R extends boolean = false>(
    params: GetSpokeDepositParamsType<S>,
    spokeProvider: S,
    hubProvider: EvmHubProvider,
    raw?: R,
    skipSimulation = false,
  ): Promise<TxReturnType<S, R>> {
    if (isSonicSpokeProvider(spokeProvider) || isSonicRawSpokeProvider(spokeProvider)) {
      const _params: SonicSpokeDepositParams = params as GetSpokeDepositParamsType<SonicSpokeProviderType>;
      return SonicSpokeService.deposit(_params, spokeProvider, raw) satisfies Promise<
        TxReturnType<SonicSpokeProviderType, R>
      > as Promise<TxReturnType<S, R>>;
    }
    if (isEvmSpokeProviderType(spokeProvider)) {
      await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return EvmSpokeService.deposit(
        params as GetSpokeDepositParamsType<EvmSpokeProviderType>,
        spokeProvider,
        hubProvider,
        raw,
      ) satisfies Promise<TxReturnType<EvmSpokeProviderType, R>> as Promise<TxReturnType<S, R>>;
    }
    if (isInjectiveSpokeProviderType(spokeProvider)) {
      await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return InjectiveSpokeService.deposit(
        params as GetSpokeDepositParamsType<InjectiveSpokeProviderType>,
        spokeProvider,
        hubProvider,
        raw,
      ) satisfies Promise<TxReturnType<InjectiveSpokeProviderType, R>> as Promise<TxReturnType<S, R>>;
    }
    if (isIconSpokeProviderType(spokeProvider)) {
      await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return IconSpokeService.deposit(
        params as GetSpokeDepositParamsType<IconSpokeProviderType>,
        spokeProvider,
        hubProvider,
        raw,
      ) satisfies Promise<TxReturnType<IconSpokeProviderType, R>> as Promise<TxReturnType<S, R>>;
    }

    if (isSuiSpokeProviderType(spokeProvider)) {
      await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return SuiSpokeService.deposit(
        params as GetSpokeDepositParamsType<SuiSpokeProviderType>,
        spokeProvider,
        hubProvider,
        raw,
      ) satisfies Promise<TxReturnType<SuiSpokeProviderType, R>> as Promise<TxReturnType<S, R>>;
    }

    if (isSolanaSpokeProviderType(spokeProvider)) {
      await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return SolanaSpokeService.deposit(
        params as GetSpokeDepositParamsType<SolanaSpokeProviderType>,
        spokeProvider,
        hubProvider,
        raw,
      ) satisfies Promise<TxReturnType<SolanaSpokeProviderType, R>> as Promise<TxReturnType<S, R>>;
    }
    if (isStellarSpokeProviderType(spokeProvider)) {
      await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return StellarSpokeService.deposit(
        params as GetSpokeDepositParamsType<StellarSpokeProviderType>,
        spokeProvider,
        hubProvider,
        raw,
      ) satisfies Promise<TxReturnType<StellarSpokeProviderType, R>> as Promise<TxReturnType<S, R>>;
    }
    console.log(isBitcoinSpokeProviderType(spokeProvider));
    if (isBitcoinSpokeProviderType(spokeProvider)) {
      await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return BitcoinSpokeService.deposit(
        params as GetSpokeDepositParamsType<BitcoinSpokeProviderType>,
        spokeProvider,
        raw,
      ) satisfies Promise<TxReturnType<BitcoinSpokeProviderType, R>> as Promise<TxReturnType<S, R>>;
    }

    throw new Error('Invalid spoke provider');
  }

  public static getSimulateDepositParams<S extends SpokeProviderType>(
    params: GetSpokeDepositParamsType<S>,
    spokeProvider: S,
    hubProvider: EvmHubProvider,
  ): Promise<DepositSimulationParams> {
    if (isEvmSpokeProviderType(spokeProvider)) {
      return EvmSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<EvmSpokeProviderType>,
        spokeProvider,
        hubProvider,
      );
    }
    if (isInjectiveSpokeProviderType(spokeProvider)) {
      return InjectiveSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<InjectiveSpokeProviderType>,
        spokeProvider,
        hubProvider,
      );
    }
    if (isIconSpokeProviderType(spokeProvider)) {
      return IconSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<IconSpokeProviderType>,
        spokeProvider,
        hubProvider,
      );
    }
    if (isSuiSpokeProviderType(spokeProvider)) {
      return SuiSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<SuiSpokeProviderType>,
        spokeProvider,
        hubProvider,
      );
    }
    if (isSolanaSpokeProviderType(spokeProvider)) {
      return SolanaSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<SolanaSpokeProviderType>,
        spokeProvider,
        hubProvider,
      );
    }
    if (isStellarSpokeProviderType(spokeProvider)) {
      return StellarSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<StellarSpokeProviderType>,
        spokeProvider,
        hubProvider,
      );
    }
    if (isBitcoinSpokeProviderType(spokeProvider)) {
      return BitcoinSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<BitcoinSpokeProviderType>,
        spokeProvider,
        hubProvider,
      ) as Promise<DepositSimulationParams>;
    }

    throw new Error('[getSimulateDepositParams] Invalid spoke provider');
  }

  public static async verifyDepositSimulation<S extends SpokeProviderType>(
    params: GetSpokeDepositParamsType<S>,
    spokeProvider: S,
    hubProvider: EvmHubProvider,
    skipSimulation: boolean,
  ): Promise<void> {
    if (!skipSimulation) {
      const simulationParams = await SpokeService.getSimulateDepositParams(params, spokeProvider, hubProvider);
      const result = await SpokeService.simulateDeposit(simulationParams, hubProvider);

      if (!result.success) {
        throw new Error('Simulation failed', { cause: result });
      }
    }
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {SpokeProviderType} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static getDeposit(token: Address, spokeProvider: SpokeProviderType): Promise<bigint> {
    if (isEvmSpokeProviderType(spokeProvider)) {
      return EvmSpokeService.getDeposit(token, spokeProvider);
    }
    if (isInjectiveSpokeProviderType(spokeProvider)) {
      return InjectiveSpokeService.getDeposit(token, spokeProvider);
    }
    if (isStellarSpokeProviderType(spokeProvider)) {
      return StellarSpokeService.getDeposit(token, spokeProvider);
    }
    if (isSuiSpokeProviderType(spokeProvider)) {
      return SuiSpokeService.getDeposit(token, spokeProvider);
    }
    if (isIconSpokeProviderType(spokeProvider)) {
      return IconSpokeService.getDeposit(token, spokeProvider);
    }
    if (isSolanaSpokeProviderType(spokeProvider)) {
      return SolanaSpokeService.getDeposit(token, spokeProvider);
    }
    if (isSonicSpokeProviderType(spokeProvider)) {
      return SonicSpokeService.getDeposit(token, spokeProvider);
    }
    if (isBitcoinSpokeProviderType(spokeProvider)) {
      return BitcoinSpokeService.getDeposit(token, spokeProvider);
    }

    throw new Error('Invalid spoke provider');
  }

  /**
   * Calls the connection contract on the spoke chain to send a message to the hub wallet, which then executes the message's payload.
   * @param {HubAddress} from - The address of the user on the hub chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {SpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async callWallet<T extends SpokeProviderType, R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: T,
    hubProvider: EvmHubProvider,
    raw?: R,
    skipSimulation = false,
    useTradingWallet = false,
    srcAddressBytes?: Address, // in case of bitcoin, trading wallet is used, for simulation
  ): Promise<TxReturnType<T, R>> {
    if (isSonicSpokeProviderType(spokeProvider)) {
      return (await SonicSpokeService.callWallet(payload, spokeProvider, raw)) satisfies TxReturnType<
        SonicSpokeProviderType,
        R
      > as TxReturnType<T, R>;
    }

    if (!skipSimulation) {
      const result = await SpokeService.simulateRecvMessage(
        {
          target: from,
          srcChainId: getIntentRelayChainId(spokeProvider.chainConfig.chain.id),
          srcAddress: srcAddressBytes!,
          payload,
        },
        hubProvider,
      );
      if (!result.success) {
        throw new Error('Simulation failed', { cause: result });
      }
    }
    if (isEvmSpokeProviderType(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await EvmSpokeService.callWallet(from, payload, spokeProvider, hubProvider, raw)) satisfies TxReturnType<
        EvmSpokeProviderType,
        R
      > as TxReturnType<T, R>;
    }
    if (isInjectiveSpokeProviderType(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await InjectiveSpokeService.callWallet(
        from,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      )) satisfies TxReturnType<InjectiveSpokeProviderType, R> as TxReturnType<T, R>;
    }
    if (isIconSpokeProviderType(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await IconSpokeService.callWallet(from, payload, spokeProvider, hubProvider, raw)) satisfies TxReturnType<
        IconSpokeProviderType,
        R
      > as TxReturnType<T, R>;
    }
    if (isSuiSpokeProviderType(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await SuiSpokeService.callWallet(from, payload, spokeProvider, hubProvider, raw)) satisfies TxReturnType<
        SuiSpokeProviderType,
        R
      > as TxReturnType<T, R>;
    }
    if (isSolanaSpokeProviderType(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await SolanaSpokeService.callWallet(
        from,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      )) satisfies TxReturnType<SolanaSpokeProviderType, R> as TxReturnType<T, R>;
    }
    if (isStellarSpokeProviderType(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await StellarSpokeService.callWallet(
        from,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      )) satisfies TxReturnType<StellarSpokeProviderType, R> as TxReturnType<T, R>;
    }
    if (isBitcoinSpokeProviderType(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation, srcAddressBytes);
      return (await BitcoinSpokeService.callWallet(
        from,
        payload,
        spokeProvider,
        hubProvider,
        raw,
        useTradingWallet,
      )) satisfies TxReturnType<BitcoinSpokeProviderType, R> as TxReturnType<T, R>;
    }

    throw new Error('[callWallet] Invalid spoke provider');
  }

  public static async verifySimulation(
    from: HubAddress,
    payload: Hex,
    spokeProvider: SpokeProviderType,
    hubProvider: EvmHubProvider,
    skipSimulation: boolean,
    srcAddressBytes?: Address,
  ): Promise<void> {
    if (!skipSimulation) {
      
      const result = await SpokeService.simulateRecvMessage(
        {
          target: from,
          srcChainId: getIntentRelayChainId(spokeProvider.chainConfig.chain.id),
          srcAddress: srcAddressBytes ?? encodeAddress(
            spokeProvider.chainConfig.chain.id,
            await spokeProvider.walletProvider.getWalletAddress(),
          ),
          payload,
        },
        hubProvider,
      );

      if (!result.success) {
        throw new Error('Simulation failed', { cause: result });
      }
    }
  }

  /**
   * Verifies the transaction hash for the spoke chain to exist on chain.
   * Only stellar and solana need to be verified. For other chains, we assume the transaction exists on chain.
   * @param txHash - The transaction hash to verify.
   * @param spokeProvider - The spoke provider.
   * @returns {Promise<Result<boolean>>} A promise that resolves to the result of the verification.
   */
  public static async verifyTxHash(txHash: string, spokeProvider: SpokeProvider): Promise<Result<boolean>> {
    if (isSolanaSpokeProvider(spokeProvider)) {
      const result = await SolanaSpokeService.waitForConfirmation(spokeProvider, txHash);

      if (!result.ok) {
        console.warn(`Solana verifyTxHash failed: ${result.error}`);
        console.warn('Returning true to assume transaction exists on chain in future ');
        return {
          ok: true,
          value: true,
        };
      }

      return result;
    }
    if (isStellarSpokeProvider(spokeProvider)) {
      return StellarSpokeService.waitForTransaction(spokeProvider, txHash);
    }

    // only stellar and solana need to be verified
    return {
      ok: true,
      value: true,
    };
  }
}
