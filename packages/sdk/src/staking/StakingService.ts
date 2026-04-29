// packages/sdk/src/services/staking/StakingService.ts
import invariant from 'tiny-invariant';
import { erc20Abi, type Address, type Hex } from 'viem';
import { StakingLogic } from './StakingLogic.js';
import { stakedSodaAbi } from '../shared/abis/index.js';
import type { RelayOptionalExtraData } from '../shared/types/types.js';
import {
  encodeContractCalls,
  EvmVaultTokenService,
  relayTxAndWaitPacket,
  type SpokeService,
  type EvmHubProvider,
  encodeAddress,
  EvmAssetManagerService,
  HubService,
  type ConfigService,
  isHubChainKeyType,
  isStellarChainKeyType,
  isSolanaChainKeyType,
  isBitcoinChainKeyType,
  Erc20Service,
  isEvmSpokeOnlyChainKeyType,
  isOptionalEvmWalletProviderType,
  isOptionalStellarWalletProviderType,
  type SendMessageParams,
} from '../shared/index.js';
import {
  type HttpUrl,
  type XToken,
  type SpokeChainKey,
  getIntentRelayChainId,
  type UserUnstakeInfo,
  type EvmContractCall,
  type TxReturnType,
  type GetAddressType,
  type Result,
  type GetWalletProviderType,
  isEvmChainKey,
  type EvmChainKey,
  type HubChainKey,
  type GetTokenAddressType,
  type StellarChainKey,
  type SpokeExecActionParams,
  type EvmSpokeOnlyChainKey,
} from '@sodax/types';

export type StakeParams<K extends SpokeChainKey> = {
  srcChainKey: K; // chain key of the spoke chain to stake from
  srcAddress: Address; // account to stake from
  amount: bigint; // amount to stake
  minReceive: bigint; // minimum amount to receive
  action: 'stake';
};

export type StakeAction<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<K, Raw, StakeParams<K>>;

export type UnstakeParams<K extends SpokeChainKey> = {
  srcChainKey: K; // chain key of the spoke chain to unstake from
  srcAddress: Address; // account to unstake from
  amount: bigint; // amount of xSoda to unstake
  action: 'unstake';
};

export type UnstakeAction<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<
  K,
  Raw,
  UnstakeParams<K>
>;

export type ClaimParams<K extends SpokeChainKey> = {
  srcAddress: Address;
  srcChainKey: K; // chain key of the spoke chain to claim from
  requestId: bigint;
  amount: bigint; // claimable amount after penalty calculation
  action: 'claim';
};

export type ClaimAction<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<K, Raw, ClaimParams<K>>;

export type CancelUnstakeParams<K extends SpokeChainKey> = {
  srcAddress: Address;
  srcChainKey: K; // chain key of the spoke chain to cancel unstake from
  requestId: bigint;
  action: 'cancelUnstake';
};

export type CancelUnstakeAction<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<
  K,
  Raw,
  CancelUnstakeParams<K>
>;

export type InstantUnstakeParams<K extends SpokeChainKey> = {
  srcAddress: Address;
  srcChainKey: K; // chain key of the spoke chain to instant unstake from
  amount: bigint;
  minAmount: bigint;
  action: 'instantUnstake';
};

export type InstantUnstakeAction<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<
  K,
  Raw,
  InstantUnstakeParams<K>
>;

export type StakingActionType = 'stake' | 'unstake' | 'claim' | 'cancelUnstake' | 'instantUnstake';
export type StakingActionUnion<K extends SpokeChainKey> =
  | StakeParams<K>
  | UnstakeParams<K>
  | ClaimParams<K>
  | CancelUnstakeParams<K>
  | InstantUnstakeParams<K>;

export type StakingParamsUnion<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<
  K,
  Raw,
  StakingActionUnion<K>
>;

export type StakingInfo = {
  totalStaked: bigint; // Total SODA staked (totalAssets from xSODA vault)
  totalUnderlying: bigint; // Total underlying SODA assets in the vault
  userXSodaBalance: bigint; // User's xSODA shares (raw balance)
  userXSodaValue: bigint; // User's xSODA value in SODA (converted)
  userUnderlying: bigint; // User's underlying SODA amount
};

export type UnstakingInfo = {
  userUnstakeSodaRequests: readonly UserUnstakeInfo[];
  totalUnstaking: bigint;
};

export type UnstakeRequestWithPenalty = UserUnstakeInfo & {
  penalty: bigint;
  penaltyPercentage: number;
  claimableAmount: bigint;
};

export type StakingConfig = {
  unstakingPeriod: bigint; // in seconds
  minUnstakingPeriod: bigint; // in seconds
  maxPenalty: bigint; // percentage (1-100)
};

export type StakingServiceConstructorParams = {
  hubProvider: EvmHubProvider;
  config: ConfigService;
  spoke: SpokeService;
};

/**
 * StakingService provides a high-level interface for staking operations
 * including staking SODA tokens, unstaking, claiming rewards, and retrieving staking information.
 * All transaction methods return encoded contract calls that can be sent via a wallet provider.
 * @namespace SodaxFeatures
 */
export class StakingService {
  private readonly hubProvider: EvmHubProvider;
  private readonly relayerApiEndpoint: HttpUrl;
  private readonly config: ConfigService;
  private readonly spoke: SpokeService;

  constructor({ hubProvider, config, spoke }: StakingServiceConstructorParams) {
    this.hubProvider = hubProvider;
    this.relayerApiEndpoint = config.relay.relayerApiEndpoint;
    this.config = config;
    this.spoke = spoke;
  }

  /**
   * Check if allowance is valid for the staking operations
   * @param params - The staking parameters
   * @param spokeProvider - The spoke provider
   * @returns {Promise<Result<boolean>>}
   */
  public async isAllowanceValid<K extends SpokeChainKey, Raw extends boolean>(
    _params: StakingParamsUnion<K, Raw>,
  ): Promise<Result<boolean>> {
    const { params } = _params;
    try {
      if (params.action === 'stake' || params.action === 'unstake' || params.action === 'instantUnstake') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');

        const targetToken =
          params.action === 'stake' || !isHubChainKeyType(params.srcChainKey)
            ? this.config.sodaxConfig.chains[params.srcChainKey].supportedTokens.SODA.address
            : this.hubProvider.chainConfig.addresses.xSoda;
        invariant(targetToken, 'Target token not found');

        if (isEvmChainKey(params.srcChainKey) || isHubChainKeyType(params.srcChainKey)) {
          const spender = isHubChainKeyType(params.srcChainKey)
            ? await HubService.getUserHubWalletAddress(params.srcAddress, params.srcChainKey, this.hubProvider)
            : this.config.sodaxConfig.chains[params.srcChainKey].addresses.assetManager;

          const allowanceResult = await this.spoke.isAllowanceValid({
            srcChainKey: params.srcChainKey,
            token: targetToken,
            amount: params.amount,
            owner: params.srcAddress,
            spender: spender as GetAddressType<EvmChainKey | HubChainKey>,
          });

          if (!allowanceResult.ok) return allowanceResult;

          return {
            ok: true,
            value: allowanceResult.value,
          };
        }

        if (isStellarChainKeyType(params.srcChainKey)) {
          const allowanceResult = await this.spoke.isAllowanceValid({
            srcChainKey: params.srcChainKey,
            token: targetToken,
            amount: params.amount,
            owner: params.srcAddress,
          });

          if (!allowanceResult.ok) return allowanceResult;

          return allowanceResult;
        }

        // For non-EVM chains (Icon, Sui, Stellar, etc.), no allowance check needed
        return {
          ok: true,
          value: true,
        };
      }

      // Return false by default
      return {
        ok: false,
        error: new Error('Invalid staking action'),
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Approve token spending for the staking operations
   * @param params - The staking parameters
   * @param spokeProvider - The spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns Promise<Result<TxReturnType<S, R>>>
   */
  public async approve<K extends SpokeChainKey, Raw extends boolean>(
    _params: StakingParamsUnion<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>>> {
    const { params } = _params;
    try {
      if (params.action === 'stake' || params.action === 'unstake' || params.action === 'instantUnstake') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');

        const targetToken =
          params.action === 'stake' || !isHubChainKeyType(params.srcChainKey)
            ? this.config.sodaxConfig.chains[params.srcChainKey].supportedTokens.SODA.address
            : this.hubProvider.chainConfig.addresses.xSoda;
        invariant(targetToken, 'Target token not found');

        if (isEvmSpokeOnlyChainKeyType(params.srcChainKey) || isHubChainKeyType(params.srcChainKey)) {
          invariant(
            isOptionalEvmWalletProviderType(_params.walletProvider),
            'Invalid wallet provider. Expected Evm wallet provider.',
          );

          const spender = isHubChainKeyType(params.srcChainKey)
            ? await HubService.getUserHubWalletAddress(params.srcAddress, params.srcChainKey, this.hubProvider)
            : this.config.sodaxConfig.chains[params.srcChainKey].addresses.assetManager;

          const coreParams = {
            srcChainKey: params.srcChainKey,
            token: targetToken as GetTokenAddressType<EvmSpokeOnlyChainKey | HubChainKey>,
            amount: params.amount,
            owner: params.srcAddress,
            spender: spender,
          } as const;

          const result = await this.spoke.approve<HubChainKey | EvmSpokeOnlyChainKey, Raw>({
            ...coreParams,
            raw: _params.raw,
            walletProvider: _params.walletProvider,
          });

          if (!result.ok) return result;

          return result satisfies Result<TxReturnType<HubChainKey | EvmSpokeOnlyChainKey, boolean>> as Result<
            TxReturnType<K, Raw>
          >;
        }

        if (isStellarChainKeyType(params.srcChainKey)) {
          invariant(
            isOptionalStellarWalletProviderType(_params.walletProvider),
            'Invalid wallet provider. Expected Stellar wallet provider.',
          );
          const coreParams = {
            srcChainKey: params.srcChainKey,
            token: targetToken,
            amount: params.amount,
            owner: params.srcAddress,
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

          return result satisfies Result<TxReturnType<StellarChainKey, boolean>> as Result<TxReturnType<K, Raw>>;
        }
      }

      return {
        ok: false,
        error: new Error(
          'Approval only supported for EVM spoke chains and [stake, unstake, instantUnstake] operations',
        ),
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Execute stake transaction for staking SODA tokens to receive xSoda shares
   * NOTE: For EVM chains, you may need to approve token spending first using the approve method
   * @param params - The staking parameters
   * @param spokeProvider - The spoke provider
   * @param timeout - The timeout in milliseconds for the transaction (default: DEFAULT_RELAY_TX_TIMEOUT)
   * @returns Promise<Result<[SpokeTxHash, HubTxHash] | RelayError>>
   */
  public async stake<K extends SpokeChainKey>(_params: StakeAction<K, false>): Promise<Result<[string, string]>> {
    const { params, timeout } = _params;

    try {
      const txResult = await this.createStakeIntent(_params);

      if (!txResult.ok) return txResult;

      // verify the spoke tx hash exists on chain
      const verifyTxHashResult = await this.spoke.verifyTxHash({
        txHash: txResult.value,
        chainKey: params.srcChainKey,
      });

      if (!verifyTxHashResult.ok) return verifyTxHashResult;

      let hubTxHash: string | null = null;
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
        hubTxHash = packetResult.value.dst_tx_hash;
      } else {
        hubTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, hubTxHash] };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Create stake intent only (without relaying to hub)
   * NOTE: This method only executes the transaction on the spoke chain and creates the stake intent
   * In order to successfully stake tokens, you need to:
   * 1. Check if the allowance is sufficient using isAllowanceValid
   * 2. Approve the appropriate contract to spend the tokens using approve
   * 3. Create the stake intent using this method
   * 4. Relay the transaction to the hub and await completion using the stake method
   *
   * @param params - The stake parameters including amount and account
   * @param spokeProvider - The spoke provider for the source chain
   * @param raw - Whether to return the raw transaction data (default: false)
   * @returns Promise<Result<TxReturnType<S, R>> & { data?: { address: string; payload: Hex } }>
   */
  async createStakeIntent<K extends SpokeChainKey, Raw extends boolean>(
    _params: StakeAction<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>> & RelayOptionalExtraData> {
    const { params, skipSimulation } = _params;
    try {
      const sodaToken = this.config.sodaxConfig.chains[params.srcChainKey].supportedTokens.SODA as XToken;
      invariant(sodaToken, 'SODA token not found');
      const sodaAsset = this.config.getSpokeTokenFromOriginalAssetAddress(params.srcChainKey, sodaToken.address);
      invariant(sodaAsset, 'SODA asset not found');

      const hubWallet = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        params.srcChainKey,
        this.hubProvider,
      );

      const data: Hex = this.buildStakeData(sodaAsset, hubWallet, params);

      const coreParams = {
        srcAddress: params.srcAddress as GetAddressType<K>,
        srcChainKey: params.srcChainKey,
        to: hubWallet,
        token: sodaToken.address as GetTokenAddressType<K>,
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
        console.error(txResult.error);
        return txResult;
      }

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, Raw> as TxReturnType<K, Raw>,
        data: {
          address: hubWallet,
          payload: data,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Build stake data using StakingRouter (simplified flow)
   * @param sodaAsset - The SODA asset information
   * @param to - The destination address
   * @param params - The staking parameters
   * @returns The encoded contract call data
   */
  public buildStakeData(sodaAsset: XToken, to: Address, params: StakeParams<SpokeChainKey>): Hex {
    const hubConfig = this.config.getHubChainConfig();
    const sodaVault = sodaAsset.vault;
    const stakingRouter = hubConfig.addresses.stakingRouter;

    const calls: EvmContractCall[] = [];
    calls.push(Erc20Service.encodeApprove(sodaAsset.hubAsset, sodaVault, params.amount));
    calls.push(EvmVaultTokenService.encodeDeposit(sodaVault, sodaAsset.hubAsset, params.amount));
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(sodaAsset.decimals, params.amount);
    calls.push(Erc20Service.encodeApprove(sodaVault, stakingRouter, translatedAmount));
    calls.push(StakingLogic.encodeStakingRouterStake(stakingRouter, translatedAmount, to, params.minReceive));
    return encodeContractCalls(calls);
  }

  /**
   * Execute unstake transaction for unstaking xSoda shares
   * @param params - The unstaking parameters
   * @param spokeProvider - The spoke provider
   * @param timeout - The timeout in milliseconds for the transaction (default: DEFAULT_RELAY_TX_TIMEOUT)
   * @returns Promise<Result<[SpokeTxHash, HubTxHash] | RelayError>>
   */
  public async unstake<K extends SpokeChainKey>(_params: UnstakeAction<K, false>): Promise<Result<[string, string]>> {
    const { params, timeout } = _params;
    try {
      const txResult = await this.createUnstakeIntent(_params);

      if (!txResult.ok) return txResult;

      let hubTxHash: string | null = null;
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
        hubTxHash = packetResult.value.dst_tx_hash;
      } else {
        hubTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, hubTxHash ?? ''] };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Create unstake intent only (without relaying to hub)
   * NOTE: This method only executes the transaction on the spoke chain and creates the unstake intent
   * In order to successfully unstake tokens, you need to:
   * 1. Check if the allowance is sufficient using isAllowanceValid
   * 2. Approve the appropriate contract to spend the tokens using approve
   * 3. Create the unstake intent using this method
   * 4. Relay the transaction to the hub and await completion using the unstake method
   *
   * @param params - The unstake parameters including amount and account
   * @param spokeProvider - The spoke provider for the source chain
   * @param raw - Whether to return the raw transaction data (default: false)
   * @returns Promise<Result<TxReturnType<S, R>> & { data?: { address: string; payload: Hex } }>
   */
  async createUnstakeIntent<K extends SpokeChainKey, Raw extends boolean>(
    _params: UnstakeAction<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>> & RelayOptionalExtraData> {
    const { params } = _params;
    try {
      const xSoda = this.hubProvider.chainConfig.addresses.xSoda;
      const [hubWallet, underlyingSodaAmount] = await Promise.all([
        HubService.getUserHubWalletAddress(params.srcAddress, params.srcChainKey, this.hubProvider),
        StakingLogic.convertXSodaSharesToSoda(xSoda, params.amount, this.hubProvider.publicClient),
      ]);
      const data: Hex = this.buildUnstakeData(hubWallet, params, xSoda, underlyingSodaAmount);

      const coreParams = {
        srcAddress: params.srcAddress as GetAddressType<K>,
        srcChainKey: params.srcChainKey,
        dstChainKey: this.hubProvider.chainConfig.chain.key,
        dstAddress: hubWallet,
        payload: data,
      } as const;

      const txResult = await this.spoke.sendMessage(
        _params.raw
          ? ({
              ...coreParams,
              raw: true,
            } satisfies SendMessageParams<K, true>)
          : ({
              ...coreParams,
              raw: false,
              walletProvider: _params.walletProvider,
            } satisfies SendMessageParams<K, false>),
      );

      if (!txResult.ok) {
        console.error(txResult.error);
        return txResult;
      }

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, Raw> as TxReturnType<K, Raw>,
        data: {
          address: hubWallet,
          payload: data,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Build unstake data for unstaking xSoda shares
   * @param hubWallet - The hub wallet address
   * @param params - The unstake parameters
   * @returns The encoded contract call data
   */
  public buildUnstakeData<K extends SpokeChainKey>(
    hubWallet: Address,
    params: UnstakeParams<K>,
    xSoda: Address,
    underlyingSodaAmount: bigint,
  ): Hex {
    const hubConfig = this.config.getHubChainConfig();
    const stakedSoda = hubConfig.addresses.stakedSoda;
    const calls: EvmContractCall[] = [];
    calls.push(StakingLogic.encodeXSodaRedeem(xSoda, params.amount, hubWallet, hubWallet));
    calls.push(StakingLogic.encodeUnstake(stakedSoda, hubWallet, underlyingSodaAmount));
    return encodeContractCalls(calls);
  }

  /**
   * Execute instant unstake transaction for instantly unstaking xSoda shares
   * @param params - The instant unstaking parameters
   * @param spokeProvider - The spoke provider
   * @param timeout - The timeout in milliseconds for the transaction (default: DEFAULT_RELAY_TX_TIMEOUT)
   * @returns Promise<Result<[SpokeTxHash, HubTxHash] | RelayError>>
   */
  public async instantUnstake<K extends SpokeChainKey>(
    _params: InstantUnstakeAction<K, false>,
  ): Promise<Result<[string, string]>> {
    const { params, timeout } = _params;
    try {
      const txResult = await this.createInstantUnstakeIntent(_params);

      if (!txResult.ok) return txResult;

      let hubTxHash: string | null = null;
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
        hubTxHash = packetResult.value.dst_tx_hash;
      } else {
        hubTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, hubTxHash] };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Create instant unstake intent only (without relaying to hub)
   * NOTE: This method only executes the transaction on the spoke chain and creates the instant unstake intent
   * In order to successfully instant unstake tokens, you need to:
   * 1. Create the instant unstake intent using this method
   * 2. Relay the transaction to the hub and await completion using the instantUnstake method
   *
   * @param params - The instant unstake parameters including amount, minAmount and account
   * @param spokeProvider - The spoke provider for the source chain
   * @param raw - Whether to return the raw transaction data (default: false)
   * @returns Promise<Result<TxReturnType<S, R>> & { data?: { address: string; payload: Hex } }>
   */
  async createInstantUnstakeIntent<K extends SpokeChainKey, Raw extends boolean>(
    _params: InstantUnstakeAction<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>> & RelayOptionalExtraData> {
    const { params } = _params;
    try {
      const hubWallet = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        params.srcChainKey,
        this.hubProvider,
      );

      const sodaToken = this.hubProvider.chainConfig.supportedTokens.SODA;
      invariant(sodaToken, 'SODA token not found');
      const sodaAsset = this.config.getSpokeTokenFromOriginalAssetAddress(params.srcChainKey, sodaToken.address);
      invariant(sodaAsset, 'SODA asset not found');

      const data = this.buildInstantUnstakeData(
        sodaAsset,
        params.srcChainKey,
        encodeAddress(params.srcChainKey, params.srcAddress),
        params,
      );

      const coreParams = {
        srcAddress: params.srcAddress as GetAddressType<K>,
        srcChainKey: params.srcChainKey,
        dstChainKey: this.hubProvider.chainConfig.chain.key,
        dstAddress: hubWallet,
        payload: data,
      } as const;

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
        console.error(txResult.error);
        return txResult;
      }

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, boolean> as TxReturnType<K, Raw>,
        data: {
          address: hubWallet,
          payload: data,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Build instant unstake data for instantly unstaking xSoda shares
   * @param sodaAsset - The SODA asset information
   * @param dstChainId - The destination chain ID
   * @param dstWallet - The destination wallet address
   * @param params - The instant unstake parameters
   * @returns The encoded contract call data
   */
  public buildInstantUnstakeData<K extends SpokeChainKey>(
    sodaAsset: XToken,
    dstChainId: SpokeChainKey,
    dstWallet: Hex,
    params: InstantUnstakeParams<K>,
  ): Hex {
    const hubConfig = this.config.getHubChainConfig();
    const stakingRouter = hubConfig.addresses.stakingRouter;
    const xSoda = hubConfig.addresses.xSoda;

    const calls: EvmContractCall[] = [];
    calls.push(Erc20Service.encodeApprove(xSoda, stakingRouter, params.amount));
    calls.push(
      StakingLogic.encodeStakingRouterUnstake(
        stakingRouter,
        params.amount,
        params.minAmount,
        sodaAsset.hubAsset,
        getIntentRelayChainId(dstChainId),
        dstWallet,
      ),
    );

    return encodeContractCalls(calls);
  }

  /**
   * Execute claim transaction for claiming unstaked tokens after the unstaking period
   * @param params - The claim parameters
   * @param spokeProvider - The spoke provider
   * @param timeout - The timeout in milliseconds for the transaction (default: DEFAULT_RELAY_TX_TIMEOUT)
   * @returns Promise<Result<[SpokeTxHash, HubTxHash] | RelayError>>
   */
  public async claim<K extends SpokeChainKey>(_params: ClaimAction<K, false>): Promise<Result<[string, string]>> {
    const { params, timeout } = _params;
    try {
      const txResult = await this.createClaimIntent(_params);

      if (!txResult.ok) return txResult;

      let hubTxHash: string;
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
        hubTxHash = packetResult.value.dst_tx_hash;
      } else {
        hubTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, hubTxHash] };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Create claim intent only (without relaying to hub)
   * NOTE: This method only executes the transaction on the spoke chain and creates the claim intent
   * In order to successfully claim tokens, you need to:
   * 1. Create the claim intent using this method
   * 2. Relay the transaction to the hub and await completion using the claim method
   *
   * @param params - The claim parameters including requestId
   * @param spokeProvider - The spoke provider for the source chain
   * @param raw - Whether to return the raw transaction data (default: false)
   * @returns Promise<Result<TxReturnType<S, R>> & { data?: { address: string; payload: Hex } }>
   */
  async createClaimIntent<K extends SpokeChainKey, Raw extends boolean>(
    _params: ClaimAction<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>> & RelayOptionalExtraData> {
    const { params } = _params;
    try {
      const hubWallet = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        params.srcChainKey,
        this.hubProvider,
      );

      const sodaToken = this.config.sodaxConfig.chains[params.srcChainKey].supportedTokens.SODA as XToken;
      invariant(sodaToken, 'SODA token not found');
      const sodaAsset = this.config.getSpokeTokenFromOriginalAssetAddress(params.srcChainKey, sodaToken.address);
      invariant(sodaAsset, 'SODA asset not found');

      const data: Hex = this.buildClaimData(
        sodaAsset,
        params.srcChainKey,
        encodeAddress(params.srcChainKey, params.srcAddress),
        params,
      );

      const coreParams = {
        srcAddress: params.srcAddress as GetAddressType<K>,
        srcChainKey: params.srcChainKey,
        dstChainKey: this.hubProvider.chainConfig.chain.key,
        dstAddress: hubWallet,
        payload: data,
      } as const;

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
        console.error(txResult.error);
        return txResult;
      }

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, Raw> as TxReturnType<K, Raw>,
        data: {
          address: hubWallet,
          payload: data,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Build claim data for claiming unstaked tokens
   * @param sodaAsset - The SODA asset information
   * @param dstChainId - The destination chain ID
   * @param dstWallet - The destination wallet address
   * @param params - The claim parameters
   * @returns The encoded contract call data
   */
  public buildClaimData<K extends SpokeChainKey>(
    sodaAsset: XToken,
    dstChainId: SpokeChainKey,
    dstWallet: Hex,
    params: ClaimParams<K>,
  ): Hex {
    const hubConfig = this.config.getHubChainConfig();
    const stakedSoda = hubConfig.addresses.stakedSoda;
    const sodaVault = sodaAsset.vault;
    const calls: EvmContractCall[] = [];
    calls.push(StakingLogic.encodeClaim(stakedSoda, params.requestId));
    // Transfer the claimable amount to the destination wallet
    calls.push(EvmVaultTokenService.encodeWithdraw(sodaVault, sodaAsset.hubAsset, params.amount));
    const translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(sodaAsset.decimals, params.amount);

    if (dstChainId === this.hubProvider.chainConfig.chain.key) {
      calls.push(Erc20Service.encodeTransfer(sodaAsset.hubAsset, dstWallet, translatedAmountOut));
    } else {
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          sodaAsset.hubAsset,
          dstWallet,
          translatedAmountOut,
          this.hubProvider.chainConfig.addresses.assetManager,
        ),
      );
    }

    return encodeContractCalls(calls);
  }

  /**
   * Execute cancel unstake transaction for cancelling an unstake request
   * @param params - The cancel unstake parameters
   * @param spokeProvider - The spoke provider
   * @param timeout - The timeout in milliseconds for the transaction (default: DEFAULT_RELAY_TX_TIMEOUT)
   * @returns Promise<Result<[SpokeTxHash, HubTxHash] | RelayError>>
   */
  public async cancelUnstake<K extends SpokeChainKey>(
    _params: CancelUnstakeAction<K, false>,
  ): Promise<Result<[string, string]>> {
    const { params, timeout } = _params;
    try {
      const txResult = await this.createCancelUnstakeIntent(_params);

      if (!txResult.ok) return txResult;

      let hubTxHash: string | null = null;
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
        hubTxHash = packetResult.value.dst_tx_hash;
      } else {
        hubTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, hubTxHash] };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Create cancel unstake intent only (without relaying to hub)
   * NOTE: This method only executes the transaction on the spoke chain and creates the cancel unstake intent
   * In order to successfully cancel an unstake request, you need to:
   * 1. Create the cancel unstake intent using this method
   * 2. Relay the transaction to the hub and await completion using the cancelUnstake method
   *
   * @param params - The cancel unstake parameters including requestId
   * @param spokeProvider - The spoke provider for the source chain
   * @param raw - Whether to return the raw transaction data (default: false)
   * @returns Promise<Result<TxReturnType<S, R>> & { data?: { address: string; payload: Hex } }>
   */
  async createCancelUnstakeIntent<K extends SpokeChainKey, Raw extends boolean>(
    _params: CancelUnstakeAction<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>> & RelayOptionalExtraData> {
    const { params } = _params;
    try {
      const hubWallet = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        params.srcChainKey,
        this.hubProvider,
      );

      const data = await this.buildCancelUnstakeData(params, hubWallet);

      const coreParams = {
        srcAddress: params.srcAddress as GetAddressType<K>,
        srcChainKey: params.srcChainKey,
        dstChainKey: this.hubProvider.chainConfig.chain.key,
        dstAddress: hubWallet,
        payload: data,
      } as const;

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
        console.error(txResult.error);
        return txResult;
      }

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, Raw> as TxReturnType<K, Raw>,
        data: {
          address: hubWallet,
          payload: data,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Build cancel unstake data for cancelling an unstake request
   * @param params - The cancel unstake parameters
   * @param hubWallet - The hub wallet address
   * @returns Promise<Hex> - The encoded contract call data
   */
  public async buildCancelUnstakeData<K extends SpokeChainKey>(
    params: CancelUnstakeParams<K>,
    hubWallet: Address,
  ): Promise<Hex> {
    const hubConfig = this.config.getHubChainConfig();
    const stakedSoda = hubConfig.addresses.stakedSoda;
    const xSoda = hubConfig.addresses.xSoda;

    // Fetch the unstake request to get the amount
    const unstakeRequests = await StakingLogic.getUnstakeSodaRequests(
      stakedSoda,
      hubWallet,
      this.hubProvider.publicClient,
    );

    const request = unstakeRequests.find(req => req.id === params.requestId);
    if (!request) {
      throw new Error(`Unstake request with ID ${params.requestId} not found`);
    }

    const amount = request.request.amount;

    const calls: EvmContractCall[] = [];
    calls.push(StakingLogic.encodeCancelUnstakeRequest(stakedSoda, params.requestId));
    calls.push(Erc20Service.encodeApprove(stakedSoda, xSoda, amount));
    calls.push(StakingLogic.encodeXSodaDeposit(xSoda, amount, hubWallet));
    return encodeContractCalls(calls);
  }

  /**
   * Get comprehensive staking information for a user using spoke provider
   * @param spokeProvider - The spoke provider
   * @returns Promise<Result<StakingInfo>>
   */
  public async getStakingInfoFromSpoke<K extends SpokeChainKey>(
    srcAddress: Address,
    srcChainKey: K,
  ): Promise<Result<StakingInfo>> {
    try {
      const hubWallet = await HubService.getUserHubWalletAddress(srcAddress, srcChainKey, this.hubProvider);

      return this.getStakingInfo(hubWallet);
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Get comprehensive staking information for a user
   * @param userAddress - The user's address
   * @returns Promise<Result<StakingInfo>>
   */
  public async getStakingInfo(userAddress: Address): Promise<Result<StakingInfo>> {
    try {
      invariant(userAddress, 'User address is required');

      const hubConfig = this.config.getHubChainConfig();
      const xSoda = hubConfig.addresses.xSoda;

      const [totalUnderlying, userXSodaShares] = await Promise.all([
        StakingLogic.getXSodaTotalAssets(xSoda, this.hubProvider.publicClient), // Get total assets in xSoda vault (total underlying SODA)
        this.getXSodaBalance(xSoda, userAddress), // Get user's raw xSODA shares
      ]);

      // Convert user's xSODA shares to SODA value
      const userXSodaValue = await StakingLogic.convertXSodaSharesToSoda(
        xSoda,
        userXSodaShares,
        this.hubProvider.publicClient,
      );

      return {
        ok: true,
        value: {
          totalStaked: totalUnderlying, // Total SODA staked (same as total underlying)
          totalUnderlying, // Total underlying SODA assets
          userXSodaBalance: userXSodaShares, // User's raw xSODA shares
          userXSodaValue, // User's xSODA value in SODA
          userUnderlying: userXSodaValue, // User's underlying SODA amount
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
   * Get unstaking information for a user
   * @param param - The user's address or spoke provider
   * @returns Promise<Result<UnstakingInfo>>
   */
  public async getUnstakingInfo<K extends SpokeChainKey>(
    srcAddress: Address,
    srcChainKey: K,
  ): Promise<Result<UnstakingInfo>> {
    try {
      const userAddress = await HubService.getUserHubWalletAddress(srcAddress, srcChainKey, this.hubProvider);

      const hubConfig = this.config.getHubChainConfig();
      const stakedSoda = hubConfig.addresses.stakedSoda;

      // Get user's unstake requests
      const userUnstakeSodaRequests = await StakingLogic.getUnstakeSodaRequests(
        stakedSoda,
        userAddress,
        this.hubProvider.publicClient,
      );

      // Calculate total unstaking amount
      const totalUnstaking = userUnstakeSodaRequests.reduce((total, userInfo) => total + userInfo.request.amount, 0n);

      return {
        ok: true,
        value: {
          userUnstakeSodaRequests,
          totalUnstaking,
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
   * Get staking configuration from the stakedSoda contract
   * @returns Promise<Result<StakingConfig>>
   */
  public async getStakingConfig(): Promise<Result<StakingConfig>> {
    try {
      const hubConfig = this.config.getHubChainConfig();
      const stakedSoda = hubConfig.addresses.stakedSoda;

      // Read all configuration values in a single contract call
      const [unstakingPeriod, minUnstakingPeriod, maxPenalty] = await this.hubProvider.publicClient.readContract({
        address: stakedSoda,
        abi: stakedSodaAbi,
        functionName: 'getParameters',
      });

      return {
        ok: true,
        value: {
          unstakingPeriod: unstakingPeriod,
          minUnstakingPeriod: minUnstakingPeriod,
          maxPenalty: maxPenalty,
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
   * Calculate penalty for an unstake request based on the contract logic
   * @param startTime - The start time of the unstake request
   * @param config - The staking configuration
   * @returns The penalty amount and percentage
   */
  private calculatePenalty(startTime: bigint, config: StakingConfig): { penalty: bigint; penaltyPercentage: number } {
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    const timeElapsed = currentTime - startTime;

    // Check if unstaking period is less than minimum
    if (timeElapsed < config.minUnstakingPeriod) {
      // Return max penalty if still in minimum period
      return {
        penalty: (config.maxPenalty * 100n) / 100n, // Convert percentage to basis points
        penaltyPercentage: Number(config.maxPenalty),
      };
    }

    // If time elapsed is greater than or equal to unstaking period, no penalty
    if (timeElapsed >= config.unstakingPeriod) {
      return {
        penalty: 0n,
        penaltyPercentage: 0,
      };
    }

    // Calculate penalty based on time in reduction period
    const timeInReductionPeriod = timeElapsed - config.minUnstakingPeriod;
    const totalReductionPeriod = config.unstakingPeriod - config.minUnstakingPeriod;

    // Calculate penalty: (maxPenalty * (totalReductionPeriod - timeInReductionPeriod)) / totalReductionPeriod
    const penalty = (config.maxPenalty * (totalReductionPeriod - timeInReductionPeriod)) / totalReductionPeriod;

    return {
      penalty: (penalty * 100n) / 100n, // Convert percentage to basis points
      penaltyPercentage: Number(penalty),
    };
  }

  /**
   * Get unstaking information with penalty calculations
   * @param param - The user's address or spoke provider
   * @returns Promise<Result<UnstakingInfo & { requestsWithPenalty: UnstakeRequestWithPenalty[] }>>
   */
  public async getUnstakingInfoWithPenalty<K extends SpokeChainKey>(
    srcAddress: Address,
    srcChainKey: K,
  ): Promise<Result<UnstakingInfo & { requestsWithPenalty: UnstakeRequestWithPenalty[] }>> {
    try {
      const [unstakingResult, configResult] = await Promise.all([
        this.getUnstakingInfo(srcAddress, srcChainKey),
        this.getStakingConfig(),
      ]);

      if (!unstakingResult.ok) {
        return unstakingResult;
      }

      if (!configResult.ok) return configResult;

      const config = configResult.value;
      const requestsWithPenalty: UnstakeRequestWithPenalty[] = unstakingResult.value.userUnstakeSodaRequests.map(
        userInfo => {
          const penaltyInfo = this.calculatePenalty(userInfo.request.startTime, config);
          const penaltyAmount = (userInfo.request.amount * penaltyInfo.penalty) / 100n; // Convert from basis points
          const claimableAmount = userInfo.request.amount - penaltyAmount;

          return {
            ...userInfo,
            penalty: penaltyAmount,
            penaltyPercentage: penaltyInfo.penaltyPercentage,
            claimableAmount,
          };
        },
      );

      return {
        ok: true,
        value: {
          ...unstakingResult.value,
          requestsWithPenalty,
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
   * Get instant unstake ratio for a given amount
   * @param amount - The amount of xSoda to estimate instant unstake for
   * @returns Promise<Result<bigint>>
   */
  public async getInstantUnstakeRatio(amount: bigint): Promise<Result<bigint>> {
    try {
      const hubConfig = this.config.getHubChainConfig();
      const stakingRouter = hubConfig.addresses.stakingRouter;

      const ratio = await StakingLogic.estimateInstantUnstake(stakingRouter, amount, this.hubProvider.publicClient);

      return {
        ok: true,
        value: ratio,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Get converted assets amount for xSODA shares
   * @param amount - The amount of xSoda shares to convert
   * @returns Promise<Result<bigint>>
   */
  public async getConvertedAssets(amount: bigint): Promise<Result<bigint>> {
    try {
      const hubConfig = this.config.getHubChainConfig();
      const xSoda = hubConfig.addresses.xSoda;

      const convertedAmount = await StakingLogic.convertXSodaSharesToSoda(xSoda, amount, this.hubProvider.publicClient);

      return {
        ok: true,
        value: convertedAmount,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Get stake ratio for a given amount (xSoda amount and preview deposit)
   * @param amount - The amount of SODA to estimate stake for
   * @returns Promise<Result<[bigint, bigint]>>
   */
  public async getStakeRatio(amount: bigint): Promise<Result<[bigint, bigint]>> {
    try {
      const hubConfig = this.config.getHubChainConfig();
      const stakingRouter = hubConfig.addresses.stakingRouter;

      const [xSodaAmount, previewDepositAmount] = await StakingLogic.estimateXSodaAmount(
        stakingRouter,
        amount,
        this.hubProvider.publicClient,
      );

      return {
        ok: true,
        value: [xSodaAmount, previewDepositAmount],
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Helper method to get xSoda balance for a user
   * @param xSoda - The xSoda token contract address
   * @param userAddress - The user's address
   * @returns Promise<bigint>
   */
  private async getXSodaBalance(xSoda: Address, userAddress: Address): Promise<bigint> {
    return this.hubProvider.publicClient.readContract({
      address: xSoda,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    });
  }
}
