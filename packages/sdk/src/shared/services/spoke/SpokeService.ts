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
import {
  encodeAddress,
  StacksSpokeService,
  BitcoinSpokeService,
  NearSpokeService,
  SonicSpokeService,
  isHubChainKeyType,
  isNearChainKeyType,
  isSolanaChainKeyType,
  isSpokeIsAllowanceValidParamsEvmSpoke,
  isSpokeIsAllowanceValidParamsHub,
  isSpokeIsAllowanceValidParamsStellar,
  isStellarChainKeyType,
  SuiSpokeService,
  StellarSpokeService,
  SolanaSpokeService,
  IconSpokeService,
  EvmSpokeService,
  InjectiveSpokeService,
  type ConfigService,
  type HubProvider,
  type GetSpokeServiceType,
  type DepositParams,
  type EstimateGasParams,
  type GetDepositParams,
  type SendMessageParams,
  type VerifySimulationParams,
  type WalletSimulationParams,
  type WaitForTxReceiptParams,
  type WaitForTxReceiptReturnType,
  type VerifyTxHashParams,
  type SpokeIsAllowanceValidParams,
  type SpokeApproveParams,
  Erc20Service,
  isValidWalletProviderForChainKey,
  isSpokeApproveParamsHub,
  type Erc20ApproveParams,
  isSpokeApproveParamsEvmSpoke,
  isSpokeApproveParamsStellar,
  type RequestTrustlineParams,
  type WalletMode,
} from '../../../index.js';
import invariant from 'tiny-invariant';

export type SpokeServiceConstructorParams = {
  config: ConfigService;
  hubProvider: HubProvider;
};

/**
 * SpokeService is a main class that provides functionalities for dealing with spoke chains (including hub chain).
 * It uses command pattern to execute different spoke (including hub) chain operations.
 * Important: you should always first handle hub chain id first (since it is evm type, it is also included in evm chain id set).
 * @namespace SodaxPublicUtils
 */

export class SpokeService {
  private readonly hubProvider: HubProvider;
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
        isValidWalletProviderForChainKey(params.srcChainKey, params.walletProvider),
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
  ): Promise<GetEstimateGasReturnType<C>> {
    if (isHubChainKeyType(params.chainKey)) {
      return this.hubProvider.service.estimateGas(params as EstimateGasParams<HubChainKey>) satisfies Promise<
        GetEstimateGasReturnType<HubChainKey>
      > as Promise<GetEstimateGasReturnType<C>>;
    }

    const chainType = getChainType(params.chainKey);

    switch (chainType) {
      case 'EVM': {
        return this.evmSpokeService.estimateGas(params as EstimateGasParams<EvmSpokeOnlyChainKey>) satisfies Promise<
          GetEstimateGasReturnType<EvmChainKey>
        > as Promise<GetEstimateGasReturnType<C>>;
      }
      case 'INJECTIVE': {
        return this.injectiveSpokeService.estimateGas(params as EstimateGasParams<InjectiveChainKey>) satisfies Promise<
          GetEstimateGasReturnType<InjectiveChainKey>
        > as Promise<GetEstimateGasReturnType<C>>;
      }
      case 'ICON': {
        return this.iconSpokeService.estimateGas(params as EstimateGasParams<IconChainKey>) satisfies Promise<
          GetEstimateGasReturnType<IconChainKey>
        > as Promise<GetEstimateGasReturnType<C>>;
      }
      case 'SUI': {
        return this.suiSpokeService.estimateGas(params as EstimateGasParams<SuiChainKey>) satisfies Promise<
          GetEstimateGasReturnType<SuiChainKey>
        > as Promise<GetEstimateGasReturnType<C>>;
      }
      case 'SOLANA': {
        return this.solanaSpokeService.estimateGas(params as EstimateGasParams<SolanaChainKey>) satisfies Promise<
          GetEstimateGasReturnType<SolanaChainKey>
        > as Promise<GetEstimateGasReturnType<C>>;
      }
      case 'STELLAR': {
        return this.stellarSpokeService.estimateGas(params as EstimateGasParams<StellarChainKey>) satisfies Promise<
          GetEstimateGasReturnType<StellarChainKey>
        > as Promise<GetEstimateGasReturnType<C>>;
      }
      case 'STACKS': {
        return this.stacksSpokeService.estimateGas(params as EstimateGasParams<StacksChainKey>) satisfies Promise<
          GetEstimateGasReturnType<StacksChainKey>
        > as Promise<GetEstimateGasReturnType<C>>;
      }
      case 'BITCOIN': {
        return this.bitcoinSpokeService.estimateGas(params as EstimateGasParams<BitcoinChainKey>) satisfies Promise<
          GetEstimateGasReturnType<BitcoinChainKey>
        > as Promise<GetEstimateGasReturnType<C>>;
      }
      case 'NEAR': {
        return this.nearSpokeService.estimateGas(params as EstimateGasParams<NearChainKey>) satisfies Promise<
          GetEstimateGasReturnType<NearChainKey>
        > as Promise<GetEstimateGasReturnType<C>>;
      }
      default: {
        const exhaustiveCheck: never = chainType; // The never type is used to ensure that the default case is exhaustive
        console.log(exhaustiveCheck);
        throw new Error(`[estimateGas] Invalid chain type. Valid chain types: ${ChainTypeArr.join(', ')}`);
      }
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
  public async simulateDeposit(
    params: DepositParams<SpokeChainKey, boolean>,
  ): Promise<{ success: boolean; error?: string }> {
    if (isHubChainKeyType(params.srcChainKey)) {
      throw new Error('Hub chain id is not supported for deposit simulation');
    }

    const chainId = getIntentRelayChainId(params.srcChainKey);
    const hubAssetManager = this.hubProvider.chainConfig.addresses.assetManager;
    const payload = SpokeService.encodeTransfer(
      encodeAddress(params.srcChainKey, params.token),
      encodeAddress(params.srcChainKey, params.srcAddress),
      params.to,
      params.amount,
      params.data,
    );

    return this.simulateRecvMessage({
      target: hubAssetManager,
      srcChainId: chainId,
      srcAddress: encodeAddress(params.srcChainKey, spokeChainConfig[params.srcChainKey].addresses.assetManager),
      payload,
    });
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
  public async simulateRecvMessage(params: WalletSimulationParams): Promise<{ success: boolean; error?: string }> {
    try {
      // Call simulateRecvMessage using staticCall (read-only)
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
  public async deposit<K extends SpokeChainKey, R extends boolean>(
    params: DepositParams<K, R>,
  ): Promise<TxReturnType<K, R>> {
    if (isHubChainKeyType(params.srcChainKey)) {
      return SonicSpokeService.deposit(params as DepositParams<SonicChainKey, R>) satisfies Promise<
        TxReturnType<SonicChainKey, R>
      > as Promise<TxReturnType<K, R>>;
    }

    const chainType = getChainType(params.srcChainKey);
    switch (chainType) {
      case 'EVM': {
        await this.verifyDepositSimulation(params);
        return this.evmSpokeService.deposit(params as DepositParams<EvmSpokeOnlyChainKey, R>) satisfies Promise<
          TxReturnType<EvmChainKey, R>
        > as Promise<TxReturnType<K, R>>;
      }
      case 'INJECTIVE': {
        await this.verifyDepositSimulation(params);
        return this.injectiveSpokeService.deposit(params as DepositParams<InjectiveChainKey, R>) satisfies Promise<
          TxReturnType<InjectiveChainKey, R>
        > as Promise<TxReturnType<K, R>>;
      }
      case 'STELLAR': {
        await this.verifyDepositSimulation(params);
        return this.stellarSpokeService.deposit(params as DepositParams<StellarChainKey, R>) satisfies Promise<
          TxReturnType<StellarChainKey, R>
        > as Promise<TxReturnType<K, R>>;
      }
      case 'SUI': {
        await this.verifyDepositSimulation(params);
        return this.suiSpokeService.deposit(params as DepositParams<SuiChainKey, R>) satisfies Promise<
          TxReturnType<SuiChainKey, R>
        > as Promise<TxReturnType<K, R>>;
      }
      case 'ICON': {
        await this.verifyDepositSimulation(params);
        return this.iconSpokeService.deposit(params as DepositParams<IconChainKey, R>) satisfies Promise<
          TxReturnType<IconChainKey, R>
        > as Promise<TxReturnType<K, R>>;
      }
      case 'SOLANA': {
        await this.verifyDepositSimulation(params);
        return this.solanaSpokeService.deposit(params as DepositParams<SolanaChainKey, R>) satisfies Promise<
          TxReturnType<SolanaChainKey, R>
        > as Promise<TxReturnType<K, R>>;
      }
      case 'STACKS': {
        await this.verifyDepositSimulation(params);
        return this.stacksSpokeService.deposit(params as DepositParams<StacksChainKey, R>) satisfies Promise<
          TxReturnType<StacksChainKey, R>
        > as Promise<TxReturnType<K, R>>;
      }
      case 'BITCOIN': {
        await this.verifyDepositSimulation(params);
        return this.bitcoinSpokeService.deposit(
          params as DepositParams<BitcoinChainKey, R> & { accessToken?: string },
        ) satisfies Promise<TxReturnType<BitcoinChainKey, R>> as Promise<TxReturnType<K, R>>;
      }
      case 'NEAR': {
        await this.verifyDepositSimulation(params);
        return this.nearSpokeService.deposit(params as DepositParams<NearChainKey, R>) satisfies Promise<
          TxReturnType<NearChainKey, R>
        > as Promise<TxReturnType<K, R>>;
      }
      default: {
        const exhaustiveCheck: never = chainType; // The never type is used to ensure that the default case is exhaustive
        console.log(exhaustiveCheck);
        throw new Error(`[getDeposit] Invalid chain type. Valid chain types: ${ChainTypeArr.join(', ')}`);
      }
    }
  }

  public async verifyDepositSimulation<C extends SpokeChainKey, R extends boolean>(
    params: DepositParams<C, R>,
  ): Promise<void> {
    if (!params.skipSimulation) {
      const result = await this.simulateDeposit(params);

      if (!result.success) {
        throw new Error('Simulation failed', { cause: result });
      }
    }
  }

  /**
   * Get the balance of the token in the spoke chain asset manager.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {SpokeProviderType} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public getDeposit<C extends SpokeChainKey>(params: GetDepositParams<C>): Promise<bigint> {
    if (isHubChainKeyType(params.srcChainKey)) {
      // handle hub chain id first (since it is evm type, it is also included in evm chain id set)
      return this.sonicSpokeService.getDeposit(params as GetDepositParams<SonicChainKey>);
    }

    const chainType = getChainType(params.srcChainKey);
    switch (chainType) {
      case 'EVM': {
        return this.evmSpokeService.getDeposit(params as GetDepositParams<EvmSpokeOnlyChainKey>);
      }
      case 'INJECTIVE': {
        return this.injectiveSpokeService.getDeposit(params as GetDepositParams<InjectiveChainKey>);
      }
      case 'STELLAR': {
        return this.stellarSpokeService.getDeposit(params as GetDepositParams<StellarChainKey>);
      }
      case 'SUI': {
        return this.suiSpokeService.getDeposit(params as GetDepositParams<SuiChainKey>);
      }
      case 'ICON': {
        return this.iconSpokeService.getDeposit(params as GetDepositParams<IconChainKey>);
      }
      case 'SOLANA': {
        return this.solanaSpokeService.getDeposit(params as GetDepositParams<SolanaChainKey>);
      }
      case 'STACKS': {
        return this.stacksSpokeService.getDeposit(params as GetDepositParams<StacksChainKey>);
      }
      case 'BITCOIN': {
        return this.bitcoinSpokeService.getDeposit(params as GetDepositParams<BitcoinChainKey>);
      }
      case 'NEAR': {
        return this.nearSpokeService.getDeposit(params as GetDepositParams<NearChainKey>);
      }
      default: {
        const exhaustiveCheck: never = chainType; // The never type is used to ensure that the default case is exhaustive
        console.log(exhaustiveCheck);
        throw new Error(`[getDeposit] Invalid chain type. Valid chain types: ${ChainTypeArr.join(', ')}`);
      }
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
  ): Promise<TxReturnType<K, Raw>> {
    if (isHubChainKeyType(params.srcChainKey)) {
      // handle hub chain id first (since it is evm type, it is also included in evm chain id set)
      return (await this.sonicSpokeService.sendMessage(
        params as SendMessageParams<SonicChainKey, Raw>,
      )) as TxReturnType<K, Raw>;
    }

    // Bitcoin TRADING mode: srcAddress must match trading wallet (deposit origin)
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
      if (!result.success) {
        throw new Error('Simulation failed', { cause: result });
      }
    }

    const chainType = getChainType(params.srcChainKey);
    switch (chainType) {
      case 'EVM': {
        await this.verifySimulation(params);
        return (await this.evmSpokeService.sendMessage(
          params as SendMessageParams<EvmSpokeOnlyChainKey, Raw>,
        )) as TxReturnType<EvmSpokeOnlyChainKey, Raw> as TxReturnType<K, Raw>;
      }
      case 'INJECTIVE': {
        await this.verifySimulation(params);
        return (await this.injectiveSpokeService.sendMessage(
          params as SendMessageParams<InjectiveChainKey, Raw>,
        )) as TxReturnType<InjectiveChainKey, Raw> as TxReturnType<K, Raw>;
      }
      case 'ICON': {
        await this.verifySimulation(params);
        return (await this.iconSpokeService.sendMessage(
          params as SendMessageParams<IconChainKey, Raw>,
        )) as TxReturnType<IconChainKey, Raw> as TxReturnType<K, Raw>;
      }
      case 'SUI': {
        await this.verifySimulation(params);
        return (await this.suiSpokeService.sendMessage(params as SendMessageParams<SuiChainKey, Raw>)) as TxReturnType<
          SuiChainKey,
          Raw
        > as TxReturnType<K, Raw>;
      }
      case 'SOLANA': {
        await this.verifySimulation(params);
        return (await this.solanaSpokeService.sendMessage(
          params as SendMessageParams<SolanaChainKey, Raw>,
        )) as TxReturnType<SolanaChainKey, Raw> as TxReturnType<K, Raw>;
      }
      case 'STELLAR': {
        await this.verifySimulation(params);
        return (await this.stellarSpokeService.sendMessage(
          params as SendMessageParams<StellarChainKey, Raw>,
        )) as TxReturnType<StellarChainKey, Raw> as TxReturnType<K, Raw>;
      }
      case 'STACKS': {
        await this.verifySimulation(params);
        return (await this.stacksSpokeService.sendMessage(
          params as SendMessageParams<StacksChainKey, Raw>,
        )) as TxReturnType<StacksChainKey, Raw> as TxReturnType<K, Raw>;
      }
      case 'BITCOIN': {
        await this.verifySimulation(params);
        return (await this.bitcoinSpokeService.sendMessage(
          params as SendMessageParams<BitcoinChainKey, Raw> & { walletMode?: WalletMode },
        )) as TxReturnType<BitcoinChainKey, Raw> as TxReturnType<K, Raw>;
      }
      case 'NEAR': {
        await this.verifySimulation(params);
        return (await this.nearSpokeService.sendMessage(
          params as SendMessageParams<NearChainKey, Raw>,
        )) as TxReturnType<NearChainKey, Raw> as TxReturnType<K, Raw>;
      }
      default: {
        const exhaustiveCheck: never = chainType; // The never type is used to ensure that the default case is exhaustive
        console.log(exhaustiveCheck);
        throw new Error(`[callWallet] Invalid chain type. Valid chain types: ${ChainTypeArr.join(', ')}`);
      }
    }
  }

  public async verifySimulation<K extends SpokeChainKey, Raw extends boolean>(
    params: VerifySimulationParams<K, Raw>,
  ): Promise<void> {
    if (!params.skipSimulation) {
      // Bitcoin TRADING mode: srcAddress must match trading wallet (deposit origin)
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

      if (!result.success) {
        throw new Error('Simulation failed', { cause: result });
      }
    }
  }

  /**
   * Get max withdrawable balance for token.
   * @param {string} token - The address of the token to get the balance of.
   * @param {SpokeChainKey} chainId - The spoke chain id.
   * @returns {Promise<bigint>} The max limit allowed for token.
   */
  public getLimit(token: string, chainId: SpokeChainKey): Promise<bigint> {
    if (isNearChainKeyType(chainId)) {
      return this.nearSpokeService.getLimit(token, chainId);
    }
    throw new Error(`getLimit not supported for ${chainId} chain`);
  }

  /**
   * Get available withdrawable amount.
   * @param {string} token - The address of the token to get the balance of.
   * @param {SpokeChainKey} chainId - The spoke chain id.
   * @returns {Promise<bigint>} The available withdrawable amount for token.
   */
  public getAvailable(token: string, chainId: SpokeChainKey): Promise<bigint> {
    if (isNearChainKeyType(chainId)) {
      return this.nearSpokeService.getAvailable(token, chainId);
    }
    throw new Error(`getAvailable not supported for ${chainId} chain`);
  }
  /**
   * Verifies the transaction hash for the spoke chain to exist on chain.
   * Only stellar and solana need to be verified. For other chains, we assume the transaction exists on chain.
   * @param txHash - The transaction hash to verify.
   * @param spokeProvider - The spoke provider.
   * @returns {Promise<Result<boolean>>} A promise that resolves to the result of the verification.
   */
  public async verifyTxHash(params: VerifyTxHashParams): Promise<Result<boolean>> {
    const { txHash, chainKey } = params;
    if (isSolanaChainKeyType(chainKey)) {
      const result = await this.solanaSpokeService.waitForTransactionReceipt({ txHash, chainKey });

      if (!result.ok || result.value.status !== 'success') {
        console.warn(
          `Solana verifyTxHash failed: ${!result.ok ? result.error : 'error' in result.value ? result.value.error : 'unknown'}`,
        );
        console.warn('Returning true to assume transaction exists on chain in future ');
        return {
          ok: true,
          value: true,
        };
      }

      return { ok: true, value: true };
    }
    if (isNearChainKeyType(chainKey)) {
      const result = await this.nearSpokeService.waitForTransactionReceipt({ txHash, chainKey });
      if (result.ok && result.value.status === 'success') {
        return { ok: true, value: true };
      }
      return { ok: false, error: new Error('Transaction failed') };
    }
    if (isStellarChainKeyType(chainKey)) {
      const result = await this.stellarSpokeService.waitForTransactionReceipt({ txHash, chainKey });
      if (result.ok && result.value.status === 'success') {
        return { ok: true, value: true };
      }
      return { ok: false, error: new Error('Transaction failed') };
    }

    // only stellar and solana need to be verified
    return {
      ok: true,
      value: true,
    };
  }

  public async waitForTxReceipt<C extends SpokeChainKey = SpokeChainKey>(
    params: WaitForTxReceiptParams<C>,
  ): Promise<Result<WaitForTxReceiptReturnType<C>>> {
    const effectiveParams: WaitForTxReceiptParams<C> = {
      pollingIntervalMs: this.config.sodaxConfig.chains[params.chainKey].pollingConfig.pollingIntervalMs,
      maxTimeoutMs: this.config.sodaxConfig.chains[params.chainKey].pollingConfig.maxTimeoutMs,
      ...params,
    };

    if (isHubChainKeyType(params.chainKey)) {
      return this.sonicSpokeService.waitForTransactionReceipt(
        effectiveParams as WaitForTxReceiptParams<SonicChainKey>,
      ) satisfies Promise<Result<WaitForTxReceiptReturnType<SonicChainKey>>> as Promise<
        Result<WaitForTxReceiptReturnType<C>>
      >;
    }

    const chainType = getChainType(params.chainKey);
    switch (chainType) {
      case 'EVM': {
        return this.evmSpokeService.waitForTransactionReceipt(
          effectiveParams as WaitForTxReceiptParams<EvmSpokeOnlyChainKey>,
        ) satisfies Promise<Result<WaitForTxReceiptReturnType<EvmSpokeOnlyChainKey>>> as Promise<
          Result<WaitForTxReceiptReturnType<C>>
        >;
      }
      case 'INJECTIVE': {
        return this.injectiveSpokeService.waitForTransactionReceipt(
          effectiveParams as WaitForTxReceiptParams<InjectiveChainKey>,
        ) satisfies Promise<Result<WaitForTxReceiptReturnType<InjectiveChainKey>>> as Promise<
          Result<WaitForTxReceiptReturnType<C>>
        >;
      }
      case 'ICON': {
        return this.iconSpokeService.waitForTransactionReceipt(
          effectiveParams as WaitForTxReceiptParams<IconChainKey>,
        ) satisfies Promise<Result<WaitForTxReceiptReturnType<IconChainKey>>> as Promise<
          Result<WaitForTxReceiptReturnType<C>>
        >;
      }
      case 'SUI': {
        return this.suiSpokeService.waitForTransactionReceipt(
          effectiveParams as WaitForTxReceiptParams<SuiChainKey>,
        ) satisfies Promise<Result<WaitForTxReceiptReturnType<SuiChainKey>>> as Promise<
          Result<WaitForTxReceiptReturnType<C>>
        >;
      }
      case 'SOLANA': {
        return this.solanaSpokeService.waitForTransactionReceipt(
          effectiveParams as WaitForTxReceiptParams<SolanaChainKey>,
        ) satisfies Promise<Result<WaitForTxReceiptReturnType<SolanaChainKey>>> as Promise<
          Result<WaitForTxReceiptReturnType<C>>
        >;
      }
      case 'STELLAR': {
        return this.stellarSpokeService.waitForTransactionReceipt(
          effectiveParams as WaitForTxReceiptParams<StellarChainKey>,
        ) satisfies Promise<Result<WaitForTxReceiptReturnType<StellarChainKey>>> as Promise<
          Result<WaitForTxReceiptReturnType<C>>
        >;
      }
      case 'STACKS': {
        return this.stacksSpokeService.waitForTransactionReceipt(
          effectiveParams as WaitForTxReceiptParams<StacksChainKey>,
        ) satisfies Promise<Result<WaitForTxReceiptReturnType<StacksChainKey>>> as Promise<
          Result<WaitForTxReceiptReturnType<C>>
        >;
      }
      case 'BITCOIN': {
        return this.bitcoinSpokeService.waitForTransactionReceipt(
          effectiveParams as WaitForTxReceiptParams<BitcoinChainKey>,
        ) satisfies Promise<Result<WaitForTxReceiptReturnType<BitcoinChainKey>>> as Promise<
          Result<WaitForTxReceiptReturnType<C>>
        >;
      }
      case 'NEAR': {
        return this.nearSpokeService.waitForTransactionReceipt(
          effectiveParams as WaitForTxReceiptParams<NearChainKey>,
        ) satisfies Promise<Result<WaitForTxReceiptReturnType<NearChainKey>>> as Promise<
          Result<WaitForTxReceiptReturnType<C>>
        >;
      }
      default: {
        const exhaustiveCheck: never = chainType;
        console.log(exhaustiveCheck);
        throw new Error(`waitForTransactionReceipt not supported for ${params.chainKey}`);
      }
    }
  }
}
