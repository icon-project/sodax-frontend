import invariant from 'tiny-invariant';
import {
  type SpokeProvider,
  type SpokeProviderType,
  type Result,
  type TxReturnType,
  SpokeService,
  type RelayErrorCode,
  Erc20Service,
  type GetSpokeDepositParamsType,
  SonicSpokeService,
  type EvmHubProvider,
  relayTxAndWaitPacket,
  SolanaSpokeProvider,
  DEFAULT_RELAY_TX_TIMEOUT,
  type HubTxHash,
  type SpokeTxHash,
  WalletAbstractionService,
  type HubAssetInfo,
  type EvmContractCall,
  EvmVaultTokenService,
  EvmAssetManagerService,
  encodeContractCalls,
  calculateFeeAmount,
  type PartnerFee,
  encodeAddress,
  type Prettify,
  type OptionalFee,
  type OptionalRaw,
  type OptionalTimeout,
  type GetAddressType,
  type BridgeServiceConfig,
  wrappedSonicAbi,
  type StellarSpokeProviderType,
  type EvmSpokeProviderType,
  type SonicSpokeProviderType,
  type VaultReserves,
} from '../index.js';
import { isEvmSpokeProviderType, isSonicSpokeProviderType, isStellarSpokeProviderType } from '../shared/guards.js';
import type { SpokeChainId, XToken, Hex, HttpUrl, BridgeLimit } from '@sodax/types';
import { encodeFunctionData, isAddress } from 'viem';
import { StellarSpokeService } from '../shared/services/spoke/StellarSpokeService.js';
import type { ConfigService } from '../shared/config/ConfigService.js';
import BigNumber from 'bignumber.js';

export type CreateBridgeIntentParams = {
  srcChainId: SpokeChainId;
  srcAsset: string;
  amount: bigint;
  dstChainId: SpokeChainId;
  dstAsset: string;
  recipient: string; // non-encoded recipient address
};

export type BridgeParams<S extends SpokeProviderType> = Prettify<
  {
    params: CreateBridgeIntentParams;
    spokeProvider: S;
    skipSimulation?: boolean;
  } & OptionalFee
>;

export type BridgeErrorCode =
  | 'ALLOWANCE_CHECK_FAILED'
  | 'APPROVAL_FAILED'
  | 'CREATE_BRIDGE_INTENT_FAILED'
  | 'BRIDGE_FAILED'
  | RelayErrorCode;

export type BridgeError<T extends BridgeErrorCode> = {
  code: T;
  error: unknown;
};

export type BridgeExtraData = { address: Hex; payload: Hex };
export type BridgeOptionalExtraData = { data?: BridgeExtraData };

export type BridgeServiceConstructorParams = {
  hubProvider: EvmHubProvider;
  relayerApiEndpoint: HttpUrl;
  config: BridgeServiceConfig | undefined;
  configService: ConfigService;
};

/**
 * BridgeService is a service that allows you to bridge tokens between chains
 * Birdge action can be between to spokes chains but can also be used to withdraw and deposit into soda tokens on the HUB.
 * By using soda tokens as src or destinatin address.
 * @param hubProvider - The hub provider
 * @param relayerApiEndpoint - The relayer API endpoint
 */
export class BridgeService {
  public readonly hubProvider: EvmHubProvider;
  public readonly relayerApiEndpoint: HttpUrl;
  public readonly config: BridgeServiceConfig;
  public readonly configService: ConfigService;

  constructor({ hubProvider, relayerApiEndpoint, config, configService }: BridgeServiceConstructorParams) {
    this.config = config ?? { partnerFee: undefined };
    this.hubProvider = hubProvider;
    this.relayerApiEndpoint = relayerApiEndpoint;
    this.configService = configService;
  }

  /**
   * Get the fee for a given input amount
   * @param {bigint} inputAmount - The amount of input tokens
   * @returns {Promise<bigint>} The fee amount (denominated in input tokens)
   *
   * @example
   * const fee: bigint = await sodax.bridge.getFee(1000000000000000n);
   * console.log('Fee:', fee);
   */
  public getFee(inputAmount: bigint): bigint {
    if (!this.config.partnerFee) {
      return 0n;
    }

    return calculateFeeAmount(inputAmount, this.config.partnerFee);
  }

  /**
   * Check if allowance is valid for the bridge transaction
   * @param params - The bridge parameters
   * @param spokeProvider - The spoke provider
   * @returns {Promise<Result<boolean, BridgeError<'ALLOWANCE_CHECK_FAILED'>>>}
   */
  public async isAllowanceValid<S extends SpokeProviderType>({
    params,
    spokeProvider,
  }: BridgeParams<S>): Promise<Result<boolean, BridgeError<'ALLOWANCE_CHECK_FAILED'>>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.srcAsset.length > 0, 'Source asset is required');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      // For regular EVM chains (non-Sonic), check ERC20 allowance against assetManager
      if (isEvmSpokeProviderType(spokeProvider)) {
        invariant(isAddress(params.srcAsset), 'Invalid source asset address for EVM chain');

        const allowanceResult = await Erc20Service.isAllowanceValid(
          params.srcAsset,
          params.amount,
          walletAddress as GetAddressType<EvmSpokeProviderType>,
          spokeProvider.chainConfig.addresses.assetManager,
          spokeProvider,
        );

        if (!allowanceResult.ok) {
          return {
            ok: false,
            error: {
              code: 'ALLOWANCE_CHECK_FAILED',
              error: allowanceResult.error,
            },
          };
        }

        return {
          ok: true,
          value: allowanceResult.value,
        };
      }

      if (isStellarSpokeProviderType(spokeProvider)) {
        const allowanceResult = await StellarSpokeService.hasSufficientTrustline(
          params.srcAsset,
          params.amount,
          spokeProvider,
        );
        if (!allowanceResult) {
          return {
            ok: false,
            error: {
              code: 'ALLOWANCE_CHECK_FAILED',
              error: allowanceResult,
            },
          };
        }
        return {
          ok: true,
          value: allowanceResult,
        };
      }

      // For Sonic chain, check ERC20 allowance against userRouter
      if (isSonicSpokeProviderType(spokeProvider)) {
        invariant(isAddress(params.srcAsset), 'Invalid source asset address for Sonic chain');

        const userRouter = await SonicSpokeService.getUserRouter(
          walletAddress as GetAddressType<SonicSpokeProviderType>,
          spokeProvider,
        );

        const allowanceResult = await Erc20Service.isAllowanceValid(
          params.srcAsset,
          params.amount,
          walletAddress as GetAddressType<SonicSpokeProviderType>,
          userRouter,
          spokeProvider,
        );

        if (!allowanceResult.ok) {
          return {
            ok: false,
            error: {
              code: 'ALLOWANCE_CHECK_FAILED',
              error: allowanceResult.error,
            },
          };
        }

        return {
          ok: true,
          value: allowanceResult.value,
        };
      }

      // For non-EVM chains (Icon, Sui, Stellar, etc.), no allowance check needed
      return {
        ok: true,
        value: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'ALLOWANCE_CHECK_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Approve token spending for the bridge transaction
   * @param params - The bridge parameters
   * @param spokeProvider - The spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns Promise<Result<TxReturnType<S, R>, BridgeError<'APPROVAL_FAILED'>>>
   */
  public async approve<S extends SpokeProviderType, R extends boolean = false>({
    params,
    spokeProvider,
    raw,
  }: Prettify<BridgeParams<S> & OptionalRaw<R>>): Promise<Result<TxReturnType<S, R>, BridgeError<'APPROVAL_FAILED'>>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.srcAsset.length > 0, 'Source asset is required');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      // For regular EVM chains (non-Sonic), approve against assetManager
      if (isEvmSpokeProviderType(spokeProvider)) {
        invariant(isAddress(params.srcAsset), 'Invalid source asset address for EVM chain');

        const result = await Erc20Service.approve(
          params.srcAsset,
          params.amount,
          spokeProvider.chainConfig.addresses.assetManager,
          spokeProvider,
          raw,
        );

        return {
          ok: true,
          value: result satisfies TxReturnType<EvmSpokeProviderType, R> as TxReturnType<S, R>,
        };
      }

      if (isStellarSpokeProviderType(spokeProvider)) {
        const result = await StellarSpokeService.requestTrustline(params.srcAsset, params.amount, spokeProvider, raw);
        return {
          ok: true,
          value: result satisfies TxReturnType<StellarSpokeProviderType, R> as TxReturnType<S, R>,
        };
      }

      // For Sonic chain, approve against userRouter
      if (isSonicSpokeProviderType(spokeProvider)) {
        invariant(isAddress(params.srcAsset), 'Invalid source asset address for Sonic chain');

        const userRouter = await SonicSpokeService.getUserRouter(
          walletAddress as GetAddressType<SonicSpokeProviderType>,
          spokeProvider,
        );

        const result = await Erc20Service.approve(params.srcAsset, params.amount, userRouter, spokeProvider, raw);

        return {
          ok: true,
          value: result satisfies TxReturnType<SonicSpokeProviderType, R> as TxReturnType<S, R>,
        };
      }

      // For non-EVM chains, approval is not needed
      return {
        ok: false,
        error: {
          code: 'APPROVAL_FAILED',
          error: new Error('Approval only supported for EVM spoke chains'),
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: {
          code: 'APPROVAL_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Execute a bridge transaction to transfer tokens from one chain to another
   * @param params - The bridge parameters including source/destination chains, assets, and recipient
   * @param spokeProvider - The spoke provider for the source chain
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[SpokeTxHash, HubTxHash], BridgeError<BridgeErrorCode>>>} - Returns the transaction hashes for both spoke and hub chains or error
   *
   * @example
   * const result = await sodax.bridge.bridge(
   *   {
   *     srcChainId: '0x2105.base',
   *     srcAsset: '0x...', // Address of the source token
   *     amount: 1000n, // Amount to bridge (in token decimals)
   *     dstChainId: '0x89.polygon',
   *     dstAsset: '0x...', // Address of the destination token
   *     recipient: '0x...', // Recipient address on destination chain
   *     partnerFee: { address: '0x...', percentage: 0.1 } // Optional partner fee. Partner fees and denominated in vault token decimals (18)
   *   },
   *   spokeProvider,
   *   30000 // Optional timeout in milliseconds (default: 60000, i.e. 60 seconds)
   * );
   *
   * if (!result.ok) {
   *   // Handle error
   * }
   *
   * const [
   *  spokeTxHash, // transaction hash on the source chain
   *  hubTxHash,   // transaction hash on the hub chain
   * ] = result.value;
   * console.log('Bridge transaction hashes:', { spokeTxHash, hubTxHash });
   */
  public async bridge<S extends SpokeProvider>({
    params,
    spokeProvider,
    fee = this.config.partnerFee,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  }: Prettify<BridgeParams<S> & OptionalTimeout>): Promise<
    Result<[SpokeTxHash, HubTxHash], BridgeError<BridgeErrorCode>>
  > {
    try {
      const txResult = await this.createBridgeIntent({ params, spokeProvider, fee, raw: false });

      if (!txResult.ok) {
        return txResult;
      }

      // verify the spoke tx hash exists on chain
      const verifyTxHashResult = await SpokeService.verifyTxHash(txResult.value, spokeProvider);

      if (!verifyTxHashResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CREATE_BRIDGE_INTENT_FAILED',
            error: verifyTxHashResult.error,
          },
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return {
          ok: false,
          error: {
            code: packetResult.error.code,
            error: packetResult.error,
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Create bridge intent only (without relaying to hub)
   * NOTE: This method only executes the transaction on the spoke chain and creates the bridge intent
   * In order to successfully bridge tokens, you need to:
   * 1. Check if the allowance is sufficient using isAllowanceValid
   * 2. Approve the appropriate contract to spend the tokens using approve
   * 3. Create the bridge intent using this method
   * 4. Relay the transaction to the hub and await completion using the bridge method
   *
   * @param params - The bridge parameters including source/destination chains, assets, and recipient
   * @param spokeProvider - The spoke provider for the source chain
   * @param raw - Whether to return the raw transaction data
   * @returns {Promise<Result<TxReturnType<S, R>, BridgeError<BridgeErrorCode>>>} - Returns the transaction result
   *
   * @example
   * const bridgeService = new BridgeService(hubProvider, relayerApiEndpoint);
   * const result = await sodax.bridge.createBridgeIntent(
   *   {
   *     srcChainId: 'ethereum',
   *     srcAsset: "0x123...", // source token address
   *     amount: 1000000000000000000n, // 1 token in wei
   *     dstChainId: 'polygon',
   *     dstAsset: "0x456...", // destination token address
   *     recipient: "0x789..." // recipient address
   *   },
   *   spokeProvider,
   *   raw // Optional: true = return the raw transaction data, false = execute and return the transaction hash (default: false)
   * );
   *
   * if (result.ok) {
   *   const txHash = result.value;
   *   console.log('Bridge intent transaction hash:', txHash);
   * } else {
   *   console.error('Bridge intent creation failed:', result.error);
   * }
   */
  async createBridgeIntent<S extends SpokeProviderType = SpokeProviderType, R extends boolean = false>({
    params,
    spokeProvider,
    fee = this.config.partnerFee,
    raw,
  }: Prettify<BridgeParams<S> & OptionalRaw<R>>): Promise<
    Result<TxReturnType<S, R>, BridgeError<'CREATE_BRIDGE_INTENT_FAILED'>> & BridgeOptionalExtraData
  > {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      const srcAssetInfo = this.configService.getHubAssetInfo(params.srcChainId, params.srcAsset);
      const dstAssetInfo = this.configService.getHubAssetInfo(params.dstChainId, params.dstAsset);

      // Vault can only be used on Sonic
      invariant(srcAssetInfo, `Unsupported spoke chain (${params.srcChainId}) token: ${params.srcAsset}`);
      // destination
      invariant(dstAssetInfo, `Unsupported spoke chain (${params.dstChainId}) token: ${params.dstAsset}`);

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await WalletAbstractionService.getUserAbstractedWalletAddress(
        walletAddress,
        spokeProvider,
        this.hubProvider,
      );

      const data: Hex = this.buildBridgeData(params, srcAssetInfo, dstAssetInfo, fee);

      const txResult = await SpokeService.deposit(
        {
          from: walletAddress,
          to: hubWallet,
          token: params.srcAsset,
          amount: params.amount,
          data,
        } as unknown as GetSpokeDepositParamsType<S>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
        data: {
          address: hubWallet,
          payload: data,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: {
          code: 'CREATE_BRIDGE_INTENT_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Build the bridge transaction data for executing the bridge operation on the hub
   * @param params - The create bridge intent parameters
   * @param srcAssetInfo - The source asset information
   * @param dstAssetInfo - The destination asset information
   * @returns Hex - The encoded contract calls for the bridge operation
   */
  buildBridgeData(
    params: CreateBridgeIntentParams,
    srcAssetInfo: HubAssetInfo,
    dstAssetInfo: HubAssetInfo,
    partnerFee: PartnerFee | undefined,
  ): Hex {
    const calls: EvmContractCall[] = [];
    let translatedAmount = params.amount;
    let srcVault = params.srcAsset as `0x${string}`;
    // if src asset is not a vault token, we need to approve and deposit into the vault
    if (!this.configService.isValidVault(srcAssetInfo.asset)) {
      calls.push(Erc20Service.encodeApprove(srcAssetInfo.asset, srcAssetInfo.vault, params.amount));
      calls.push(EvmVaultTokenService.encodeDeposit(srcAssetInfo.vault, srcAssetInfo.asset, params.amount));
      translatedAmount = EvmVaultTokenService.translateIncomingDecimals(srcAssetInfo.decimal, params.amount);
      srcVault = srcAssetInfo.vault;
    }
    const feeAmount = calculateFeeAmount(translatedAmount, partnerFee);

    if (partnerFee && feeAmount > 0n) {
      calls.push(Erc20Service.encodeTransfer(srcVault, partnerFee.address, feeAmount));
    }

    const withdrawAmount = translatedAmount - feeAmount;
    let translatedWithdrawAmount = withdrawAmount;

    // if dst asset is not a vault token, we need to withdraw from the vault
    if (!this.configService.isValidVault(dstAssetInfo.asset)) {
      calls.push(EvmVaultTokenService.encodeWithdraw(dstAssetInfo.vault, dstAssetInfo.asset, withdrawAmount));
      translatedWithdrawAmount = EvmVaultTokenService.translateOutgoingDecimals(dstAssetInfo.decimal, withdrawAmount);
    }

    const encodedRecipientAddress = encodeAddress(params.dstChainId, params.recipient);
    // If the destination chain is Sonic, we can directly transfer the tokens to the recipient
    if (params.dstChainId === this.hubProvider.chainConfig.chain.id) {
      // If destination token is S, then unwrap and send S to the recipient
      if (params.dstAsset.toLowerCase() === this.hubProvider.chainConfig.nativeToken.toLowerCase()) {
        calls.push({
          address: dstAssetInfo.asset,
          value: 0n,
          data: encodeFunctionData({
            abi: wrappedSonicAbi,
            functionName: 'withdrawTo',
            args: [encodedRecipientAddress, translatedWithdrawAmount],
          }),
        });
      } else {
        calls.push(Erc20Service.encodeTransfer(dstAssetInfo.asset, encodedRecipientAddress, translatedWithdrawAmount));
      }
    } else {
      invariant(dstAssetInfo, `Unsupported hub chain (${params.dstChainId}) token: ${params.dstAsset}`);
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          dstAssetInfo.asset,
          encodedRecipientAddress,
          translatedWithdrawAmount,
          this.hubProvider.chainConfig.addresses.assetManager,
        ),
      );
    }
    return encodeContractCalls(calls);
  }

  /**
   * Retrieves the deposited token balance held by the asset manager on a spoke chain.
   * This balance represents the available liquidity for bridging operations and is used to verify
   * that the target chain has sufficient funds to complete a bridge transaction.
   *
   * @param spokeProvider - The spoke provider instance
   * @param token - The token address to query the balance for
   * @returns {Promise<BridgeLimit>} - The max bridgeable amount with corresponding decimals
   */
  public async getBridgeableAmount(from: XToken, to: XToken): Promise<Result<BridgeLimit>> {
    try {
      const fromHubAsset = this.configService.getHubAssetInfo(from.xChainId, from.address);
      const toHubAsset = this.configService.getHubAssetInfo(to.xChainId, to.address);
      invariant(fromHubAsset, `Hub asset not found for token ${from.address} on chain ${from.xChainId}`);
      invariant(toHubAsset, `Hub asset not found for token ${to.address} on chain ${to.xChainId}`);
      invariant(this.isBridgeable({ from, to }), `Tokens ${from.address} and ${to.address} are not bridgeable`);

      // we need to check the max deposit of the token on the from chain and the asset manager balance on the to chain
      const [tokenInfos, reserves] = await Promise.all([
        EvmVaultTokenService.getTokenInfos(
          fromHubAsset.vault,
          [fromHubAsset.asset, toHubAsset.asset],
          this.hubProvider.publicClient,
        ),
        EvmVaultTokenService.getVaultReserves(toHubAsset.vault, this.hubProvider.publicClient),
      ]);

      invariant(tokenInfos.length === 2, `Expected 2 token infos, got ${tokenInfos.length}`);
      const [fromTokenInfo, toTokenInfo] = tokenInfos;
      invariant(fromTokenInfo, 'From token info not found');
      invariant(toTokenInfo, 'To token info not found');

      // if the from token to be deposited is not supported, we return 0
      if (!fromTokenInfo.isSupported) {
        return {
          ok: true,
          value: {
            amount: 0n,
            decimals: fromTokenInfo.decimals,
            type: 'DEPOSIT_LIMIT',
          },
        };
      }

      // spoke -> hub, we need to check the max deposit of the token on the from chain
      if (
        from.xChainId !== this.hubProvider.chainConfig.chain.id &&
        to.xChainId === this.hubProvider.chainConfig.chain.id
      ) {
        const fromTokenDepositedAmount = this.findTokenBalanceInReserves(reserves, from);
        const availableDeposit = fromTokenInfo.maxDeposit - fromTokenDepositedAmount;

        return {
          ok: true,
          value: {
            amount: availableDeposit,
            decimals: fromTokenInfo.decimals,
            type: 'DEPOSIT_LIMIT',
          },
        };
      }

      // hub -> spoke, we need to check the asset manager balance on the to chain
      if (
        from.xChainId === this.hubProvider.chainConfig.chain.id &&
        to.xChainId !== this.hubProvider.chainConfig.chain.id
      ) {
        return {
          ok: true,
          value: {
            amount: this.findTokenBalanceInReserves(reserves, to),
            decimals: toTokenInfo.decimals,
            type: 'WITHDRAWAL_LIMIT',
          },
        };
      }

      // spoke -> spoke, we need to check the deposit available on the from chain and the withdrawable asset manager balance on the to chain
      const fromTokenDepositedAmount = this.findTokenBalanceInReserves(reserves, from);
      const availableDeposit = fromTokenInfo.maxDeposit - fromTokenDepositedAmount;
      const assetManagerBalance = this.findTokenBalanceInReserves(reserves, to);
      const availableDepositNormalised = BigNumber(availableDeposit).shiftedBy(-fromTokenInfo.decimals);
      const assetManagerBalanceNormalised = BigNumber(assetManagerBalance).shiftedBy(-toTokenInfo.decimals);

      // return the minimum of the deposit available and the withdrawable asset manager balance
      return {
        ok: true,
        value: availableDepositNormalised.isLessThan(assetManagerBalanceNormalised)
          ? { amount: availableDeposit, decimals: fromTokenInfo.decimals, type: 'DEPOSIT_LIMIT' }
          : { amount: assetManagerBalance, decimals: toTokenInfo.decimals, type: 'WITHDRAWAL_LIMIT' },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: error,
      };
    }
  }

  /**
   * Check if two assets on different chains are bridgeable
   * Two assets are bridgeable if they share the same vault on the hub chain
   * @param from - The source X token
   * @param to - The destination X token
   * @param unchecked - Whether to skip the chain ID validation
   * @returns boolean - true if assets are bridgeable, false otherwise
   */
  public isBridgeable({
    from,
    to,
    unchecked = false,
  }: {
    from: XToken;
    to: XToken;
    unchecked?: boolean;
  }): boolean {
    try {
      if (!unchecked) {
        invariant(this.configService.isValidSpokeChainId(from.xChainId), `Invalid spoke chain (${from.xChainId})`);
        invariant(this.configService.isValidSpokeChainId(to.xChainId), `Invalid spoke chain (${to.xChainId})`);
      }

      // Get hub asset info for both source and destination assets
      const srcAssetInfo = this.configService.getHubAssetInfo(from.xChainId, from.address);
      const dstAssetInfo = this.configService.getHubAssetInfo(to.xChainId, to.address);

      // Check if both assets are supported and have vault information
      invariant(srcAssetInfo, `Hub asset not found for token ${from.address} on chain ${from.xChainId}`);
      invariant(dstAssetInfo, `Hub asset not found for token ${to.address} on chain ${to.xChainId}`);

      // Check if the vault addresses are the same (case-insensitive comparison)
      return srcAssetInfo.vault.toLowerCase() === dstAssetInfo.vault.toLowerCase();
    } catch (error) {
      console.error(error);

      // Return false on any error
      return false;
    }
  }

  /**
   * Get all bridgeable tokens from a source token to a destination chain
   * @param from - The source chain ID
   * @param to - The destination chain ID
   * @param token - The source token address
   * @returns XToken[] - Array of bridgeable tokens on the destination chain
   */
  public getBridgeableTokens(from: SpokeChainId, to: SpokeChainId, token: string): Result<XToken[]> {
    try {
      const srcAssetInfo = this.configService.getHubAssetInfo(from, token);
      invariant(srcAssetInfo, `Hub asset not found for token ${token} on chain ${from}`);

      return {
        ok: true,
        value: this.filterTokensWithSameVault(
          this.configService.spokeChainConfig[to].supportedTokens,
          to,
          srcAssetInfo,
        ),
      };
    } catch (error) {
      return {
        ok: false,
        error: error,
      };
    }
  }

  public filterTokensWithSameVault(
    tokens: Record<string, XToken>,
    to: SpokeChainId,
    srcAssetInfo: HubAssetInfo | undefined,
  ): XToken[] {
    // Filter tokens that share the same vault as the source asset
    const bridgeableTokens: XToken[] = [];

    for (const token of Object.values(tokens)) {
      const dstAssetInfo = this.configService.getHubAssetInfo(to, token.address);

      if (dstAssetInfo && srcAssetInfo && dstAssetInfo.vault.toLowerCase() === srcAssetInfo.vault.toLowerCase()) {
        bridgeableTokens.push({
          ...token,
          xChainId: to,
        });
      }
    }

    return bridgeableTokens;
  }

  public findTokenBalanceInReserves(reserves: VaultReserves, token: XToken): bigint {
    const hubAsset = this.configService.getHubAssetInfo(token.xChainId, token.address);
    invariant(hubAsset, `Hub asset not found for token ${token.address} on chain ${token.xChainId}`);
    const tokenIndex = reserves.tokens.findIndex(t => t.toLowerCase() === hubAsset.asset.toLowerCase());
    invariant(tokenIndex !== -1, `Token ${hubAsset.asset} not found in the vault reserves for chain ${token.xChainId}`);
    return reserves.balances[tokenIndex] ?? 0n;
  }
}
