import { InjectiveSpokeProvider } from '../../entities/injective/InjectiveSpokeProvider.js';
import { IconSpokeProvider } from '../../entities/icon/IconSpokeProvider.js';
import {
  type EvmHubProvider,
  EvmSpokeProvider,
  SolanaSpokeProvider,
  SonicSpokeProvider,
  type SpokeProvider,
  StellarSpokeProvider,
  SuiSpokeProvider,
} from '../../entities/index.js';
import type {
  GetEstimateGasReturnType,
  GetSpokeDepositParamsType,
  PromiseTxReturnType,
  TxReturnType,
  DepositSimulationParams,
  WalletSimulationParams,
} from '../../types.js';
import type { Address, Hex, HubAddress } from '@sodax/types';
import { InjectiveSpokeService } from './InjectiveSpokeService.js';
import { EvmSpokeService } from './EvmSpokeService.js';
import { IconSpokeService } from './IconSpokeService.js';
import { SolanaSpokeService } from './SolanaSpokeService.js';
import { StellarSpokeService } from './StellarSpokeService.js';
import { SuiSpokeService } from './SuiSpokeService.js';
import { SonicSpokeService } from './SonicSpokeService.js';
import {
  isInjectiveSpokeProvider,
  isEvmSpokeProvider,
  isIconSpokeProvider,
  isNearSpokeProvider,
  isSolanaSpokeProvider,
  isSonicSpokeProvider,
  isStellarSpokeProvider,
  isSuiSpokeProvider,
} from '../../guards.js';
import { NearSpokeProvider } from '../../entities/near/NearSpokeProvider.js';
import { NearSpokeService } from './NearSpokeService.js';
import * as rlp from 'rlp';
import { encodeFunctionData } from 'viem';
import { getIntentRelayChainId } from '../../constants.js';

/**
 * SpokeService is a main class that provides functionalities for dealing with spoke chains.
 * It uses command pattern to execute different spoke chain operations.
 */

export class SpokeService {
  private constructor() {}

  /**
   * Estimate the gas for a raw transaction.
   * @param {TxReturnType<T, true>} params - The parameters for the raw transaction.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<GetEstimateGasReturnType<T>>} A promise that resolves to the gas.
   */
  public static async estimateGas<T extends SpokeProvider = SpokeProvider>(
    params: TxReturnType<T, true>,
    spokeProvider: T,
  ): Promise<GetEstimateGasReturnType<T>> {
    if (spokeProvider instanceof EvmSpokeProvider) {
      return EvmSpokeService.estimateGas(
        params as TxReturnType<EvmSpokeProvider, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<EvmSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (spokeProvider instanceof SonicSpokeProvider) {
      return SonicSpokeService.estimateGas(
        params as TxReturnType<SonicSpokeProvider, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<SonicSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (spokeProvider instanceof InjectiveSpokeProvider) {
      return InjectiveSpokeService.estimateGas(
        params as TxReturnType<InjectiveSpokeProvider, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<InjectiveSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (spokeProvider instanceof IconSpokeProvider) {
      return IconSpokeService.estimateGas(
        params as TxReturnType<IconSpokeProvider, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<IconSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (spokeProvider instanceof SuiSpokeProvider) {
      return SuiSpokeService.estimateGas(
        params as TxReturnType<SuiSpokeProvider, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<SuiSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (spokeProvider instanceof SolanaSpokeProvider) {
      return SolanaSpokeService.estimateGas(
        params as TxReturnType<SolanaSpokeProvider, true>,
        spokeProvider,
      ) satisfies Promise<GetEstimateGasReturnType<SolanaSpokeProvider>> as Promise<GetEstimateGasReturnType<T>>;
    }
    if (spokeProvider instanceof StellarSpokeProvider) {
      return StellarSpokeService.estimateGas(
        params as TxReturnType<StellarSpokeProvider, true>,
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
  public static encodeTransfer(
    token: Hex,
    from: Hex,
    to: Hex,
    amount: bigint,
    data: Hex,
  ): Hex {
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
    const payload = SpokeService.encodeTransfer(
      params.token,
      params.from,
      params.to,
      params.amount,
      params.data,
    );

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
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async deposit<T extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: GetSpokeDepositParamsType<T>,
    spokeProvider: T,
    hubProvider: EvmHubProvider,
    raw?: R,
    skipSimulation = false,
  ): Promise<PromiseTxReturnType<T, R>> {
    if (spokeProvider instanceof SonicSpokeProvider) {
      return SonicSpokeService.deposit(
        params as GetSpokeDepositParamsType<SonicSpokeProvider>,
        spokeProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }
    if (spokeProvider instanceof EvmSpokeProvider) {
      await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return EvmSpokeService.deposit(
        params as GetSpokeDepositParamsType<EvmSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }
    if (spokeProvider instanceof InjectiveSpokeProvider) {
      await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return InjectiveSpokeService.deposit(params, spokeProvider, hubProvider, raw) as PromiseTxReturnType<T, R>;
    }
    if (spokeProvider instanceof IconSpokeProvider) {
       // TODO FIX failing simulation for valid transaction
      // await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return IconSpokeService.deposit(
        params as GetSpokeDepositParamsType<IconSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }

    if (spokeProvider instanceof SuiSpokeProvider) {
      await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return SuiSpokeService.deposit(
        params as GetSpokeDepositParamsType<SuiSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }

    if (spokeProvider instanceof SolanaSpokeProvider) {
      await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return SolanaSpokeService.deposit(
        params as GetSpokeDepositParamsType<SolanaSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }
    if (spokeProvider instanceof StellarSpokeProvider) {
      // TODO FIX failing simulation for valid transaction
      // await SpokeService.verifyDepositSimulation(params, spokeProvider, hubProvider, skipSimulation);
      return StellarSpokeService.deposit(
        params as GetSpokeDepositParamsType<StellarSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }
     if (spokeProvider instanceof NearSpokeProvider) {
      return NearSpokeService.deposit(
        params as GetSpokeDepositParamsType<NearSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }

    throw new Error('Invalid spoke provider');
  }

  public static getSimulateDepositParams<S extends SpokeProvider>(
    params: GetSpokeDepositParamsType<S>,
    spokeProvider: S,
    hubProvider: EvmHubProvider,
  ): Promise<DepositSimulationParams> {
    if (spokeProvider instanceof EvmSpokeProvider) {
      return EvmSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<EvmSpokeProvider>,
        spokeProvider,
        hubProvider,
      );
    }
    if (spokeProvider instanceof InjectiveSpokeProvider) {
      return InjectiveSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<InjectiveSpokeProvider>,
        spokeProvider,
        hubProvider,
      );
    }
    if (spokeProvider instanceof IconSpokeProvider) {
      return IconSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<IconSpokeProvider>,
        spokeProvider,
        hubProvider,
      );
    }
    if (spokeProvider instanceof SuiSpokeProvider) {
      return SuiSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<SuiSpokeProvider>,
        spokeProvider,
        hubProvider,
      );
    }
    if (spokeProvider instanceof SolanaSpokeProvider) {
      return SolanaSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<SolanaSpokeProvider>,
        spokeProvider,
        hubProvider,
      );
    }
    if (spokeProvider instanceof StellarSpokeProvider) {
      return StellarSpokeService.getSimulateDepositParams(
        params as GetSpokeDepositParamsType<StellarSpokeProvider>,
        spokeProvider,
        hubProvider,
      );
    }

    throw new Error('Invalid spoke provider');
  }

  public static async verifyDepositSimulation<S extends SpokeProvider>(
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
   * @param {SpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static getDeposit(token: Address, spokeProvider: SpokeProvider): Promise<bigint> {
    if (spokeProvider instanceof EvmSpokeProvider) {
      return EvmSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof InjectiveSpokeProvider) {
      return InjectiveSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof StellarSpokeProvider) {
      return StellarSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof SuiSpokeProvider) {
      return SuiSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof IconSpokeProvider) {
      return IconSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof SolanaSpokeProvider) {
      return SolanaSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof SonicSpokeProvider) {
      return SonicSpokeService.getDeposit(token, spokeProvider);
    }
     if (spokeProvider instanceof NearSpokeProvider) {
      return NearSpokeService.getDeposit(token, spokeProvider);
    }

    throw new Error('Invalid spoke provider');
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {HubAddress} from - The address of the user on the hub chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async callWallet<T extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: T,
    hubProvider: EvmHubProvider,
    raw?: R,
    skipSimulation = false,
  ): Promise<TxReturnType<T, R>> {
    if (isSonicSpokeProvider(spokeProvider)) {
      return (await SonicSpokeService.callWallet(payload, spokeProvider, raw)) satisfies TxReturnType<
        SonicSpokeProvider,
        R
      > as TxReturnType<T, R>;
    }
    if (isEvmSpokeProvider(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await EvmSpokeService.callWallet(from, payload, spokeProvider, hubProvider)) satisfies TxReturnType<
        EvmSpokeProvider,
        R
      > as TxReturnType<T, R>;
    }
    if (isInjectiveSpokeProvider(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await InjectiveSpokeService.callWallet(
        from,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      )) satisfies TxReturnType<InjectiveSpokeProvider, R> as TxReturnType<T, R>;
    }
    if (isIconSpokeProvider(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await IconSpokeService.callWallet(from, payload, spokeProvider, hubProvider, raw)) satisfies TxReturnType<
        IconSpokeProvider,
        R
      > as TxReturnType<T, R>;
    }
    if (isSuiSpokeProvider(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await SuiSpokeService.callWallet(from, payload, spokeProvider, hubProvider, raw)) satisfies TxReturnType<
        SuiSpokeProvider,
        R
      > as TxReturnType<T, R>;
    }
    if (isSolanaSpokeProvider(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await SolanaSpokeService.callWallet(
        from,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      )) satisfies TxReturnType<SolanaSpokeProvider, R> as TxReturnType<T, R>;
    }
    if (isStellarSpokeProvider(spokeProvider)) {
      await SpokeService.verifySimulation(from, payload, spokeProvider, hubProvider, skipSimulation);
      return (await StellarSpokeService.callWallet(from, payload, spokeProvider, hubProvider)) satisfies TxReturnType<
        StellarSpokeProvider,
        R
      > as TxReturnType<T, R>;
    }

     if (isNearSpokeProvider(spokeProvider)) {
      return (await NearSpokeService.callWallet(from, payload, spokeProvider, hubProvider)) satisfies TxReturnType<
        NearSpokeProvider,
        R
      > as TxReturnType<T, R>;
    }

    throw new Error('Invalid spoke provider');
  }


  /**
   * Get max withdrawable balance for token.
   * @param {string| Address} token - The address of the token to get the balance of.
   * @param {SpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The max limit allowed for token.
   */
  public static getLimit(token: string | Address, spokeProvider: SpokeProvider): Promise<bigint> {
    if (spokeProvider instanceof NearSpokeProvider) {
      return NearSpokeService.getLimit(token as string, spokeProvider);
    }
    
    throw new Error('Invalid spoke provider');
  }

  /**
   * Get available withdrawable amount.
   * @param {string| Address} token - The address of the token to get the balance of.
   * @param {SpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The available withdrawable amount for token.
   */
  public static getAvailable(token: string | Address, spokeProvider: SpokeProvider): Promise<bigint> {
    if (spokeProvider instanceof NearSpokeProvider) {
      return NearSpokeService.getAvailable(token as string, spokeProvider);
    }

    
    throw new Error('Invalid spoke provider');
  }

  public static async verifySimulation(
    from: HubAddress,
    payload: Hex,
    spokeProvider: SpokeProvider,
    hubProvider: EvmHubProvider,
    skipSimulation: boolean,
  ): Promise<void> {
    if (!skipSimulation) {
      const result = await SpokeService.simulateRecvMessage(
        {
          target: from,
          srcChainId: getIntentRelayChainId(spokeProvider.chainConfig.chain.id),
          srcAddress: await spokeProvider.walletProvider.getWalletAddressBytes(),
          payload,
        },
        hubProvider,
      );

      if (!result.success) {
        throw new Error('Simulation failed', { cause: result });
      }
    }
  }
}
