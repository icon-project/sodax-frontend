import invariant from 'tiny-invariant';
import { encodeFunctionData, isAddress } from 'viem';
import { poolAbi } from '../shared/abis/pool.abi.js';
import {
  type SpokeService,
  relayTxAndWaitPacket,
  type ConfigService,
  type SendMessageParams,
  type EstimateGasParams,
  type SpokeIsAllowanceValidParamsHub,
  type SpokeIsAllowanceValidParamsEvmSpoke,
  type SpokeIsAllowanceValidParamsStellar,
  HubService,
  Erc20Service,
  EvmAssetManagerService,
  EvmVaultTokenService,
  encodeContractCalls,
  encodeAddress,
  calculateFeeAmount,
  wrappedSonicAbi,
  isHubChainKeyType,
  isEvmSpokeOnlyChainKeyType,
  isStellarChainKeyType,
  isSolanaChainKeyType,
  isBitcoinChainKeyType,
  isOptionalEvmWalletProviderType,
  isOptionalStellarWalletProviderType,
  isUndefinedOrValidWalletProviderForChainKey,
} from '../shared/index.js';
import type { HubProvider, RelayOptionalExtraData } from '../shared/types/types.js';
import {
  type SpokeChainKey,
  type XToken,
  type Address,
  type Hex,
  type HttpUrl,
  type EvmContractCall,
  type HubTxHash,
  type Result,
  type SpokeTxHash,
  type TxReturnType,
  type GetAddressType,
  type GetTokenAddressType,
  type GetWalletProviderType,
  type GetEstimateGasReturnType,
  type PartnerFee,
  type HubChainKey,
  type EvmSpokeOnlyChainKey,
  type StellarChainKey,
  type GetMoneyMarketTokensApiResponse,
  DEFAULT_RELAY_TX_TIMEOUT,
  HUB_CHAIN_KEY,
  spokeChainConfig,
  type SpokeExecActionParams,
} from '@sodax/types';
import { MoneyMarketDataService } from './MoneyMarketDataService.js';

export type MoneyMarketEncodeSupplyParams = {
  asset: Address; // The address of the asset to supply.
  amount: bigint; // The amount of the asset to supply.
  onBehalfOf: Address; // The address on whose behalf the asset is supplied.
  referralCode: number; // The referral code for the transaction.
};

export type MoneyMarketEncodeWithdrawParams = {
  asset: Address; // The address of the asset to withdraw.
  amount: bigint; // The amount of the asset to withdraw.
  to: Address; // The address that will receive the withdrawn assets.
};

export type MoneyMarketEncodeBorrowParams = {
  asset: Address; // The address of the asset to borrow.
  amount: bigint; // The amount of the asset to borrow.
  interestRateMode: bigint; // The interest rate mode (2 for Variable).
  referralCode: number; // The referral code for the borrow transaction.
  onBehalfOf: Address; // The address that will receive the borrowed assets.
};

export type MoneyMarketEncodeRepayParams = {
  asset: Address; // The address of the asset to repay.
  amount: bigint; // The amount of the asset to repay.
  interestRateMode: bigint; // The interest rate mode (2 for Variable).
  onBehalfOf: Address; // The address that will get their debt reduced/removed.
};

export type MoneyMarketEncodeRepayWithATokensParams = {
  asset: Address; // The address of the asset to repay.
  amount: bigint; // The amount of the asset to repay.
  interestRateMode: bigint; // The interest rate mode (2 for Variable).
};

export type MoneyMarketAction = 'supply' | 'borrow' | 'withdraw' | 'repay';

/**
 * Parameters for a Money Market supply operation.
 *
 * `srcChainKey: K` drives chain-narrowing of the associated walletProvider.
 * `srcAddress` is the originating wallet on the source spoke chain.
 */
export type MoneyMarketSupplyParams<K extends SpokeChainKey = SpokeChainKey> = {
  srcChainKey: K;
  srcAddress: string;
  token: string;
  amount: bigint;
  action: 'supply';
  toChainId?: SpokeChainKey;
  toAddress?: string;
};

export type MoneyMarketBorrowParams<K extends SpokeChainKey = SpokeChainKey> = {
  srcChainKey: K;
  srcAddress: string;
  token: string;
  amount: bigint;
  action: 'borrow';
  fromChainId?: SpokeChainKey;
  fromAddress?: string;
  toChainId?: SpokeChainKey;
  toAddress?: string;
};

export type MoneyMarketWithdrawParams<K extends SpokeChainKey = SpokeChainKey> = {
  srcChainKey: K;
  srcAddress: string;
  token: string;
  amount: bigint;
  action: 'withdraw';
  toChainId?: SpokeChainKey;
  toAddress?: string;
};

export type MoneyMarketRepayParams<K extends SpokeChainKey = SpokeChainKey> = {
  srcChainKey: K;
  srcAddress: string;
  token: string;
  amount: bigint;
  action: 'repay';
  toChainId?: SpokeChainKey;
  toAddress?: string;
};

export type MoneyMarketParams<K extends SpokeChainKey = SpokeChainKey> =
  | MoneyMarketSupplyParams<K>
  | MoneyMarketBorrowParams<K>
  | MoneyMarketWithdrawParams<K>
  | MoneyMarketRepayParams<K>;

// Exec-mode wrappers (walletProvider required, K-narrowed)
export type MoneyMarketSupplyActionParams<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<
  K,
  Raw,
  MoneyMarketSupplyParams<K>
>;

export type MoneyMarketBorrowActionParams<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<
  K,
  Raw,
  MoneyMarketBorrowParams<K>
>;

export type MoneyMarketWithdrawActionParams<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<
  K,
  Raw,
  MoneyMarketWithdrawParams<K>
>;

export type MoneyMarketRepayActionParams<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<
  K,
  Raw,
  MoneyMarketRepayParams<K>
>;

// `isAllowanceValid` accepts any action (reads allowance/trustline state only).
export type MoneyMarketAllowanceParams<K extends SpokeChainKey> = {
  params: MoneyMarketParams<K>;
};

// `approve` accepts any action (but only supply/repay actually require approval on EVM).
export type MoneyMarketApproveActionParams<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<
  K,
  Raw,
  MoneyMarketParams<K>
>;

export type MoneyMarketServiceConstructorParams = {
  config: ConfigService;
  spoke: SpokeService;
  hubProvider: HubProvider;
};

/**
 * MoneyMarketService provides supply, borrow, withdraw, and repay operations against the
 * cross-chain money market pool on the hub chain. Mirrors the {@link SwapService} shape:
 * public methods accept `srcChainKey` + `srcAddress` + (for exec mode) `walletProvider`
 * instead of a bundled `SpokeProvider`. Pass `{ raw: true }` on `approve` / `create<Action>Intent`
 * to obtain raw transaction data for external signing and broadcasting.
 *
 * @namespace SodaxFeatures
 */
export class MoneyMarketService {
  // dependent services
  readonly hubProvider: HubProvider;
  readonly config: ConfigService;
  readonly spoke: SpokeService;

  // money market config (hoisted from config for ergonomics, mirrors SwapService)
  readonly partnerFee: PartnerFee | undefined;
  readonly relayerApiEndpoint: HttpUrl;

  // sub-service
  readonly data: MoneyMarketDataService;

  public constructor({ config, hubProvider, spoke }: MoneyMarketServiceConstructorParams) {
    this.config = config;
    this.hubProvider = hubProvider;
    this.spoke = spoke;
    this.partnerFee = config.moneyMarket.partnerFee;
    this.relayerApiEndpoint = config.relay.relayerApiEndpoint;
    this.data = new MoneyMarketDataService({ hubProvider, config: config });
  }

  /**
   * Estimate the gas for a raw transaction. Delegates to {@link SpokeService.estimateGas}.
   */
  public async estimateGas<K extends SpokeChainKey>(
    params: EstimateGasParams<K>,
  ): Promise<Result<GetEstimateGasReturnType<K>>> {
    return this.spoke.estimateGas(params) as Promise<Result<GetEstimateGasReturnType<K>>>;
  }

  /**
   * Check if allowance/trustline is sufficient for the given money market action.
   * - Supply / repay on hub: allowance vs the user's hub router.
   * - Supply / repay on EVM spoke: allowance vs the spoke's assetManager.
   * - Stellar (src or dst): trustline sufficiency on both wallets involved.
   * - Withdraw / borrow: no allowance concept — returns true.
   */
  public async isAllowanceValid<K extends SpokeChainKey>(
    _params: MoneyMarketAllowanceParams<K>,
  ): Promise<Result<boolean>> {
    try {
      const { params } = _params;
      const srcChainKey = params.srcChainKey;

      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.token.length > 0, 'Token is required');

      if (params.action === 'withdraw' || params.action === 'borrow') {
        const toChainId = params.toChainId ?? srcChainKey;
        invariant(
          this.config.isMoneyMarketSupportedToken(toChainId, params.token),
          `Unsupported spoke chain (${toChainId}) token: ${params.token}`,
        );
      } else {
        invariant(
          this.config.isMoneyMarketSupportedToken(srcChainKey, params.token),
          `Unsupported spoke chain (${srcChainKey}) token: ${params.token}`,
        );
      }

      // Target chain is Stellar with a specific recipient: both recipient and (if src is Stellar) sender
      // must have sufficient trustline for the token.
      if (params.toChainId && isStellarChainKeyType(params.toChainId) && params.toAddress) {
        const targetHasTrustline = (await this.spoke.isAllowanceValid({
          srcChainKey: params.toChainId,
          token: params.token,
          amount: params.amount,
          owner: params.toAddress,
        } satisfies SpokeIsAllowanceValidParamsStellar)) satisfies Result<boolean>;

        let srcHasTrustline = true;
        if (isStellarChainKeyType(srcChainKey)) {
          const allowanceResult = await this.spoke.isAllowanceValid({
            srcChainKey,
            token: params.token,
            amount: params.amount,
            owner: params.srcAddress,
          } satisfies SpokeIsAllowanceValidParamsStellar);

          if (!allowanceResult.ok) return allowanceResult;

          srcHasTrustline = allowanceResult.value;
        }

        return { ok: true, value: targetHasTrustline && srcHasTrustline };
      }

      if (isStellarChainKeyType(srcChainKey)) {
        return await this.spoke.isAllowanceValid({
          srcChainKey,
          token: params.token,
          amount: params.amount,
          owner: params.srcAddress,
        } satisfies SpokeIsAllowanceValidParamsStellar);
      }

      // Allowance on EVM (hub or spoke) is required only for supply / repay.
      if (params.action === 'supply' || params.action === 'repay') {
        if (isHubChainKeyType(srcChainKey)) {
          const spender = await HubService.getUserRouter(params.srcAddress as Address, this.hubProvider);
          return await this.spoke.isAllowanceValid({
            srcChainKey,
            token: params.token,
            amount: params.amount,
            owner: params.srcAddress,
            spender,
          } satisfies SpokeIsAllowanceValidParamsHub);
        }

        if (isEvmSpokeOnlyChainKeyType(srcChainKey)) {
          return await this.spoke.isAllowanceValid({
            srcChainKey,
            token: params.token,
            amount: params.amount,
            owner: params.srcAddress,
            spender: spokeChainConfig[srcChainKey].addresses.assetManager,
          } satisfies SpokeIsAllowanceValidParamsEvmSpoke);
        }
      }

      return { ok: true, value: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Approve token spending for a supply/repay action, or request a Stellar trustline.
   * For EVM hub callers the spender is the user's hub router; for EVM spokes it is the
   * asset manager. Borrow and withdraw don't require approval — invoking this with those
   * actions returns an error.
   */
  public async approve<K extends SpokeChainKey, Raw extends boolean>(
    _params: MoneyMarketApproveActionParams<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>>> {
    try {
      const { params, walletProvider } = _params;

      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.token.length > 0, 'Token is required');
      invariant(
        isUndefinedOrValidWalletProviderForChainKey(params.srcChainKey, walletProvider),
        `Invalid wallet provider for chain key: ${params.srcChainKey}, walletProvider.chainType: ${walletProvider?.chainType}`,
      );

      if (isStellarChainKeyType(params.srcChainKey)) {
        invariant(
          isOptionalStellarWalletProviderType(_params.walletProvider),
          'Invalid wallet provider. Expected Stellar wallet provider.',
        );

        const coreParams = {
          srcChainKey: params.srcChainKey,
          token: params.token,
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

      invariant(
        params.action === 'supply' || params.action === 'repay',
        'Invalid action (only supply and repay require approval on EVM)',
      );

      if (isHubChainKeyType(params.srcChainKey) || isEvmSpokeOnlyChainKeyType(params.srcChainKey)) {
        invariant(isAddress(params.token), 'Invalid token address');

        invariant(
          isOptionalEvmWalletProviderType(_params.walletProvider),
          'Invalid wallet provider. Expected Evm wallet provider.',
        );

        const spender = isHubChainKeyType(params.srcChainKey)
          ? await HubService.getUserRouter(params.srcAddress as Address, this.hubProvider)
          : spokeChainConfig[params.srcChainKey].addresses.assetManager;

        const coreParams = {
          srcChainKey: params.srcChainKey,
          token: params.token as GetTokenAddressType<HubChainKey>,
          amount: params.amount,
          owner: params.srcAddress as GetAddressType<HubChainKey>,
          spender,
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
        error: new Error('Approve only supported for hub (Sonic), EVM spokes, and Stellar'),
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  // ==== supply ==========================================================================

  /**
   * Supply tokens to the money market pool, relay the transaction to the hub, and return
   * the spoke + hub transaction hashes.
   */
  public async supply<K extends SpokeChainKey>(
    _params: MoneyMarketSupplyActionParams<K, false>,
  ): Promise<Result<[SpokeTxHash, HubTxHash]>> {
    const { params, timeout = DEFAULT_RELAY_TX_TIMEOUT } = _params;
    const srcChainKey = params.srcChainKey;

    try {
      const txResult = await this.createSupplyIntent(_params);
      if (!txResult.ok) return txResult;

      const verify = await this.spoke.verifyTxHash({ txHash: txResult.value, chainKey: srcChainKey });
      if (!verify.ok) return verify;

      // Relay skipped only when source chain is the hub.
      if (isHubChainKeyType(srcChainKey)) {
        return { ok: true, value: [txResult.value, txResult.value] };
      }

      const packet = await relayTxAndWaitPacket(
        txResult.value,
        isSolanaChainKeyType(srcChainKey) || isBitcoinChainKeyType(srcChainKey) ? txResult.data : undefined,
        srcChainKey,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packet.ok) return packet;

      return { ok: true, value: [txResult.value, packet.value.dst_tx_hash] };
    } catch (error) {
      return { ok: false, error };
    }
  }

  public async createSupplyIntent<K extends SpokeChainKey, Raw extends boolean>(
    _params: MoneyMarketSupplyActionParams<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>> & RelayOptionalExtraData> {
    const { params, walletProvider } = _params;
    const srcChainKey = params.srcChainKey;
    const skipSimulation = _params.skipSimulation ?? false;

    try {
      invariant(params.action === 'supply', 'Invalid action');
      invariant(params.token.length > 0, 'Token is required');
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(
        isUndefinedOrValidWalletProviderForChainKey(srcChainKey, walletProvider),
        `Invalid wallet provider for chain key: ${srcChainKey}, walletProvider.chainType: ${walletProvider?.chainType}`,
      );
      invariant(
        this.config.isMoneyMarketSupportedToken(srcChainKey, params.token),
        `Unsupported spoke chain (${srcChainKey}) token: ${params.token}`,
      );

      const toChainId = params.toChainId ?? srcChainKey;
      const toAddress = params.toAddress ?? params.srcAddress;

      const [fromHubWallet, toHubWallet] = await Promise.all([
        HubService.getUserHubWalletAddress(params.srcAddress, srcChainKey, this.hubProvider),
        HubService.getUserHubWalletAddress(toAddress, toChainId, this.hubProvider),
      ]);

      const data: Hex = this.buildSupplyData(srcChainKey, params.token, params.amount, toHubWallet);

      const coreParams = {
        srcChainKey,
        srcAddress: params.srcAddress as GetAddressType<K>,
        to: fromHubWallet,
        token: params.token as GetTokenAddressType<K>,
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

      if (!txResult.ok) return txResult;

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, Raw> as TxReturnType<K, Raw>,
        data: { address: fromHubWallet, payload: data },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  // ==== borrow ==========================================================================

  public async borrow<K extends SpokeChainKey>(
    _params: MoneyMarketBorrowActionParams<K, false>,
  ): Promise<Result<[SpokeTxHash, HubTxHash]>> {
    const { params, timeout = DEFAULT_RELAY_TX_TIMEOUT } = _params;
    const srcChainKey = params.srcChainKey;
    const hubChainId = this.hubProvider.chainConfig.chain.key;

    try {
      const txResult = await this.createBorrowIntent(_params);
      if (!txResult.ok) return txResult;

      const verify = await this.spoke.verifyTxHash({ txHash: txResult.value, chainKey: srcChainKey });
      if (!verify.ok) return verify;

      // Relay is not required when the borrow is executed on hub AND the target is also hub.
      // (Borrow from hub to a different target chain still needs the relay to deliver tokens.)
      const needsRelay =
        srcChainKey !== hubChainId ||
        (params.toChainId != null && params.toAddress != null && params.toChainId !== hubChainId);

      if (!needsRelay) {
        return { ok: true, value: [txResult.value, txResult.value] };
      }

      const packet = await relayTxAndWaitPacket(
        txResult.value,
        isSolanaChainKeyType(srcChainKey) || isBitcoinChainKeyType(srcChainKey) ? txResult.data : undefined,
        srcChainKey,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packet.ok) return packet;

      return { ok: true, value: [txResult.value, packet.value.dst_tx_hash] };
    } catch (error) {
      return { ok: false, error };
    }
  }

  public async createBorrowIntent<K extends SpokeChainKey, Raw extends boolean>(
    _params: MoneyMarketBorrowActionParams<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>> & RelayOptionalExtraData> {
    const { params, walletProvider } = _params;
    const srcChainKey = params.srcChainKey;
    const skipSimulation = _params.skipSimulation ?? false;

    try {
      invariant(params.action === 'borrow', 'Invalid action');
      invariant(params.token.length > 0, 'Token is required');
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(
        isUndefinedOrValidWalletProviderForChainKey(srcChainKey, walletProvider),
        `Invalid wallet provider for chain key: ${srcChainKey}, walletProvider.chainType: ${walletProvider?.chainType}`,
      );

      const fromChainId = params.fromChainId ?? srcChainKey;
      const fromAddress = params.fromAddress ?? params.srcAddress;
      const toChainId = params.toChainId ?? fromChainId;
      const toAddress = params.toAddress ?? fromAddress;
      const dstToken = this.config.getMoneyMarketToken(toChainId, params.token);

      invariant(dstToken, `Money market token not found for spoke chain (${toChainId}) token: ${params.token}`);

      const encodedToAddress = encodeAddress(toChainId, toAddress);
      const fromHubWallet = await HubService.getUserHubWalletAddress(fromAddress, fromChainId, this.hubProvider);

      const payload: Hex = this.buildBorrowData(
        fromHubWallet,
        encodedToAddress,
        dstToken.address,
        params.amount,
        toChainId,
      );

      const coreParams = {
        srcChainKey,
        srcAddress: params.srcAddress as GetAddressType<K>,
        dstChainKey: HUB_CHAIN_KEY,
        dstAddress: fromHubWallet,
        payload,
        skipSimulation,
      } as const;

      const sendMessageParams = _params.raw
        ? ({
            ...coreParams,
            raw: true,
          } satisfies SendMessageParams<K, true>)
        : ({
            ...coreParams,
            raw: false,
            walletProvider: _params.walletProvider as GetWalletProviderType<K>,
          } satisfies SendMessageParams<K, false>);

      const txResult = await this.spoke.sendMessage(sendMessageParams);

      if (!txResult.ok) return txResult;

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, boolean> as TxReturnType<K, Raw>,
        data: { address: fromHubWallet, payload },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  // ==== withdraw ========================================================================

  public async withdraw<K extends SpokeChainKey>(
    _params: MoneyMarketWithdrawActionParams<K, false>,
  ): Promise<Result<[SpokeTxHash, HubTxHash]>> {
    const { params, timeout = DEFAULT_RELAY_TX_TIMEOUT } = _params;
    const srcChainKey = params.srcChainKey;
    const hubChainId = this.hubProvider.chainConfig.chain.key;
    const walletRouter = this.hubProvider.chainConfig.addresses.walletRouter;

    try {
      const txResult = await this.createWithdrawIntent(_params);
      if (!txResult.ok) return txResult;

      const verify = await this.spoke.verifyTxHash({ txHash: txResult.value, chainKey: srcChainKey });
      if (!verify.ok) return verify;

      // Relay is not required only when: source is hub AND target is hub AND target is not the walletRouter.
      const needsRelay =
        srcChainKey !== hubChainId ||
        (params.toChainId != null &&
          params.toAddress != null &&
          params.toChainId !== hubChainId &&
          params.toAddress !== walletRouter);

      if (!needsRelay) {
        return { ok: true, value: [txResult.value, txResult.value] };
      }

      const packet = await relayTxAndWaitPacket(
        txResult.value,
        isSolanaChainKeyType(srcChainKey) || isBitcoinChainKeyType(srcChainKey) ? txResult.data : undefined,
        srcChainKey,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packet.ok) return packet;

      return { ok: true, value: [txResult.value, packet.value.dst_tx_hash] };
    } catch (error) {
      return { ok: false, error };
    }
  }

  public async createWithdrawIntent<K extends SpokeChainKey, Raw extends boolean>(
    _params: MoneyMarketWithdrawActionParams<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>> & RelayOptionalExtraData> {
    const { params, walletProvider } = _params;
    const srcChainKey = params.srcChainKey;
    const skipSimulation = _params.skipSimulation ?? false;

    try {
      invariant(params.action === 'withdraw', 'Invalid action');
      invariant(params.token.length > 0, 'Token is required');
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(
        isUndefinedOrValidWalletProviderForChainKey(srcChainKey, walletProvider),
        `Invalid wallet provider for chain key: ${srcChainKey}, walletProvider.chainType: ${walletProvider?.chainType}`,
      );

      const toChainId = params.toChainId ?? srcChainKey;
      const toAddress = params.toAddress ?? params.srcAddress;

      invariant(
        this.config.isMoneyMarketSupportedToken(toChainId, params.token),
        `Unsupported spoke chain (${toChainId}) token: ${params.token}`,
      );

      const encodedToAddress = encodeAddress(toChainId, toAddress);
      const fromHubWallet = await HubService.getUserHubWalletAddress(params.srcAddress, srcChainKey, this.hubProvider);

      const payload: Hex = this.buildWithdrawData(
        fromHubWallet,
        encodedToAddress,
        params.token,
        params.amount,
        toChainId,
      );

      const coreParams = {
        srcChainKey,
        srcAddress: params.srcAddress as GetAddressType<K>,
        dstChainKey: HUB_CHAIN_KEY,
        dstAddress: fromHubWallet,
        payload,
        skipSimulation,
      } as const;

      const sendMessageParams = _params.raw
        ? ({
            ...coreParams,
            raw: true,
          } satisfies SendMessageParams<K, true>)
        : ({
            ...coreParams,
            raw: false,
            walletProvider: _params.walletProvider as GetWalletProviderType<K>,
          } satisfies SendMessageParams<K, false>);

      const txResult = await this.spoke.sendMessage(sendMessageParams);

      if (!txResult.ok) return txResult;

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, boolean> as TxReturnType<K, Raw>,
        data: { address: fromHubWallet, payload },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  // ==== repay ===========================================================================

  public async repay<K extends SpokeChainKey>(
    _params: MoneyMarketRepayActionParams<K, false>,
  ): Promise<Result<[SpokeTxHash, HubTxHash]>> {
    const { params, timeout = DEFAULT_RELAY_TX_TIMEOUT } = _params;
    const srcChainKey = params.srcChainKey;

    try {
      const txResult = await this.createRepayIntent(_params);
      if (!txResult.ok) return txResult;

      const verify = await this.spoke.verifyTxHash({ txHash: txResult.value, chainKey: srcChainKey });
      if (!verify.ok) return verify;

      // Relay skipped only when source chain is the hub.
      if (isHubChainKeyType(srcChainKey)) {
        return { ok: true, value: [txResult.value, txResult.value] };
      }

      const packet = await relayTxAndWaitPacket(
        txResult.value,
        isSolanaChainKeyType(srcChainKey) || isBitcoinChainKeyType(srcChainKey) ? txResult.data : undefined,
        srcChainKey,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packet.ok) return packet;

      return { ok: true, value: [txResult.value, packet.value.dst_tx_hash] };
    } catch (error) {
      return { ok: false, error };
    }
  }

  public async createRepayIntent<K extends SpokeChainKey, Raw extends boolean>(
    _params: MoneyMarketRepayActionParams<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>> & RelayOptionalExtraData> {
    const { params, walletProvider } = _params;
    const srcChainKey = params.srcChainKey;
    const skipSimulation = _params.skipSimulation ?? false;

    try {
      invariant(params.action === 'repay', 'Invalid action');
      invariant(params.token.length > 0, 'Token is required');
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(
        isUndefinedOrValidWalletProviderForChainKey(srcChainKey, walletProvider),
        `Invalid wallet provider for chain key: ${srcChainKey}, walletProvider.chainType: ${walletProvider?.chainType}`,
      );
      invariant(
        this.config.isMoneyMarketSupportedToken(srcChainKey, params.token),
        `Unsupported spoke chain (${srcChainKey}) token: ${params.token}`,
      );

      const toChainId = params.toChainId ?? srcChainKey;
      const toAddress = params.toAddress ?? params.srcAddress;

      const [fromHubWallet, toHubWallet] = await Promise.all([
        HubService.getUserHubWalletAddress(params.srcAddress, srcChainKey, this.hubProvider),
        HubService.getUserHubWalletAddress(toAddress, toChainId, this.hubProvider),
      ]);

      const data: Hex = this.buildRepayData(srcChainKey, params.token, params.amount, toHubWallet);

      const coreParams = {
        srcChainKey,
        srcAddress: params.srcAddress as GetAddressType<K>,
        to: fromHubWallet,
        token: params.token as GetTokenAddressType<K>,
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

      if (!txResult.ok) return txResult;

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, Raw> as TxReturnType<K, Raw>,
        data: { address: fromHubWallet, payload: data },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  // ==== build helpers (hub-side call encoding) ==========================================

  /**
   * Build transaction data for supplying to the money market pool.
   */
  public buildSupplyData(fromChainId: SpokeChainKey, fromToken: string, amount: bigint, toHubAddress: Address): Hex {
    const calls: EvmContractCall[] = [];

    const fromHubAsset = this.config.getSpokeTokenFromOriginalAssetAddress(fromChainId, fromToken);
    invariant(fromHubAsset, `hub asset not found for source chain token (token): ${fromToken}`);

    const lendingPool = this.config.moneyMarket.lendingPool;

    if (!this.config.isValidVault(fromHubAsset.hubAsset)) {
      // deposit non-vault token into the vault
      calls.push(Erc20Service.encodeApprove(fromHubAsset.hubAsset, fromHubAsset.vault, amount));
      calls.push(EvmVaultTokenService.encodeDeposit(fromHubAsset.vault, fromHubAsset.hubAsset, amount));
    }

    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(fromHubAsset.decimals, amount);
    calls.push(Erc20Service.encodeApprove(fromHubAsset.vault, lendingPool, translatedAmount));
    calls.push(
      MoneyMarketService.encodeSupply(
        { asset: fromHubAsset.vault, amount: translatedAmount, onBehalfOf: toHubAddress, referralCode: 0 },
        lendingPool,
      ),
    );

    return encodeContractCalls(calls);
  }

  /**
   * Build transaction data for borrowing from the money market pool.
   */
  public buildBorrowData(
    fromHubAddress: Address,
    toAddress: Address,
    toToken: string,
    amount: bigint,
    toChainId: SpokeChainKey,
  ): Hex {
    const toHubAsset = this.config.getSpokeTokenFromOriginalAssetAddress(toChainId, toToken);
    const dstToken = this.config.getMoneyMarketToken(toChainId, toToken);
    invariant(toHubAsset, `hub asset not found for target chain token (toToken): ${toToken}`);
    invariant(dstToken, `Money market token not found for spoke chain (${toChainId}) token: ${toToken}`);

    const assetAddress = toHubAsset.hubAsset;
    const vaultAddress = toHubAsset.vault;
    const bnUSDVault = this.config.moneyMarket.bnUSDVault;
    const bnUSD = this.config.moneyMarket.bnUSD;
    const lendingPool = this.config.moneyMarket.lendingPool;

    const translatedInAmount = EvmVaultTokenService.translateIncomingDecimals(toHubAsset.decimals, amount);
    const feeAmount = calculateFeeAmount(translatedInAmount, this.partnerFee);
    const calls: EvmContractCall[] = [];

    if (bnUSDVault.toLowerCase() === vaultAddress.toLowerCase()) {
      calls.push(
        MoneyMarketService.encodeBorrow(
          {
            asset: bnUSD,
            amount: translatedInAmount,
            interestRateMode: 2n,
            referralCode: 0,
            onBehalfOf: fromHubAddress,
          },
          lendingPool,
        ),
      );
      calls.push(Erc20Service.encodeApprove(bnUSD, bnUSDVault, translatedInAmount));
      calls.push(EvmVaultTokenService.encodeDeposit(bnUSDVault, bnUSD, translatedInAmount));

      if (this.partnerFee && feeAmount) {
        calls.push(Erc20Service.encodeTransfer(bnUSDVault, this.partnerFee.address, feeAmount));
      }
    } else {
      calls.push(
        MoneyMarketService.encodeBorrow(
          {
            asset: vaultAddress,
            amount: translatedInAmount,
            interestRateMode: 2n,
            referralCode: 0,
            onBehalfOf: fromHubAddress,
          },
          lendingPool,
        ),
      );

      if (this.partnerFee && feeAmount) {
        calls.push(Erc20Service.encodeTransfer(vaultAddress, this.partnerFee.address, feeAmount));
      }
    }

    if (toToken.toLowerCase() !== vaultAddress.toLowerCase()) {
      // if the target token is not the vault token, we need to withdraw the tokens from the vault
      calls.push(EvmVaultTokenService.encodeWithdraw(vaultAddress, assetAddress, translatedInAmount - feeAmount));
    }

    let translatedAmountOut: bigint;
    if (this.config.isValidVault(toToken)) {
      translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(
        toHubAsset.decimals,
        translatedInAmount - feeAmount,
      );
    } else {
      translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(
        dstToken.decimals,
        translatedInAmount - feeAmount,
      );
    }

    if (toChainId === this.hubProvider.chainConfig.chain.key) {
      if (assetAddress.toLowerCase() === this.config.spokeChainConfig[toChainId].addresses.wrappedSonic.toLowerCase()) {
        const withdrawToCall = {
          address: assetAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: wrappedSonicAbi,
            functionName: 'withdrawTo',
            args: [toAddress, translatedAmountOut],
          }),
        };

        calls.push(withdrawToCall);
      } else {
        calls.push(Erc20Service.encodeTransfer(assetAddress, toAddress, translatedAmountOut));
      }
    } else {
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          assetAddress,
          toAddress,
          translatedAmountOut,
          this.hubProvider.chainConfig.addresses.assetManager,
        ),
      );
    }

    return encodeContractCalls(calls);
  }

  /**
   * Build transaction data for withdrawing from the money market pool.
   */
  public buildWithdrawData(
    fromHubAddress: Address,
    toAddress: Address,
    toToken: string,
    amount: bigint,
    toChainId: SpokeChainKey,
  ): Hex {
    const calls: EvmContractCall[] = [];

    const toHubAsset = this.config.getSpokeTokenFromOriginalAssetAddress(toChainId, toToken);
    const dstToken = this.config.getMoneyMarketToken(toChainId, toToken);
    invariant(toHubAsset, `hub asset not found for target chain token (toToken): ${toToken}`);
    invariant(dstToken, `Money market token not found for spoke chain (${toChainId}) token: ${toToken}`);

    const assetAddress = toHubAsset.hubAsset;
    const vaultAddress = toHubAsset.vault;
    const lendingPool = this.config.moneyMarket.lendingPool;

    const translatedInAmount = EvmVaultTokenService.translateIncomingDecimals(toHubAsset.decimals, amount);

    calls.push(
      MoneyMarketService.encodeWithdraw(
        { asset: vaultAddress, amount: translatedInAmount, to: fromHubAddress },
        lendingPool,
      ),
    );

    if (!this.config.isValidVault(toToken)) {
      // if the target token is not the vault token, we need to withdraw the tokens from the vault
      calls.push(EvmVaultTokenService.encodeWithdraw(vaultAddress, assetAddress, translatedInAmount));
    }

    let translatedAmountOut: bigint;
    if (this.config.isValidVault(toToken)) {
      translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(toHubAsset.decimals, translatedInAmount);
    } else {
      translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(dstToken.decimals, translatedInAmount);
    }

    if (toChainId === this.hubProvider.chainConfig.chain.key) {
      if (assetAddress.toLowerCase() === this.config.spokeChainConfig[toChainId].addresses.wrappedSonic.toLowerCase()) {
        const withdrawToCall = {
          address: assetAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: wrappedSonicAbi,
            functionName: 'withdrawTo',
            args: [toAddress, translatedAmountOut],
          }),
        };
        calls.push(withdrawToCall);
      } else {
        calls.push(Erc20Service.encodeTransfer(assetAddress, toAddress, translatedAmountOut));
      }
    } else {
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          assetAddress,
          toAddress,
          translatedAmountOut,
          this.hubProvider.chainConfig.addresses.assetManager,
        ),
      );
    }

    return encodeContractCalls(calls);
  }

  /**
   * Build transaction data for repaying to the money market pool.
   */
  public buildRepayData(fromChainId: SpokeChainKey, fromToken: string, amount: bigint, toHubAddress: Address): Hex {
    const calls: EvmContractCall[] = [];

    const fromHubAsset = this.config.getSpokeTokenFromOriginalAssetAddress(fromChainId, fromToken);
    invariant(fromHubAsset, `hub asset not found for source chain token (fromToken): ${fromToken}`);

    const assetAddress = fromHubAsset.hubAsset;
    const vaultAddress = fromHubAsset.vault;
    const bnUSDVault = this.config.moneyMarket.bnUSDVault;
    const bnUSD = this.config.moneyMarket.bnUSD;
    const lendingPool = this.config.moneyMarket.lendingPool;

    const translatedAmountIn = EvmVaultTokenService.translateIncomingDecimals(fromHubAsset.decimals, amount);

    let repayToken = vaultAddress;
    if (bnUSDVault.toLowerCase() === vaultAddress.toLowerCase()) {
      // when repaying bnUSD using vault token, bnUSD debt token gets repaid
      repayToken = bnUSD;

      if (assetAddress.toLowerCase() !== bnUSDVault.toLowerCase()) {
        // if asset address is not bnUSD vault, we need to approve and deposit the asset into the vault
        calls.push(Erc20Service.encodeApprove(assetAddress, vaultAddress, amount));
        calls.push(EvmVaultTokenService.encodeDeposit(vaultAddress, assetAddress, amount));
      }

      // withdraw the bnUSD debt token from the vault
      calls.push(EvmVaultTokenService.encodeWithdraw(bnUSDVault, bnUSD, translatedAmountIn));
    } else {
      if (!this.config.isValidVault(fromHubAsset.hubAsset)) {
        calls.push(Erc20Service.encodeApprove(assetAddress, vaultAddress, amount));
        calls.push(EvmVaultTokenService.encodeDeposit(vaultAddress, assetAddress, amount));
      }
    }

    calls.push(Erc20Service.encodeApprove(repayToken, lendingPool, translatedAmountIn));
    calls.push(
      MoneyMarketService.encodeRepay(
        { asset: repayToken, amount: translatedAmountIn, interestRateMode: 2n, onBehalfOf: toHubAddress },
        lendingPool,
      ),
    );
    return encodeContractCalls(calls);
  }

  // ==== static encoders (unchanged) =====================================================

  /**
   * Calculate aToken amount from actual amount using liquidityIndex.
   */
  static calculateATokenAmount(amount: bigint, normalizedIncome: bigint): bigint {
    return (amount * 10n ** 27n) / normalizedIncome + 1n;
  }

  public static encodeSupply(params: MoneyMarketEncodeSupplyParams, lendingPool: Address): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'supply',
        args: [params.asset, params.amount, params.onBehalfOf, params.referralCode],
      }),
    };
  }

  public static encodeWithdraw(params: MoneyMarketEncodeWithdrawParams, lendingPool: Address): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'withdraw',
        args: [params.asset, params.amount, params.to],
      }),
    };
  }

  public static encodeBorrow(params: MoneyMarketEncodeBorrowParams, lendingPool: Address): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'borrow',
        args: [params.asset, params.amount, params.interestRateMode, params.referralCode, params.onBehalfOf],
      }),
    };
  }

  public static encodeRepay(params: MoneyMarketEncodeRepayParams, lendingPool: Address): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'repay',
        args: [params.asset, params.amount, params.interestRateMode, params.onBehalfOf],
      }),
    };
  }

  public static encodeRepayWithATokens(
    params: MoneyMarketEncodeRepayWithATokensParams,
    lendingPool: Address,
  ): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'repayWithATokens',
        args: [params.asset, params.amount, params.interestRateMode],
      }),
    };
  }

  public static encodeSetUserUseReserveAsCollateral(
    asset: Address,
    useAsCollateral: boolean,
    lendingPool: Address,
  ): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'setUserUseReserveAsCollateral',
        args: [asset, useAsCollateral],
      }),
    };
  }

  // ==== info getters =====================================================================

  public getSupportedTokensByChainId(chainId: SpokeChainKey): readonly XToken[] {
    return this.config.getSupportedMoneyMarketTokensByChainId(chainId);
  }

  public getSupportedTokens(): GetMoneyMarketTokensApiResponse {
    return this.config.getSupportedMoneyMarketTokens();
  }

  public getSupportedReserves(): readonly Address[] {
    return this.config.getMoneyMarketReserveAssets();
  }
}
