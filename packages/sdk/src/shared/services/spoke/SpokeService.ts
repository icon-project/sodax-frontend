// packages/sdk/src/shared/services/spoke/SpokeService.ts
import * as rlp from 'rlp';
import { encodeFunctionData, type Address } from 'viem';
import {
  type Hex,
  type BitcoinChainKey,
  type HubChainKey,
  type IconChainKey,
  type InjectiveChainKey,
  type NearChainKey,
  type SolanaChainKey,
  type SonicChainKey,
  type SpokeChainKey,
  type StellarChainKey,
  type StacksChainKey,
  type SuiChainKey,
  getChainType,
  type EvmSpokeOnlyChainKey,
  ChainTypeArr,
  type GetEstimateGasReturnType,
  type EvmChainKey,
  spokeChainConfig,
  getIntentRelayChainId,
  type TxReturnType,
  isBitcoinChainKey,
  type Result,
} from '@sodax/types';
import { encodeAddress } from '../../utils/shared-utils.js';
import { StacksSpokeService } from './StacksSpokeService.js';
import { BitcoinSpokeService } from './BitcoinSpokeService.js';
import { NearSpokeService } from './NearSpokeService.js';
import { SonicSpokeService } from './SonicSpokeService.js';
import { SuiSpokeService } from './SuiSpokeService.js';
import { StellarSpokeService } from './StellarSpokeService.js';
import { SolanaSpokeService } from './SolanaSpokeService.js';
import { IconSpokeService } from './IconSpokeService.js';
import { EvmSpokeService } from './EvmSpokeService.js';
import { InjectiveSpokeService } from './InjectiveSpokeService.js';
import {
  isHubChainKeyType,
  isNearChainKeyType,
  isSolanaChainKeyType,
  isSpokeIsAllowanceValidParamsEvmSpoke,
  isSpokeIsAllowanceValidParamsHub,
  isSpokeIsAllowanceValidParamsStellar,
  isStellarChainKeyType,
  isValidWalletProviderTypeForChainKey,
  isSpokeApproveParamsHub,
  isSpokeApproveParamsEvmSpoke,
  isSpokeApproveParamsStellar,
  isSuiChainKeyType,
} from '../../guards.js';
import type { ConfigService } from '../../config/ConfigService.js';
import type { EvmHubProvider } from '../../entities/EvmHubProvider.js';
import type {
  DepositParams,
  EstimateGasParams,
  GetDepositParams,
  SendMessageParams,
  VerifySimulationParams,
  WalletSimulationParams,
  WaitForTxReceiptParams,
  WaitForTxReceiptReturnType,
  VerifyTxHashParams,
  SpokeIsAllowanceValidParams,
  SpokeApproveParams,
} from '../../types/spoke-types.js';
import { Erc20Service, type Erc20ApproveParams } from '../erc-20/Erc20Service.js';
import type { RequestTrustlineParams } from './StellarSpokeService.js';
import type { WalletMode } from './BitcoinSpokeService.js';
import invariant from 'tiny-invariant';

export type SpokeServiceType =
  | EvmSpokeService
  | SonicSpokeService
  | SolanaSpokeService
  | StellarSpokeService
  | IconSpokeService
  | SuiSpokeService
  | InjectiveSpokeService
  | StacksSpokeService
  | NearSpokeService
  | BitcoinSpokeService;

export type GetSpokeServiceType<C extends SpokeChainKey> = C extends EvmSpokeOnlyChainKey
  ? EvmSpokeService
  : C extends SonicChainKey
    ? SonicSpokeService
    : C extends SolanaChainKey
      ? SolanaSpokeService
      : C extends StellarChainKey
        ? StellarSpokeService
        : C extends IconChainKey
          ? IconSpokeService
          : C extends SuiChainKey
            ? SuiSpokeService
            : C extends InjectiveChainKey
              ? InjectiveSpokeService
              : C extends StacksChainKey
                ? StacksSpokeService
                : C extends NearChainKey
                  ? NearSpokeService
                  : C extends BitcoinChainKey
                    ? BitcoinSpokeService
                    : SpokeServiceType;

export type SpokeServiceConstructorParams = {
  config: ConfigService;
  hubProvider: EvmHubProvider;
};

/**
 * SpokeService is a main class that provides functionalities for dealing with spoke chains (including hub chain).
 * It uses command pattern to execute different spoke (including hub) chain operations.
 * Important: you should always first handle hub chain id first (since it is evm type, it is also included in evm chain id set).
 * @namespace SodaxPublicUtils
 */

export class SpokeService {
  private readonly hubProvider: EvmHubProvider;
  private readonly config: ConfigService;

  public readonly evmSpokeService: EvmSpokeService;
  public readonly sonicSpokeService: SonicSpokeService;
  public readonly injectiveSpokeService: InjectiveSpokeService;
  public readonly iconSpokeService: IconSpokeService;
  public readonly suiSpokeService: SuiSpokeService;
  public readonly solanaSpokeService: SolanaSpokeService;
  public readonly stellarSpokeService: StellarSpokeService;
  public readonly bitcoinSpokeService: BitcoinSpokeService;
  public readonly nearSpokeService: NearSpokeService;
  public readonly stacksSpokeService: StacksSpokeService;

  public constructor({ config, hubProvider }: SpokeServiceConstructorParams) {
    this.config = config;
    this.hubProvider = hubProvider;
    this.evmSpokeService = new EvmSpokeService();
    this.sonicSpokeService = new SonicSpokeService(this.config);
    this.injectiveSpokeService = new InjectiveSpokeService(this.config);
    this.iconSpokeService = new IconSpokeService(this.config);
    this.suiSpokeService = new SuiSpokeService(this.config);
    this.solanaSpokeService = new SolanaSpokeService(this.config);
    this.stellarSpokeService = new StellarSpokeService(this.config);
    this.bitcoinSpokeService = new BitcoinSpokeService(this.config);
    this.nearSpokeService = new NearSpokeService(this.config);
    this.stacksSpokeService = new StacksSpokeService(this.config);
  }

  public getSpokeService<C extends SpokeChainKey>(chainKey: C): GetSpokeServiceType<C> {
    if (isHubChainKeyType(chainKey)) {
      // handle hub chain id first (since it is evm type, it is also included in evm chain id set)
      return this.sonicSpokeService satisfies GetSpokeServiceType<SonicChainKey> as GetSpokeServiceType<C>;
    }

    const chainType = getChainType(chainKey);
    switch (chainType) {
      case 'EVM': {
        return this.evmSpokeService satisfies GetSpokeServiceType<EvmSpokeOnlyChainKey> as GetSpokeServiceType<C>;
      }
      case 'INJECTIVE': {
        return this.injectiveSpokeService satisfies GetSpokeServiceType<InjectiveChainKey> as GetSpokeServiceType<C>;
      }
      case 'ICON': {
        return this.iconSpokeService satisfies GetSpokeServiceType<IconChainKey> as GetSpokeServiceType<C>;
      }
      case 'SUI': {
        return this.suiSpokeService satisfies GetSpokeServiceType<SuiChainKey> as GetSpokeServiceType<C>;
      }
      case 'SOLANA': {
        return this.solanaSpokeService satisfies GetSpokeServiceType<SolanaChainKey> as GetSpokeServiceType<C>;
      }
      case 'STELLAR': {
        return this.stellarSpokeService satisfies GetSpokeServiceType<StellarChainKey> as GetSpokeServiceType<C>;
      }
      case 'STACKS': {
        return this.stacksSpokeService satisfies GetSpokeServiceType<StacksChainKey> as GetSpokeServiceType<C>;
      }
      case 'BITCOIN': {
        return this.bitcoinSpokeService satisfies GetSpokeServiceType<BitcoinChainKey> as GetSpokeServiceType<C>;
      }
      case 'NEAR': {
        return this.nearSpokeService satisfies GetSpokeServiceType<NearChainKey> as GetSpokeServiceType<C>;
      }
      default: {
        const exhaustiveCheck: never = chainType; // The never type is used to ensure that the default case is exhaustive
        console.log(exhaustiveCheck);
        throw new Error(`[getSpokeService] Invalid chain type. Valid chain types: ${ChainTypeArr.join(', ')}`);
      }
    }
  }

  /**
   * Check ERC-20 allowance (EVM / hub) or Stellar trustline sufficiency using unified params.
   * Feature services map their action payloads into {@link SpokeIsAllowanceValidParams}.
   */
  public async isAllowanceValid(params: SpokeIsAllowanceValidParams): Promise<Result<boolean>> {
    try {
      if (isSpokeIsAllowanceValidParamsHub(params)) {
        const { srcChainKey, token, amount, owner, spender } = params;
        return await this.sonicSpokeService.isAllowanceValid({
          token: token as Address,
          amount,
          owner: owner as Address,
          spender,
          chainKey: srcChainKey,
        });
      }

      if (isSpokeIsAllowanceValidParamsEvmSpoke(params)) {
        const { srcChainKey, token, amount, owner } = params;
        const spender = params.spender ?? spokeChainConfig[srcChainKey].addresses.assetManager;
        return await this.evmSpokeService.isAllowanceValid({
          token: token as Address,
          amount,
          owner: owner as Address,
          spender,
          chainKey: srcChainKey,
        });
      }

      if (isSpokeIsAllowanceValidParamsStellar(params)) {
        const { token, amount, owner } = params;
        return {
          ok: true,
          value: await this.stellarSpokeService.hasSufficientTrustline(token, amount, owner),
        };
      }

      return { ok: true, value: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Approve ERC-20 spending on hub / EVM spoke or request a Stellar trustline using unified params.
   * Feature services map their action payloads into {@link SpokeApproveParams}.
   */
  public async approve<K extends SpokeChainKey, Raw extends boolean>(
    params: SpokeApproveParams<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>>> {
    try {
      invariant(
        isValidWalletProviderTypeForChainKey(params.srcChainKey, params.walletProvider),
        `Invalid wallet provider for chain key: ${params.srcChainKey}, walletProvider.chainType: ${params.walletProvider?.chainType}`,
      );

      if (isSpokeApproveParamsHub(params)) {
        const result = await Erc20Service.approve<Raw>({
          ...params,
          token: params.token,
          amount: params.amount,
          from: params.owner,
          spender: params.spender,
        } as Erc20ApproveParams<Raw>);

        return {
          ok: true,
          value: result satisfies TxReturnType<HubChainKey, Raw> as TxReturnType<K, Raw>,
        };
      }

      if (isSpokeApproveParamsEvmSpoke(params)) {
        const result = await Erc20Service.approve<Raw>({
          ...params,
          token: params.token,
          amount: params.amount,
          from: params.owner,
          spender: params.spender,
        } as Erc20ApproveParams<Raw>);
        return {
          ok: true,
          value: result satisfies TxReturnType<EvmChainKey, Raw> as TxReturnType<K, Raw>,
        };
      }

      if (isSpokeApproveParamsStellar(params)) {
        const result = await this.stellarSpokeService.requestTrustline<Raw>({
          ...params,
          srcAddress: params.owner,
          srcChainKey: params.srcChainKey,
          token: params.token,
          amount: params.amount,
        } as RequestTrustlineParams<StellarChainKey, Raw>);

        return {
          ok: true,
          value: result satisfies TxReturnType<StellarChainKey, Raw> as TxReturnType<K, Raw>,
        };
      }

      return {
        ok: false,
        error: new Error('[SpokeService.approve] Only hub (Sonic), EVM spokes, and Stellar are supported'),
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Estimate the gas for a raw transaction.
   * @param {TxReturnType<T, true>} params - The parameters for the raw transaction.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<GetEstimateGasReturnType<T>>} A promise that resolves to the gas.
   */
  public async estimateGas<C extends SpokeChainKey>(
    params: EstimateGasParams<C>,
  ): Promise<Result<GetEstimateGasReturnType<C>>> {
    try {
      if (isHubChainKeyType(params.chainKey)) {
        const value = (await this.hubProvider.service.estimateGas(
          params as EstimateGasParams<HubChainKey>,
        )) satisfies GetEstimateGasReturnType<HubChainKey> as GetEstimateGasReturnType<C>;
        return { ok: true, value };
      }

      const chainType = getChainType(params.chainKey);

      switch (chainType) {
        case 'EVM': {
          const value = (await this.evmSpokeService.estimateGas(
            params as EstimateGasParams<EvmSpokeOnlyChainKey>,
          )) satisfies GetEstimateGasReturnType<EvmChainKey> as GetEstimateGasReturnType<C>;
          return { ok: true, value };
        }
        case 'INJECTIVE': {
          const value = (await this.injectiveSpokeService.estimateGas(
            params as EstimateGasParams<InjectiveChainKey>,
          )) satisfies GetEstimateGasReturnType<InjectiveChainKey> as GetEstimateGasReturnType<C>;
          return { ok: true, value };
        }
        case 'ICON': {
          const value = (await this.iconSpokeService.estimateGas(
            params as EstimateGasParams<IconChainKey>,
          )) satisfies GetEstimateGasReturnType<IconChainKey> as GetEstimateGasReturnType<C>;
          return { ok: true, value };
        }
        case 'SUI': {
          const value = (await this.suiSpokeService.estimateGas(
            params as EstimateGasParams<SuiChainKey>,
          )) satisfies GetEstimateGasReturnType<SuiChainKey> as GetEstimateGasReturnType<C>;
          return { ok: true, value };
        }
        case 'SOLANA': {
          const value = (await this.solanaSpokeService.estimateGas(
            params as EstimateGasParams<SolanaChainKey>,
          )) satisfies GetEstimateGasReturnType<SolanaChainKey> as GetEstimateGasReturnType<C>;
          return { ok: true, value };
        }
        case 'STELLAR': {
          const value = (await this.stellarSpokeService.estimateGas(
            params as EstimateGasParams<StellarChainKey>,
          )) satisfies GetEstimateGasReturnType<StellarChainKey> as GetEstimateGasReturnType<C>;
          return { ok: true, value };
        }
        case 'STACKS': {
          const value = (await this.stacksSpokeService.estimateGas(
            params as EstimateGasParams<StacksChainKey>,
          )) satisfies GetEstimateGasReturnType<StacksChainKey> as GetEstimateGasReturnType<C>;
          return { ok: true, value };
        }
        case 'BITCOIN': {
          const value = (await this.bitcoinSpokeService.estimateGas(
            params as EstimateGasParams<BitcoinChainKey>,
          )) satisfies GetEstimateGasReturnType<BitcoinChainKey> as GetEstimateGasReturnType<C>;
          return { ok: true, value };
        }
        case 'NEAR': {
          const value = (await this.nearSpokeService.estimateGas(
            params as EstimateGasParams<NearChainKey>,
          )) satisfies GetEstimateGasReturnType<NearChainKey> as GetEstimateGasReturnType<C>;
          return { ok: true, value };
        }
        default: {
          const exhaustiveCheck: never = chainType;
          console.log(exhaustiveCheck);
          return {
            ok: false,
            error: new Error(`[estimateGas] Invalid chain type. Valid chain types: ${ChainTypeArr.join(', ')}`),
          };
        }
      }
    } catch (error) {
      return { ok: false, error };
    }
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
  public async simulateDeposit(params: DepositParams<SpokeChainKey, boolean>): Promise<Result<boolean>> {
    try {
      if (isHubChainKeyType(params.srcChainKey)) {
        return { ok: false, error: new Error('Hub chain id is not supported for deposit simulation') };
      }

      const chainId = getIntentRelayChainId(params.srcChainKey);
      const hubAssetManager = this.hubProvider.chainConfig.addresses.assetManager;
      const { encodedToken, encodedSrcAddress } = this.resolveSimulationEncoding(params.srcChainKey, params.token);

      const payload = SpokeService.encodeTransfer(
        encodedToken,
        encodeAddress(params.srcChainKey, params.srcAddress),
        params.to,
        params.amount,
        params.data,
      );

      return await this.simulateRecvMessage({
        target: hubAssetManager,
        srcChainId: chainId,
        srcAddress: encodedSrcAddress,
        payload,
      });
    } catch (error) {
      return { ok: false, error };
    }
  }

  private resolveSimulationEncoding(
    srcChainKey: Exclude<SpokeChainKey, HubChainKey>,
    token: string,
  ): { encodedToken: Hex; encodedSrcAddress: Hex } {
    const assetManager = spokeChainConfig[srcChainKey].addresses.assetManager;
    switch (getChainType(srcChainKey)) {
      case 'ICON':
        return this.iconSpokeService.encodeSimulationParams(token, assetManager);
      case 'SUI':
        return this.suiSpokeService.encodeSimulationParams(token, assetManager);
      default:
        return {
          encodedToken: encodeAddress(srcChainKey, token),
          encodedSrcAddress: encodeAddress(srcChainKey, assetManager),
        };
    }
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
  public async simulateRecvMessage(params: WalletSimulationParams): Promise<Result<boolean>> {
    try {
      const result = await this.hubProvider.publicClient.call({
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

      console.warn('simulateRecvMessage did not revert as expected', { result });
      return {
        ok: false,
        error: new Error('Function should have reverted with "Simulation completed"'),
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('Simulation completed')) {
        console.warn('simulateRecvMessage completed successfully with expected revert');
        return { ok: true, value: true };
      }

      console.error('simulateRecvMessage failed with unexpected error:', error);
      return { ok: false, error };
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
  public async deposit<K extends SpokeChainKey, R extends boolean>(
    params: DepositParams<K, R>,
  ): Promise<Result<TxReturnType<K, R>>> {
    try {
      if (isHubChainKeyType(params.srcChainKey)) {
        const value = (await SonicSpokeService.deposit(
          params as DepositParams<SonicChainKey, R>,
        )) satisfies TxReturnType<SonicChainKey, R> as TxReturnType<K, R>;
        return { ok: true, value };
      }

      const chainType = getChainType(params.srcChainKey);
      switch (chainType) {
        case 'EVM': {
          const verify = await this.verifyDepositSimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.evmSpokeService.deposit(
            params as DepositParams<EvmSpokeOnlyChainKey, R>,
          )) satisfies TxReturnType<EvmChainKey, R> as TxReturnType<K, R>;
          return { ok: true, value };
        }
        case 'INJECTIVE': {
          const verify = await this.verifyDepositSimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.injectiveSpokeService.deposit(
            params as DepositParams<InjectiveChainKey, R>,
          )) satisfies TxReturnType<InjectiveChainKey, R> as TxReturnType<K, R>;
          return { ok: true, value };
        }
        case 'STELLAR': {
          const verify = await this.verifyDepositSimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.stellarSpokeService.deposit(
            params as DepositParams<StellarChainKey, R>,
          )) satisfies TxReturnType<StellarChainKey, R> as TxReturnType<K, R>;
          return { ok: true, value };
        }
        case 'SUI': {
          const verify = await this.verifyDepositSimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.suiSpokeService.deposit(
            params as DepositParams<SuiChainKey, R>,
          )) satisfies TxReturnType<SuiChainKey, R> as TxReturnType<K, R>;
          return { ok: true, value };
        }
        case 'ICON': {
          const verify = await this.verifyDepositSimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.iconSpokeService.deposit(
            params as DepositParams<IconChainKey, R>,
          )) satisfies TxReturnType<IconChainKey, R> as TxReturnType<K, R>;
          return { ok: true, value };
        }
        case 'SOLANA': {
          const verify = await this.verifyDepositSimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.solanaSpokeService.deposit(
            params as DepositParams<SolanaChainKey, R>,
          )) satisfies TxReturnType<SolanaChainKey, R> as TxReturnType<K, R>;
          return { ok: true, value };
        }
        case 'STACKS': {
          const verify = await this.verifyDepositSimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.stacksSpokeService.deposit(
            params as DepositParams<StacksChainKey, R>,
          )) satisfies TxReturnType<StacksChainKey, R> as TxReturnType<K, R>;
          return { ok: true, value };
        }
        case 'BITCOIN': {
          const verify = await this.verifyDepositSimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.bitcoinSpokeService.deposit(
            params as DepositParams<BitcoinChainKey, R> & { accessToken?: string },
          )) satisfies TxReturnType<BitcoinChainKey, R> as TxReturnType<K, R>;
          return { ok: true, value };
        }
        case 'NEAR': {
          const verify = await this.verifyDepositSimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.nearSpokeService.deposit(
            params as DepositParams<NearChainKey, R>,
          )) satisfies TxReturnType<NearChainKey, R> as TxReturnType<K, R>;
          return { ok: true, value };
        }
        default: {
          const exhaustiveCheck: never = chainType;
          console.log(exhaustiveCheck);
          return {
            ok: false,
            error: new Error(`[deposit] Invalid chain type. Valid chain types: ${ChainTypeArr.join(', ')}`),
          };
        }
      }
    } catch (error) {
      return { ok: false, error };
    }
  }

  public async verifyDepositSimulation<C extends SpokeChainKey, R extends boolean>(
    params: DepositParams<C, R>,
  ): Promise<Result<void>> {
    try {
      if (!params.skipSimulation) {
        const result = await this.simulateDeposit(params);
        if (!result.ok) return result;
        if (!result.value) {
          return { ok: false, error: new Error('SIMULATION_FAILED') };
        }
      }
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Get the balance of the token in the spoke chain asset manager.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {SpokeProviderType} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public async getDeposit<C extends SpokeChainKey>(params: GetDepositParams<C>): Promise<Result<bigint>> {
    try {
      if (isHubChainKeyType(params.srcChainKey)) {
        const value = await this.sonicSpokeService.getDeposit(params as GetDepositParams<SonicChainKey>);
        return { ok: true, value };
      }

      const chainType = getChainType(params.srcChainKey);
      switch (chainType) {
        case 'EVM': {
          const value = await this.evmSpokeService.getDeposit(params as GetDepositParams<EvmSpokeOnlyChainKey>);
          return { ok: true, value };
        }
        case 'INJECTIVE': {
          const value = await this.injectiveSpokeService.getDeposit(params as GetDepositParams<InjectiveChainKey>);
          return { ok: true, value };
        }
        case 'STELLAR': {
          const value = await this.stellarSpokeService.getDeposit(params as GetDepositParams<StellarChainKey>);
          return { ok: true, value };
        }
        case 'SUI': {
          const value = await this.suiSpokeService.getDeposit(params as GetDepositParams<SuiChainKey>);
          return { ok: true, value };
        }
        case 'ICON': {
          const value = await this.iconSpokeService.getDeposit(params as GetDepositParams<IconChainKey>);
          return { ok: true, value };
        }
        case 'SOLANA': {
          const value = await this.solanaSpokeService.getDeposit(params as GetDepositParams<SolanaChainKey>);
          return { ok: true, value };
        }
        case 'STACKS': {
          const value = await this.stacksSpokeService.getDeposit(params as GetDepositParams<StacksChainKey>);
          return { ok: true, value };
        }
        case 'BITCOIN': {
          const value = await this.bitcoinSpokeService.getDeposit(params as GetDepositParams<BitcoinChainKey>);
          return { ok: true, value };
        }
        case 'NEAR': {
          const value = await this.nearSpokeService.getDeposit(params as GetDepositParams<NearChainKey>);
          return { ok: true, value };
        }
        default: {
          const exhaustiveCheck: never = chainType;
          console.log(exhaustiveCheck);
          return {
            ok: false,
            error: new Error(`[getDeposit] Invalid chain type. Valid chain types: ${ChainTypeArr.join(', ')}`),
          };
        }
      }
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Calls the connection contract on the spoke chain to send a message to the hub wallet, which then executes the message's payload.
   * @param {HubAddress} from - The address of the user on the hub chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {SpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public async sendMessage<K extends SpokeChainKey, Raw extends boolean>(
    params: SendMessageParams<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>>> {
    try {
      if (isHubChainKeyType(params.srcChainKey)) {
        const value = (await this.sonicSpokeService.sendMessage(
          params as SendMessageParams<SonicChainKey, Raw>,
        )) as TxReturnType<K, Raw>;
        return { ok: true, value };
      }

      const effectiveAddress = isBitcoinChainKey(params.srcChainKey)
        ? await this.bitcoinSpokeService.getEffectiveWalletAddress(params.srcAddress)
        : params.srcAddress;
      const srcAddress = encodeAddress(params.srcChainKey, effectiveAddress);

      if (!params.skipSimulation) {
        const result = await this.simulateRecvMessage({
          target: params.dstAddress,
          srcChainId: getIntentRelayChainId(params.srcChainKey),
          srcAddress,
          payload: params.payload,
        });
        if (!result.ok) return result;
        if (!result.value) {
          return { ok: false, error: new Error('SIMULATION_FAILED') };
        }
      }

      const chainType = getChainType(params.srcChainKey);
      switch (chainType) {
        case 'EVM': {
          const verify = await this.verifySimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.evmSpokeService.sendMessage(
            params as SendMessageParams<EvmSpokeOnlyChainKey, Raw>,
          )) as TxReturnType<EvmSpokeOnlyChainKey, Raw> as TxReturnType<K, Raw>;
          return { ok: true, value };
        }
        case 'INJECTIVE': {
          const verify = await this.verifySimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.injectiveSpokeService.sendMessage(
            params as SendMessageParams<InjectiveChainKey, Raw>,
          )) as TxReturnType<InjectiveChainKey, Raw> as TxReturnType<K, Raw>;
          return { ok: true, value };
        }
        case 'ICON': {
          const verify = await this.verifySimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.iconSpokeService.sendMessage(
            params as SendMessageParams<IconChainKey, Raw>,
          )) as TxReturnType<IconChainKey, Raw> as TxReturnType<K, Raw>;
          return { ok: true, value };
        }
        case 'SUI': {
          const verify = await this.verifySimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.suiSpokeService.sendMessage(
            params as SendMessageParams<SuiChainKey, Raw>,
          )) as TxReturnType<SuiChainKey, Raw> as TxReturnType<K, Raw>;
          return { ok: true, value };
        }
        case 'SOLANA': {
          const verify = await this.verifySimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.solanaSpokeService.sendMessage(
            params as SendMessageParams<SolanaChainKey, Raw>,
          )) as TxReturnType<SolanaChainKey, Raw> as TxReturnType<K, Raw>;
          return { ok: true, value };
        }
        case 'STELLAR': {
          const verify = await this.verifySimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.stellarSpokeService.sendMessage(
            params as SendMessageParams<StellarChainKey, Raw>,
          )) as TxReturnType<StellarChainKey, Raw> as TxReturnType<K, Raw>;
          return { ok: true, value };
        }
        case 'STACKS': {
          const verify = await this.verifySimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.stacksSpokeService.sendMessage(
            params as SendMessageParams<StacksChainKey, Raw>,
          )) as TxReturnType<StacksChainKey, Raw> as TxReturnType<K, Raw>;
          return { ok: true, value };
        }
        case 'BITCOIN': {
          const verify = await this.verifySimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.bitcoinSpokeService.sendMessage(
            params as SendMessageParams<BitcoinChainKey, Raw> & { walletMode?: WalletMode },
          )) as TxReturnType<BitcoinChainKey, Raw> as TxReturnType<K, Raw>;
          return { ok: true, value };
        }
        case 'NEAR': {
          const verify = await this.verifySimulation(params);
          if (!verify.ok) return verify;
          const value = (await this.nearSpokeService.sendMessage(
            params as SendMessageParams<NearChainKey, Raw>,
          )) as TxReturnType<NearChainKey, Raw> as TxReturnType<K, Raw>;
          return { ok: true, value };
        }
        default: {
          const exhaustiveCheck: never = chainType;
          console.log(exhaustiveCheck);
          return {
            ok: false,
            error: new Error(`[sendMessage] Invalid chain type. Valid chain types: ${ChainTypeArr.join(', ')}`),
          };
        }
      }
    } catch (error) {
      return { ok: false, error };
    }
  }

  public async verifySimulation<K extends SpokeChainKey, Raw extends boolean>(
    params: VerifySimulationParams<K, Raw>,
  ): Promise<Result<void>> {
    try {
      if (!params.skipSimulation) {
        const effectiveAddr = isBitcoinChainKey(params.srcChainKey)
          ? await this.bitcoinSpokeService.getEffectiveWalletAddress(params.srcAddress)
          : params.srcAddress;
        const srcAddress = encodeAddress(params.srcChainKey, effectiveAddr);

        const result = await this.simulateRecvMessage({
          target: params.dstAddress,
          srcChainId: getIntentRelayChainId(params.srcChainKey),
          srcAddress,
          payload: params.payload,
        });
        if (!result.ok) return result;
        if (!result.value) {
          return { ok: false, error: new Error('SIMULATION_FAILED') };
        }
      }
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Get max withdrawable balance for token.
   * @param {string} token - The address of the token to get the balance of.
   * @param {SpokeChainKey} chainId - The spoke chain id.
   * @returns {Promise<bigint>} The max limit allowed for token.
   */
  public async getLimit(token: string, chainId: SpokeChainKey): Promise<Result<bigint>> {
    try {
      if (isNearChainKeyType(chainId)) {
        const value = await this.nearSpokeService.getLimit(token, chainId);
        return { ok: true, value };
      }
      return { ok: false, error: new Error(`getLimit not supported for ${chainId} chain`) };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Get available withdrawable amount.
   * @param {string} token - The address of the token to get the balance of.
   * @param {SpokeChainKey} chainId - The spoke chain id.
   * @returns {Promise<Result<bigint>>} The available withdrawable amount for token.
   */
  public async getAvailable(token: string, chainId: SpokeChainKey): Promise<Result<bigint>> {
    try {
      if (isNearChainKeyType(chainId)) {
        const value = await this.nearSpokeService.getAvailable(token, chainId);
        return { ok: true, value };
      }
      return { ok: false, error: new Error(`getAvailable not supported for ${chainId} chain`) };
    } catch (error) {
      return { ok: false, error };
    }
  }
  /**
   * Verifies the transaction hash for the spoke chain to exist on chain.
   * Only stellar and solana need to be verified. For other chains, we assume the transaction exists on chain.
   * @param txHash - The transaction hash to verify.
   * @param spokeProvider - The spoke provider.
   * @returns {Promise<Result<boolean>>} A promise that resolves to the result of the verification.
   */
  public async verifyTxHash(params: VerifyTxHashParams): Promise<Result<boolean>> {
    try {
      const { txHash, chainKey } = params;

      if (isSolanaChainKeyType(chainKey)) {
        const result = await this.solanaSpokeService.waitForTransactionReceipt({ txHash, chainKey });

        if (!result.ok || result.value.status !== 'success') {
          console.warn(
            `Solana verifyTxHash failed: ${!result.ok ? result.error : 'error' in result.value ? result.value.error : 'unknown'}`,
          );
          console.warn('Returning true to assume transaction exists on chain in future ');
          return { ok: true, value: true };
        }

        return { ok: true, value: true };
      }
      if (isNearChainKeyType(chainKey)) {
        const result = await this.nearSpokeService.waitForTransactionReceipt({ txHash, chainKey });
        if (result.ok && result.value.status === 'success') {
          return { ok: true, value: true };
        }
        return { ok: false, error: new Error('TRANSACTION_VERIFICATION_FAILED') };
      }
      if (isStellarChainKeyType(chainKey)) {
        const result = await this.stellarSpokeService.waitForTransactionReceipt({ txHash, chainKey });
        if (result.ok && result.value.status === 'success') {
          return { ok: true, value: true };
        }
        return { ok: false, error: new Error('TRANSACTION_VERIFICATION_FAILED') };
      }
      if (isSuiChainKeyType(chainKey)) {
        const result = await this.suiSpokeService.waitForTransactionReceipt({ txHash, chainKey });
        if (result.ok && result.value.status === 'success') {
          return { ok: true, value: true };
        }
        return { ok: false, error: new Error('TRANSACTION_VERIFICATION_FAILED') };
      }

      return { ok: true, value: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  public async waitForTxReceipt<C extends SpokeChainKey = SpokeChainKey>(
    params: WaitForTxReceiptParams<C>,
  ): Promise<Result<WaitForTxReceiptReturnType<C>>> {
    try {
      const effectiveParams: WaitForTxReceiptParams<C> = {
        pollingIntervalMs: this.config.sodaxConfig.chains[params.chainKey].pollingConfig.pollingIntervalMs,
        maxTimeoutMs: this.config.sodaxConfig.chains[params.chainKey].pollingConfig.maxTimeoutMs,
        ...params,
      };

      if (isHubChainKeyType(params.chainKey)) {
        return (await this.sonicSpokeService.waitForTransactionReceipt(
          effectiveParams as WaitForTxReceiptParams<SonicChainKey>,
        )) satisfies Result<WaitForTxReceiptReturnType<SonicChainKey>> as Result<WaitForTxReceiptReturnType<C>>;
      }

      const chainType = getChainType(params.chainKey);
      switch (chainType) {
        case 'EVM': {
          return (await this.evmSpokeService.waitForTransactionReceipt(
            effectiveParams as WaitForTxReceiptParams<EvmSpokeOnlyChainKey>,
          )) satisfies Result<WaitForTxReceiptReturnType<EvmSpokeOnlyChainKey>> as Result<
            WaitForTxReceiptReturnType<C>
          >;
        }
        case 'INJECTIVE': {
          return (await this.injectiveSpokeService.waitForTransactionReceipt(
            effectiveParams as WaitForTxReceiptParams<InjectiveChainKey>,
          )) satisfies Result<WaitForTxReceiptReturnType<InjectiveChainKey>> as Result<WaitForTxReceiptReturnType<C>>;
        }
        case 'ICON': {
          return (await this.iconSpokeService.waitForTransactionReceipt(
            effectiveParams as WaitForTxReceiptParams<IconChainKey>,
          )) satisfies Result<WaitForTxReceiptReturnType<IconChainKey>> as Result<WaitForTxReceiptReturnType<C>>;
        }
        case 'SUI': {
          return (await this.suiSpokeService.waitForTransactionReceipt(
            effectiveParams as WaitForTxReceiptParams<SuiChainKey>,
          )) satisfies Result<WaitForTxReceiptReturnType<SuiChainKey>> as Result<WaitForTxReceiptReturnType<C>>;
        }
        case 'SOLANA': {
          return (await this.solanaSpokeService.waitForTransactionReceipt(
            effectiveParams as WaitForTxReceiptParams<SolanaChainKey>,
          )) satisfies Result<WaitForTxReceiptReturnType<SolanaChainKey>> as Result<WaitForTxReceiptReturnType<C>>;
        }
        case 'STELLAR': {
          return (await this.stellarSpokeService.waitForTransactionReceipt(
            effectiveParams as WaitForTxReceiptParams<StellarChainKey>,
          )) satisfies Result<WaitForTxReceiptReturnType<StellarChainKey>> as Result<WaitForTxReceiptReturnType<C>>;
        }
        case 'STACKS': {
          return (await this.stacksSpokeService.waitForTransactionReceipt(
            effectiveParams as WaitForTxReceiptParams<StacksChainKey>,
          )) satisfies Result<WaitForTxReceiptReturnType<StacksChainKey>> as Result<WaitForTxReceiptReturnType<C>>;
        }
        case 'BITCOIN': {
          return (await this.bitcoinSpokeService.waitForTransactionReceipt(
            effectiveParams as WaitForTxReceiptParams<BitcoinChainKey>,
          )) satisfies Result<WaitForTxReceiptReturnType<BitcoinChainKey>> as Result<WaitForTxReceiptReturnType<C>>;
        }
        case 'NEAR': {
          return (await this.nearSpokeService.waitForTransactionReceipt(
            effectiveParams as WaitForTxReceiptParams<NearChainKey>,
          )) satisfies Result<WaitForTxReceiptReturnType<NearChainKey>> as Result<WaitForTxReceiptReturnType<C>>;
        }
        default: {
          const exhaustiveCheck: never = chainType;
          console.log(exhaustiveCheck);
          return { ok: false, error: new Error(`waitForTransactionReceipt not supported for ${params.chainKey}`) };
        }
      }
    } catch (error) {
      return { ok: false, error };
    }
  }
}
