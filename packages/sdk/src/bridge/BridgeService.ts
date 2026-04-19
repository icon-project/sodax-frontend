import invariant from 'tiny-invariant';
import {
  SpokeService,
  type RelayErrorCode,
  Erc20Service,
  type HubProvider,
  relayTxAndWaitPacket,
  EvmVaultTokenService,
  EvmAssetManagerService,
  encodeContractCalls,
  calculateFeeAmount,
  encodeAddress,
  type OptionalRaw,
  type OptionalTimeout,
  wrappedSonicAbi,
  type OptionalSkipSimulation,
  type OptionalWalletActionParamType,
  isHubChainKeyType,
  isStellarChainKeyType,
  isEvmChainKeyType,
  HubService,
  type SpokeIsAllowanceValidParamsHub,
  type SpokeIsAllowanceValidParamsEvmSpoke,
  type SpokeIsAllowanceValidParamsStellar,
  isEvmSpokeOnlyChainKeyType,
  isSolanaChainKeyType,
  isBitcoinChainKeyType,
} from '../index.js';
import {
  type SpokeChainKey,
  type XToken,
  type Hex,
  type BridgeLimit,
  type GetTokenAddressType,
  type BridgeConfig,
  type GetAddressType,
  type OptionalFee,
  type Result,
  type Prettify,
  spokeChainConfig,
  type EvmChainKey,
  type HubChainKey,
  type TxReturnType,
  DEFAULT_RELAY_TX_TIMEOUT,
  type EvmContractCall,
  type HubTxHash,
  type PartnerFee,
  type SpokeTxHash,
  type VaultReserves,
  type StellarChainKey,
  isHubChainKey,
} from '@sodax/types';
import { encodeFunctionData, isAddress } from 'viem';
import type { ConfigService } from '../shared/config/ConfigService.js';
import BigNumber from 'bignumber.js';

export type CreateBridgeIntentParams<K extends SpokeChainKey = SpokeChainKey> = {
  srcAddress: string;
  srcChainKey: K;
  srcToken: string;
  amount: bigint;
  dstChainKey: SpokeChainKey;
  dstToken: string;
  recipient: string; // non-encoded recipient address
};

export type BridgeParams<ChainKey extends SpokeChainKey, Raw extends boolean = boolean> = Prettify<
  {
    params: CreateBridgeIntentParams<ChainKey>;
  } & OptionalFee &
    OptionalSkipSimulation &
    OptionalWalletActionParamType<ChainKey, Raw>
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
  hubProvider: HubProvider;
  config: ConfigService;
  spokeService: SpokeService;
};

/**
 * BridgeService is a service that allows you to bridge tokens between chains
 * Birdge action can be between to spokes chains but can also be used to withdraw and deposit into soda tokens on the HUB.
 * By using soda tokens as src or destinatin address.
 * @param hubProvider - The hub provider
 * @param relayerApiEndpoint - The relayer API endpoint
 */
export class BridgeService {
  public readonly hubProvider: HubProvider;
  public readonly config: ConfigService;
  public readonly spokeService: SpokeService;

  constructor({ hubProvider, config, spokeService }: BridgeServiceConstructorParams) {
    this.config = config;
    this.hubProvider = hubProvider;
    this.spokeService = spokeService;
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
    if (!this.config.bridge.partnerFee) {
      return 0n;
    }

    return calculateFeeAmount(inputAmount, this.config.bridge.partnerFee);
  }

  /**
   * Check if allowance is valid for the bridge transaction
   * @param params - The bridge parameters
   * @param spokeProvider - The spoke provider
   * @returns {Promise<Result<boolean, BridgeError<'ALLOWANCE_CHECK_FAILED'>>>}
   */
  public async isAllowanceValid<S extends SpokeChainKey>(_params: BridgeParams<S>): Promise<Result<boolean>> {
    const { params } = _params;
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.srcToken.length > 0, 'Source asset is required');

      if (isHubChainKeyType(params.srcChainKey)) {
        return await this.spokeService.isAllowanceValid({
          srcChainKey: params.srcChainKey,
          token: params.srcToken,
          amount: params.amount,
          owner: params.srcAddress,
          spender: await this.hubProvider.service.getUserRouter({
            address: params.srcAddress as GetAddressType<HubChainKey>,
            chainId: params.srcChainKey,
          }),
        } satisfies SpokeIsAllowanceValidParamsHub);
      }

      if (isEvmSpokeOnlyChainKeyType(params.srcChainKey)) {
        return await this.spokeService.isAllowanceValid({
          srcChainKey: params.srcChainKey,
          token: params.srcToken,
          amount: params.amount,
          owner: params.srcAddress,
        } satisfies SpokeIsAllowanceValidParamsEvmSpoke);
      }

      if (isStellarChainKeyType(params.srcChainKey)) {
        return await this.spokeService.isAllowanceValid({
          srcChainKey: params.srcChainKey,
          token: params.srcToken,
          amount: params.amount,
          owner: params.srcAddress,
        } satisfies SpokeIsAllowanceValidParamsStellar);
      }

      return { ok: true, value: true };
    } catch (error) {
      return {
        ok: false,
        error,
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
  public async approve<K extends SpokeChainKey, R extends boolean = false>({
    params,
    raw,
  }: Prettify<BridgeParams<K> & OptionalRaw<R>>): Promise<Result<TxReturnType<K, R>, BridgeError<'APPROVAL_FAILED'>>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.srcToken.length > 0, 'Source asset is required');

      // For regular EVM chains (non-Sonic), approve against assetManager
      if (isEvmChainKeyType(params.srcChainId)) {
        invariant(isAddress(params.srcToken), 'Invalid source asset address for EVM chain');

        const spender = isHubChainKeyType(params.srcChainId)
          ? await HubService.getUserHubWalletAddress(params.srcAddress, params.srcChainId, this.hubProvider)
          : spokeChainConfig[params.srcChainId].addresses.assetManager;

        const result = await Erc20Service.approve(params.srcToken, params.amount, spender, raw);

        return {
          ok: true,
          value: result satisfies TxReturnType<EvmChainKey, R> as TxReturnType<K, R>,
        };
      }

      if (isStellarChainKeyType(params.srcChainId)) {
        const result = await this.spokeService.isAllowanceValid(params.srcToken, params.amount, raw);
        return {
          ok: true,
          value: result satisfies TxReturnType<StellarChainKey, R> as TxReturnType<K, R>,
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
  public async bridge<K extends SpokeChainKey>({
    params,
    fee = this.config.bridge.partnerFee,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  }: Prettify<BridgeParams<K> & OptionalTimeout>): Promise<
    Result<[SpokeTxHash, HubTxHash], BridgeError<BridgeErrorCode>>
  > {
    try {
      const txResult = await this.createBridgeIntent({ params, fee, raw: false });

      if (!txResult.ok) {
        return txResult;
      }

      // verify the spoke tx hash exists on chain
      const verifyTxHashResult = await this.spokeService.verifyTxHash({
        txHash: txResult.value,
        chainKey: params.srcChainKey,
      });

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
        isSolanaChainKeyType(params.srcChainKey) || isBitcoinChainKeyType(params.srcChainKey)
          ? txResult.data
          : undefined,
        params.srcChainKey,
        this.config.relay.relayerApiEndpoint,
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
  async createBridgeIntent<K extends SpokeChainKey, R extends boolean = false>({
    params,
    fee = this.config.bridge.partnerFee,
    raw,
  }: Prettify<BridgeParams<K> & OptionalRaw<R>>): Promise<
    Result<TxReturnType<K, R>, BridgeError<'CREATE_BRIDGE_INTENT_FAILED'>> & BridgeOptionalExtraData
  > {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      const srcToken = this.config.getSpokeTokenFromOriginalAssetAddress(params.srcChainKey, params.srcToken);
      const dstToken = this.config.getSpokeTokenFromOriginalAssetAddress(params.dstChainKey, params.dstToken);

      // Vault can only be used on Sonic
      invariant(srcToken, `Unsupported spoke chain (${params.srcChainKey}) token: ${params.srcToken}`);
      // destination
      invariant(dstToken, `Unsupported spoke chain (${params.dstChainKey}) token: ${params.dstToken}`);

      // Bitcoin TRADING mode: must use trading wallet address for hub wallet derivation,
      // since BTC is deposited from trading wallet — hub wallet is derived via CREATE3(chainId + address).
      if (isBitcoinChainKeyType(params.srcChainKey)) {
        await spokeProvider.ensureRadfiAccessToken();
      }
      const walletAddress =
        spokeProvider instanceof BitcoinSpokeProvider
          ? await spokeProvider.getEffectiveWalletAddress()
          : await spokeProvider.walletProvider.getWalletAddress();

      const hubWallet = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        params.srcChainKey,
        this.hubProvider,
      );

      const data: Hex = this.buildBridgeData(params, srcToken, dstToken, fee);

      const txResult = await SpokeService.deposit(
        {
          from: walletAddress,
          to: hubWallet,
          token: params.srcToken,
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
    srcToken: XToken,
    dstToken: XToken,
    partnerFee: PartnerFee | undefined,
  ): Hex {
    const calls: EvmContractCall[] = [];
    let translatedAmount = params.amount;
    let srcVault = params.srcToken as `0x${string}`;
    // if src asset is not a vault token, we need to approve and deposit into the vault
    if (!this.config.isValidVault(srcToken.hubAsset)) {
      calls.push(Erc20Service.encodeApprove(srcToken.hubAsset, srcToken.vault, params.amount));
      calls.push(EvmVaultTokenService.encodeDeposit(srcToken.vault, srcToken.hubAsset, params.amount));
      translatedAmount = EvmVaultTokenService.translateIncomingDecimals(srcToken.decimals, params.amount);
      srcVault = srcToken.vault;
    }
    const feeAmount = calculateFeeAmount(translatedAmount, partnerFee);

    if (partnerFee && feeAmount > 0n) {
      calls.push(Erc20Service.encodeTransfer(srcVault, partnerFee.address, feeAmount));
    }

    const withdrawAmount = translatedAmount - feeAmount;
    let translatedWithdrawAmount = withdrawAmount;

    // if dst asset is not a vault token, we need to withdraw from the vault
    if (!this.config.isValidVault(dstToken.hubAsset)) {
      calls.push(EvmVaultTokenService.encodeWithdraw(dstToken.vault, dstToken.hubAsset, withdrawAmount));
      translatedWithdrawAmount = EvmVaultTokenService.translateOutgoingDecimals(dstToken.decimals, withdrawAmount);
    }

    const encodedRecipientAddress = encodeAddress(params.dstChainKey, params.recipient);
    // If the destination chain is Sonic, we can directly transfer the tokens to the recipient
    if (isHubChainKey(params.dstChainKey)) {
      // If destination token is S, then unwrap and send S to the recipient
      if (params.dstToken.toLowerCase() === this.hubProvider.chainConfig.nativeToken.toLowerCase()) {
        calls.push({
          address: dstToken.hubAsset,
          value: 0n,
          data: encodeFunctionData({
            abi: wrappedSonicAbi,
            functionName: 'withdrawTo',
            args: [encodedRecipientAddress, translatedWithdrawAmount],
          }),
        });
      } else {
        calls.push(Erc20Service.encodeTransfer(dstToken.hubAsset, encodedRecipientAddress, translatedWithdrawAmount));
      }
    } else {
      invariant(dstToken, `Unsupported hub chain (${params.dstChainKey}) token: ${params.dstToken}`);
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          dstToken.hubAsset,
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
      const fromToken = this.config.getSpokeTokenFromOriginalAssetAddress(from.chainKey, from.address);
      const toToken = this.config.getSpokeTokenFromOriginalAssetAddress(to.chainKey, to.address);

      invariant(fromToken, `Token not found for token ${from.address} on chain ${from.chainKey}`);
      invariant(toToken, `Token not found for token ${to.address} on chain ${to.chainKey}`);
      invariant(this.isBridgeable({ from, to }), `Tokens ${from.address} and ${to.address} are not bridgeable`);

      // we need to check the max deposit of the token on the from chain and the asset manager balance on the to chain
      const [tokenInfos, reserves] = await Promise.all([
        EvmVaultTokenService.getTokenInfos(
          fromToken.vault,
          [fromToken.hubAsset, toToken.hubAsset],
          this.hubProvider.publicClient,
        ),
        EvmVaultTokenService.getVaultReserves(toToken.vault, this.hubProvider.publicClient),
      ]);

      invariant(tokenInfos.length === 2, `Expected 2 token infos, got ${tokenInfos.length}`);
      const [fromTokenInfo, toTokenInfo] = tokenInfos;
      invariant(fromTokenInfo, 'From token info not found');
      invariant(toTokenInfo, 'To token info not found');

      // if the from token to be deposited is not supported, we return 0
      if (from.chainKey !== this.hubProvider.chainConfig.chain.key && !fromTokenInfo.isSupported) {
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
      if (!isHubChainKey(from.chainKey) && isHubChainKey(to.chainKey)) {
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
      if (isHubChainKey(from.chainKey) && !isHubChainKey(to.chainKey)) {
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
        invariant(this.config.isValidSpokeChainKey(from.chainKey), `Invalid spoke chain (${from.chainKey})`);
        invariant(this.config.isValidSpokeChainKey(to.chainKey), `Invalid spoke chain (${to.chainKey})`);
      }

      // Get hub asset info for both source and destination assets
      const srcToken = this.config.getSpokeTokenFromOriginalAssetAddress(from.chainKey, from.address);
      const dstToken = this.config.getSpokeTokenFromOriginalAssetAddress(to.chainKey, to.address);

      // Check if both assets are supported and have vault information
      invariant(srcToken, `Token not found for token ${from.address} on chain ${from.chainKey}`);
      invariant(dstToken, `Token not found for token ${to.address} on chain ${to.chainKey}`);

      // Check if the vault addresses are the same (case-insensitive comparison)
      return srcToken.vault.toLowerCase() === dstToken.vault.toLowerCase();
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
  public getBridgeableTokens(from: SpokeChainKey, to: SpokeChainKey, token: string): Result<XToken[]> {
    try {
      const srcToken = this.config.getSpokeTokenFromOriginalAssetAddress(from, token);
      invariant(srcToken, `Token not found for token ${token} on chain ${from}`);

      return {
        ok: true,
        value: this.filterTokensWithSameVault(this.config.spokeChainConfig[to].supportedTokens, to, srcToken),
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
    to: SpokeChainKey,
    srcToken: XToken | undefined,
  ): XToken[] {
    // Filter tokens that share the same vault as the source asset
    const bridgeableTokens: XToken[] = [];

    for (const token of Object.values(tokens)) {
      const dstToken = this.config.getSpokeTokenFromOriginalAssetAddress(to, token.address);

      if (dstToken && srcToken && dstToken.vault.toLowerCase() === srcToken.vault.toLowerCase()) {
        bridgeableTokens.push({
          ...token,
          chainKey: to,
        });
      }
    }

    return bridgeableTokens;
  }

  public findTokenBalanceInReserves(reserves: VaultReserves, token: XToken): bigint {
    const hubAsset = this.config.getSpokeTokenFromOriginalAssetAddress(token.chainKey, token.address);
    invariant(hubAsset, `Token not found for token ${token.address} on chain ${token.chainKey}`);
    const tokenIndex = reserves.tokens.findIndex(t => t.toLowerCase() === hubAsset.hubAsset.toLowerCase());
    invariant(
      tokenIndex !== -1,
      `Token ${hubAsset.hubAsset} not found in the vault reserves for chain ${token.chainKey}`,
    );
    return reserves.balances[tokenIndex] ?? 0n;
  }
}
