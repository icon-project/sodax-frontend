import type { DestinationParamsType, RelayOptionalExtraData } from '../shared/types/types.js';
import type { Address, Hex } from 'viem';
import {
  EvmAssetManagerService,
  type SpokeService,
  encodeAddress,
  Erc20Service,
  Erc4626Service,
  EvmVaultTokenService,
  encodeContractCalls,
  relayTxAndWaitPacket,
  type ConfigService,
  HubService,
  wrappedSonicAbi,
  type HubProvider,
  isStellarChainKeyType,
  type SpokeIsAllowanceValidParamsStellar,
  isHubChainKeyType,
  isEvmChainKeyType,
  isSolanaChainKeyType,
  isBitcoinChainKeyType,
  isOptionalStellarWalletProviderType,
  isEvmSpokeOnlyChainKeyType,
  isOptionalEvmWalletProviderType,
  type SendMessageParams,
} from '../shared/index.js';
import {
  SodaTokens,
  type ConcentratedLiquidityConfig,
  type EvmChainKey,
  type EvmContractCall,
  type EvmSpokeOnlyChainKey,
  type GetAddressType,
  type GetTokenAddressType,
  type GetWalletProviderType,
  type HttpUrl,
  type HubChainKey,
  type HubTxHash,
  type OriginalAssetAddress,
  type Result,
  type SpokeChainKey,
  type SpokeTxHash,
  type StellarChainKey,
  type TxReturnType,
  type WalletProviderSlot,
} from '@sodax/types';
import { encodeFunctionData, erc20Abi, isAddress } from 'viem';
import invariant from 'tiny-invariant';
import { stataTokenFactoryAbi } from '../shared/abis/stataTokenFactory.abi.js';

export type CreateAssetWithdrawParams<K extends SpokeChainKey> = {
  srcChainKey: K;
  srcAddress: GetAddressType<K>;
  poolToken: Address;
  asset: OriginalAssetAddress; // asset address
  amount: bigint; // amount of asset to withdraw
  dst?: DestinationParamsType;
};

export type CreateAssetDepositParams<K extends SpokeChainKey> = {
  srcChainKey: K;
  srcAddress: GetAddressType<K>;
  asset: OriginalAssetAddress; // asset address
  amount: bigint; // amount of token to deposit
  poolToken: Address;
  dst?: DestinationParamsType;
};

export type AssetWithdrawAction<K extends SpokeChainKey, Raw extends boolean> = {
  params: CreateAssetWithdrawParams<K>;
  skipSimulation?: boolean;
  timeout?: number;
} & WalletProviderSlot<K, Raw>;

export type AssetDepositAction<K extends SpokeChainKey, Raw extends boolean> = {
  params: CreateAssetDepositParams<K>;
  skipSimulation?: boolean;
  timeout?: number;
} & WalletProviderSlot<K, Raw>;

export type AssetServiceConstructorParams = {
  hubProvider: HubProvider;
  spoke: SpokeService;
  config: ConfigService;
};

/**
 * AssetService is a service that provides functionalities for asset operations.
 * @namespace SodaxFeatures
 */
export class AssetService {
  public readonly relayerApiEndpoint: HttpUrl;
  public readonly hubProvider: HubProvider;
  public readonly spoke: SpokeService;
  public readonly config: ConfigService;
  public readonly concentratedLiquidityConfig: ConcentratedLiquidityConfig;

  constructor({ config, hubProvider, spoke }: AssetServiceConstructorParams) {
    this.config = config;
    this.spoke = spoke;
    this.relayerApiEndpoint = config.relay.relayerApiEndpoint;
    this.hubProvider = hubProvider;
    this.concentratedLiquidityConfig = config.dex.concentratedLiquidityConfig;
  }

  /**
   * Check whether sufficient allowance is available for an asset deposit action.
   * This determines whether a contract/manager can transfer the specified ERC20 asset on behalf of the user,
   * or whether approval or, for Stellar, trustlines are needed.
   *
   * For EVM-based chains, checks ERC20 allowance against the asset manager (for EvmSpokeProvider),
   * or against the user router contract (for SonicSpokeProvider on Sonic chains).
   * For Stellar, verifies if the sender's trustline is sufficient.
   * For all other chains, returns `true` (approval is not required).
   *
   * @param {AssetDepositParams<S>} params - Object containing:
   *   - depositParams: Deposit input parameters (asset address, amount, etc.)
   *   - spokeProvider: The provider instance for the originating chain
   * @returns {Promise<Result<boolean>>}
   *   Resolves with Result.ok(true) if allowance/trustline is sufficient, or Result.ok(false) if not,
   *   or Result.error if allowance/trustline check failed.
   *
   * @example
   * const result = await assetService.isAllowanceValid({
   *   depositParams: { asset: '0x...', amount: 1000n },
   *   spokeProvider,
   * });
   * if (!result.ok) {
   *   // Handle error (e.g. result.error)
   * } else if (!result.value) {
   *   // Approval or trustline is needed
   * }
   */
  public async isAllowanceValid<K extends SpokeChainKey, Raw extends boolean>(
    _params: AssetDepositAction<K, Raw>,
  ): Promise<Result<boolean>> {
    const { params } = _params;
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.asset.length > 0, 'Source asset is required');

      if (isStellarChainKeyType(params.srcChainKey)) {
        const result = await this.spoke.isAllowanceValid({
          srcChainKey: params.srcChainKey,
          token: params.asset,
          amount: params.amount,
          owner: params.srcAddress,
        } satisfies SpokeIsAllowanceValidParamsStellar);

        if (!result.ok) return result;

        return result;
      }

      if (isEvmChainKeyType(params.srcChainKey) || isHubChainKeyType(params.srcChainKey)) {
        const spender = isHubChainKeyType(params.srcChainKey)
          ? await HubService.getUserHubWalletAddress(params.srcAddress, params.srcChainKey, this.hubProvider)
          : this.config.sodaxConfig.chains[params.srcChainKey].addresses.assetManager;

        const result = await this.spoke.isAllowanceValid({
          srcChainKey: params.srcChainKey,
          token: params.asset,
          amount: params.amount,
          owner: params.srcAddress,
          spender: spender as GetAddressType<EvmChainKey | HubChainKey>,
        });

        if (!result.ok) return result;

        return result;
      }

      // For non-EVM/non-Sonic chains, no approval is required
      return {
        ok: true,
        value: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Approves the amount spending for deposit actions.
   * @param params - The parameters for the asset transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction hash instead of the transaction receipt
   * @returns {Promise<Result<TxReturnType<S, R>>>} - Returns the raw transaction payload or transaction hash
   *
   * @example
   * const result = await assetService.approve(
   *   {
   *     asset: '0x...', // asset address
   *     amount: 1000n, // amount to deposit
   *   },
   *   spokeProvider, // EvmSpokeProvider or SonicSpokeProvider instance
   *   true // Optional raw flag to return the raw transaction hash instead of the transaction receipt
   * );
   *
   */
  public async approve<K extends SpokeChainKey, Raw extends boolean>(
    _params: AssetDepositAction<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>>> {
    const { params } = _params;
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.asset.length > 0, 'Source asset is required');

      if (isStellarChainKeyType(params.srcChainKey)) {
        invariant(
          isOptionalStellarWalletProviderType(_params.walletProvider),
          'Invalid wallet provider. Expected Stellar wallet provider.',
        );
        const coreParams = {
          srcChainKey: params.srcChainKey,
          token: params.asset,
          amount: params.amount,
          owner: params.srcAddress as GetAddressType<StellarChainKey>,
        } as const;

        const result = await this.spoke.approve<StellarChainKey, boolean>(
          _params.raw
            ? {
                ...coreParams,
                raw: true,
              }
            : {
                ...coreParams,
                raw: false,
                walletProvider: _params.walletProvider,
              },
        );

        if (!result.ok) return result;

        return {
          ok: true,
          value: result.value satisfies TxReturnType<StellarChainKey, boolean> as TxReturnType<K, Raw>,
        };
      }

      if (isEvmSpokeOnlyChainKeyType(params.srcChainKey) || isHubChainKeyType(params.srcChainKey)) {
        invariant(isAddress(params.asset), 'Invalid source asset address for EVM chain');
        invariant(
          isOptionalEvmWalletProviderType(_params.walletProvider),
          'Invalid wallet provider. Expected Evm wallet provider.',
        );

        const spender = isHubChainKeyType(params.srcChainKey)
          ? await HubService.getUserHubWalletAddress(params.srcAddress, params.srcChainKey, this.hubProvider)
          : this.config.sodaxConfig.chains[params.srcChainKey].addresses.assetManager;

        const coreParams = {
          srcChainKey: params.srcChainKey,
          token: params.asset,
          amount: params.amount,
          owner: params.srcAddress as GetAddressType<EvmChainKey | HubChainKey>,
          spender: spender as GetAddressType<EvmChainKey | HubChainKey>,
        } as const;

        const result = await this.spoke.approve<HubChainKey | EvmSpokeOnlyChainKey, Raw>({
          ...coreParams,
          raw: _params.raw,
          walletProvider: _params.walletProvider,
        });

        if (!result.ok) {
          return result;
        }

        return {
          ok: true,
          value: result.value satisfies TxReturnType<EvmSpokeOnlyChainKey, Raw> as TxReturnType<K, Raw>,
        };
      }

      return {
        ok: false,
        error: new Error('Approve only supported for EVM/Stellar spoke chains'),
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Execute deposit action - wraps tokens and prepares for liquidity provision
   */
  public async executeDeposit<K extends SpokeChainKey, Raw extends boolean>(
    _params: AssetDepositAction<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>> & RelayOptionalExtraData> {
    const { params, skipSimulation } = _params;
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.asset.length > 0, 'Source asset is required');
      invariant(params.poolToken.length > 0, 'Pool token is required');

      const [fromHubWallet, recipient] = params.dst
        ? await Promise.all([
            HubService.getUserHubWalletAddress(params.srcAddress, params.srcChainKey, this.hubProvider),
            HubService.getUserHubWalletAddress(params.dst.dstAddress, params.dst.dstChainKey, this.hubProvider),
          ])
        : await HubService.getUserHubWalletAddress(params.srcAddress, params.srcChainKey, this.hubProvider).then(
            w => [w, w] as const,
          );

      const calls = await this.getTokenWrapAction(
        params.asset,
        params.srcChainKey,
        params.amount,
        params.poolToken,
        recipient,
      );
      const data: Hex = encodeContractCalls(calls);

      const coreParams = {
        srcAddress: params.srcAddress as GetAddressType<K>,
        srcChainKey: params.srcChainKey,
        to: recipient,
        token: params.asset as GetTokenAddressType<K>,
        amount: params.amount,
        data,
        skipSimulation,
      } as const;

      const txResult = await this.spoke.deposit(
        _params.raw
          ? {
              ...coreParams,
              raw: true,
            }
          : {
              ...coreParams,
              raw: false,
              walletProvider: _params.walletProvider as GetWalletProviderType<K>,
            },
      );

      if (!txResult.ok) {
        return {
          ok: false,
          error: txResult.error,
        };
      }

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, Raw> as TxReturnType<K, Raw>,
        data: {
          address: fromHubWallet,
          payload: data,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Execute withdraw action - withdraws tokens from a position
   */
  public async executeWithdraw<K extends SpokeChainKey, Raw extends boolean>(
    _params: AssetWithdrawAction<K, Raw>,
  ): Promise<
    Result<TxReturnType<K, Raw>> & RelayOptionalExtraData
  > {
    const { params, skipSimulation } = _params;
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.asset.length > 0, 'Source asset is required');
      invariant(params.poolToken.length > 0, 'Pool token is required');

      const [fromHubWallet, recipient] = params.dst
        ? await Promise.all([
            HubService.getUserHubWalletAddress(params.srcAddress, params.srcChainKey, this.hubProvider),
            HubService.getUserHubWalletAddress(params.dst.dstAddress, params.dst.dstChainKey, this.hubProvider),
          ])
        : [
            await HubService.getUserHubWalletAddress(params.srcAddress, params.srcChainKey, this.hubProvider),
            params.srcAddress,
          ];
      const dstChainKey: SpokeChainKey = params.dst?.dstChainKey ?? params.srcChainKey;

      const calls = await this.getTokenUnwrapAction(
        dstChainKey,
        params.asset,
        params.amount,
        fromHubWallet,
        encodeAddress(dstChainKey, recipient),
      );

      const data = encodeContractCalls(calls);
      const coreParams = {
        srcAddress: recipient as GetAddressType<K>,
        srcChainKey: dstChainKey as K,
        dstChainKey: this.hubProvider.chainConfig.chain.key,
        dstAddress: fromHubWallet,
        payload: data,
        skipSimulation,
      };

      const sendMessageParams = _params.raw
        ? ({
            ...coreParams,
            raw: true,
          } satisfies SendMessageParams<K, true>)
        : ({
            ...coreParams,
            raw: false,
            walletProvider: _params.walletProvider,
          } satisfies SendMessageParams<K, false>);

      const txResult = await this.spoke.sendMessage(sendMessageParams);

      if (!txResult.ok) {
        return {
          ok: false,
          error: txResult.error,
        };
      }

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, boolean> as TxReturnType<K, Raw>,
        data: {
          address: recipient as `0x${string}`,
          payload: data,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Check if the asset is SODA and the pool token is XSODA (requires stake/unstake if yes)
   * @param chainId - The chain id
   * @param asset - The asset address
   * @param poolToken - The pool token address
   * @returns True if the asset is SODA and the pool token is XSODA, false otherwise
   */
  public isSodaAsXSodaInPool({
    chainId,
    asset,
    poolToken,
  }: {
    chainId: SpokeChainKey;
    asset: OriginalAssetAddress;
    poolToken: Address;
  }): boolean {
    const spokeToken = this.config.getSpokeTokenFromOriginalAssetAddress(chainId, asset);

    if (!spokeToken) {
      throw new Error(`[isSodaDepositToXSoda] Spoke token not found for asset ${asset}`);
    }

    return (
      spokeToken.symbol.toLowerCase() === 'soda' &&
      poolToken.toLowerCase() === this.hubProvider.chainConfig.addresses.xSoda.toLowerCase()
    );
  }

  /**
   * Deposit tokens and wait for the transaction to be relayed to the hub.
   *
   * This method wraps {@link executeDeposit} and performs post-processing to relay
   * the resulting transaction to the hub. It returns both the spoke chain
   * transaction hash and the hub transaction hash (post-relay).
   *
   * @typeParam S - The type of SpokeProvider.
   * @param params - Parameters for the deposit operation:
   *   - depositParams: Parameters for the deposit intent (asset, amount, poolToken, etc).
   *   - spokeProvider: The spoke provider instance (EvmSpokeProvider or SonicSpokeProvider).
   *   - timeout (optional): Timeout in ms to wait for hub relay (default: 60000).
   *
   * @returns A promise that resolves to a {@link Result} containing a tuple with
   * [spokeTxHash, hubTxHash] as value on success, or an {@link AssetServiceError} on failure.
   *
   * @example
   * const result = await assetService.deposit({
   *   depositParams: {
   *     asset: '0x...',      // asset address
   *     amount: 1000n,       // amount to deposit
   *     poolToken: '0x...',  // pool token address
   *   },
   *   spokeProvider,          // instance of EvmSpokeProvider or SonicSpokeProvider
   *   timeout: 30000,         // optional, in ms
   * });
   *
   * if (!result.ok) {
   *   // handle error
   * } else {
   *   const [spokeTxHash, hubTxHash] = result.value;
   *   console.log('Deposit transaction hashes:', { spokeTxHash, hubTxHash });
   * }
   */
  public async deposit<K extends SpokeChainKey>(
    _params: AssetDepositAction<K, false>,
  ): Promise<Result<[SpokeTxHash, HubTxHash]>> {
    const { params, timeout } = _params;
    try {
      const txResult = await this.executeDeposit(_params);
      if (!txResult.ok) return txResult;

      let intentTxHash: string | null = null;
      if (!isHubChainKeyType(params.srcChainKey)) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          isSolanaChainKeyType(params.srcChainKey) || isBitcoinChainKeyType(params.srcChainKey)
            ? txResult.data
            : undefined,
          params.srcChainKey,
          this.relayerApiEndpoint,
          timeout,
        );
        if (!packetResult.ok) return packetResult;

        intentTxHash = packetResult.value.dst_tx_hash;
      } else {
        intentTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, intentTxHash] };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Withdraw and wait for the transaction to be relayed to the hub
   * This method wraps executeWithdraw and relays the transaction to the hub
   *
   * @example
   * const result = await assetService.withdraw(
   *   {
   *     asset: '0x...', // asset address
   *     amount: 1000n, // amount to withdraw
   *     poolToken: '0x...', // pool token address
   *   },
   *   spokeProvider, // EvmSpokeProvider or SonicSpokeProvider instance
   *   30000 // Optional timeout in milliseconds (default: 60000)
   * );
   *
   * if (!result.ok) {
   *   // Handle error
   * }
   *
   * const [spokeTxHash, hubTxHash] = result.value;
   * console.log('Withdraw transaction hashes:', { spokeTxHash, hubTxHash });
   */
  public async withdraw<K extends SpokeChainKey>(
    _params: AssetWithdrawAction<K, false>,
  ): Promise<Result<[SpokeTxHash, HubTxHash]>> {
    const { params, timeout } = _params;
    try {
      const txResult = await this.executeWithdraw(_params);
      if (!txResult.ok) return txResult;

      let intentTxHash: string | null = null;
      if (!isHubChainKeyType(params.srcChainKey)) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          isSolanaChainKeyType(params.srcChainKey) || isBitcoinChainKeyType(params.srcChainKey)
            ? txResult.data
            : undefined,
          params.srcChainKey,
          this.relayerApiEndpoint,
          timeout,
        );
        if (!packetResult.ok) return packetResult;

        intentTxHash = packetResult.value.dst_tx_hash;
      } else {
        intentTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, intentTxHash] };
    } catch (error) {
      return { ok: false, error };
    }
  }

  public async getTokenWrapAction(
    address: OriginalAssetAddress,
    spokeChainId: SpokeChainKey,
    amount: bigint,
    poolToken: Address,
    recipient: Address,
  ): Promise<EvmContractCall[]> {
    const assetConfig = this.config.getSpokeTokenFromOriginalAssetAddress(spokeChainId, address);
    if (!assetConfig) {
      throw new Error('[withdrawData] Hub asset not found');
    }

    const calls: EvmContractCall[] = [];
    if (!this.config.isValidVault(assetConfig.hubAsset)) {
      calls.push(Erc20Service.encodeApprove(assetConfig.hubAsset, assetConfig.vault, amount));
      calls.push(EvmVaultTokenService.encodeDeposit(assetConfig.vault, assetConfig.hubAsset, amount));
    }
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimals, amount);

    if (poolToken.toLowerCase() === assetConfig.vault.toLowerCase()) {
      return calls;
    }

    const dexToken: Address = await this.hubProvider.publicClient.readContract({
      address: this.config.sodaxConfig.dex.concentratedLiquidityConfig.stataTokenFactory,
      abi: stataTokenFactoryAbi,
      functionName: 'getStataToken',
      args: [assetConfig.vault],
    });

    invariant(dexToken === poolToken, 'Dex token does not match pool token');

    // deposit non-vault token into the vault
    calls.push(Erc20Service.encodeApprove(assetConfig.vault, dexToken, translatedAmount));
    calls.push(Erc4626Service.encodeDeposit(dexToken, translatedAmount, recipient));

    return calls;
  }

  /**
   * Get the token unwrap action for a given asset
   * @param address - The address of the asset
   * @param dstChainId - The destination spoke chain id
   * @param amount - The amount of the wrapped assets
   * @param userAddress - The address of the user wallet
   * @param recipient - The address of the recipient
   * @returns The token unwrap action
   */
  public async getTokenUnwrapAction(
    dstChainId: SpokeChainKey,
    address: OriginalAssetAddress,
    amount: bigint,
    userAddress: Address,
    recipient: Hex,
  ): Promise<EvmContractCall[]> {
    const assetConfig = this.config.getSpokeTokenFromOriginalAssetAddress(dstChainId, address);
    if (!assetConfig) {
      throw new Error('[withdrawData] Hub asset not found');
    }

    let dexToken: Address = await this.hubProvider.publicClient.readContract({
      address: this.config.sodaxConfig.dex.concentratedLiquidityConfig.stataTokenFactory,
      abi: stataTokenFactoryAbi,
      functionName: 'getStataToken',
      args: [assetConfig.vault],
    });

    if (SodaTokens.bnUSD.address.toLowerCase() === assetConfig.vault.toLowerCase()) {
      dexToken = assetConfig.vault;
    }

    const calls: EvmContractCall[] = [];
    let vaultAmount = amount;
    if (
      SodaTokens.bnUSD.address.toLowerCase() !== assetConfig.vault.toLowerCase() &&
      dexToken.toLowerCase() !== '0x0000000000000000000000000000000000000000'
    ) {
      const unwrapped = await this.getUnwrappedAmount(dexToken, amount);
      if (!unwrapped.ok) throw unwrapped.error;
      vaultAmount = unwrapped.value;
      calls.push(Erc4626Service.encodeRedeem(dexToken, amount, userAddress, userAddress));
    }

    calls.push(EvmVaultTokenService.encodeWithdraw(assetConfig.vault, assetConfig.hubAsset, vaultAmount));
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimals, vaultAmount);

    if (dstChainId === this.hubProvider.chainConfig.chain.key) {
      if (
        assetConfig.hubAsset.toLowerCase() ===
        this.config.spokeChainConfig[dstChainId].addresses.wrappedSonic.toLowerCase()
      ) {
        const withdrawToCall = {
          address: assetConfig.hubAsset,
          value: 0n,
          data: encodeFunctionData({
            abi: wrappedSonicAbi,
            functionName: 'withdrawTo',
            args: [recipient, translatedAmount],
          }),
        };

        calls.push(withdrawToCall);
      } else {
        calls.push(Erc20Service.encodeTransfer(assetConfig.hubAsset, recipient, translatedAmount));
      }
    } else {
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          assetConfig.hubAsset,
          recipient,
          translatedAmount,
          this.hubProvider.chainConfig.addresses.assetManager,
        ),
      );
    }

    return calls;
  }

  /**
   * Helper method to convert assets to shares (wrapped amount)
   * EX BTC -> BTC deposited in moneymarket earning intrest.
   * @param dexToken - The ERC4626 token address
   * @param assetAmount - The amount of underlying assets
   * @returns The equivalent amount of shares
   */
  public async getWrappedAmount(dexToken: Address, assetAmount: bigint): Promise<Result<bigint>> {
    try {
      const shares = await Erc4626Service.convertToShares(dexToken, assetAmount, this.hubProvider.publicClient);
      if (!shares.ok) return shares;
      return { ok: true, value: shares.value };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Helper method to convert shares to assets (unwrapped amount)
   * EX  BTC deposited in moneymarket earning intrest -> BTC.
   * @param dexToken - The ERC4626 token address
   * @param shareAmount - The amount of shares
   * @returns The equivalent amount of underlying assets
   */
  public async getUnwrappedAmount(dexToken: Address, shareAmount: bigint): Promise<Result<bigint>> {
    try {
      const assetAmount = await Erc4626Service.convertToAssets(dexToken, shareAmount, this.hubProvider.publicClient);
      if (!assetAmount.ok) return assetAmount;
      return { ok: true, value: assetAmount.value };
    } catch (error) {
      return { ok: false, error };
    }
  }

  public async getDeposit(
    poolToken: Address,
    walletAddress: Address,
    chainKey: SpokeChainKey,
  ): Promise<Result<bigint>> {
    try {
      const hubwallet = await HubService.getUserHubWalletAddress(walletAddress, chainKey, this.hubProvider);
      const value = await this.hubProvider.publicClient.readContract({
        address: poolToken,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [hubwallet],
      });
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
