// packages/sdk/src/services/staking/StakingService.ts
import invariant from 'tiny-invariant';
import { erc20Abi, type Address } from 'viem';
import { StakingLogic } from './StakingLogic.js';
import { stakedSodaAbi } from '../../abis/stakedSoda.abi.js';
import type {
  UserUnstakeInfo,
  EvmContractCall,
  TxReturnType,
  GetSpokeDepositParamsType,
  HttpUrl,
  Prettify,
  GetAddressType,
  HubAssetInfo,
} from '../../types.js';
import {
  getHubAssetInfo,
  encodeContractCalls,
  Erc20Service,
  EvmVaultTokenService,
  relayTxAndWaitPacket,
  SolanaSpokeProvider,
  SpokeService,
  WalletAbstractionService,
  SonicSpokeService,
  SonicSpokeProvider,
  EvmSpokeProvider,
  type EvmHubProvider,
  type SpokeProvider,
  type XToken,
  encodeAddress,
  type SpokeChainId,
  EvmAssetManagerService,
} from '../../index.js';
import type { Hex } from 'viem';
import { DEFAULT_RELAY_TX_TIMEOUT, getHubChainConfig, getIntentRelayChainId } from '../../constants.js';
import type { Result } from '../../types.js';

export type StakeParams = {
  amount: bigint;
  minReceive: bigint;
  account: Address;
};

export type UnstakeParams = {
  amount: bigint;
  account: Address;
};

export type ClaimParams = {
  requestId: bigint;
  amount: bigint; // claimable amount after penalty calculation
};

export type CancelUnstakeParams = {
  requestId: bigint;
};

export type InstantUnstakeParams = {
  amount: bigint;
  minAmount: bigint;
  account: Address;
};

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

export type StakingErrorCode =
  | 'STAKE_FAILED'
  | 'UNSTAKE_FAILED'
  | 'INSTANT_UNSTAKE_FAILED'
  | 'CLAIM_FAILED'
  | 'CANCEL_UNSTAKE_FAILED'
  | 'INFO_FETCH_FAILED'
  | 'ALLOWANCE_CHECK_FAILED'
  | 'APPROVAL_FAILED';

export type StakingError<T extends StakingErrorCode> = {
  code: T;
  error: unknown;
};

/**
 * StakingService provides a high-level interface for staking operations
 * including staking SODA tokens, unstaking, claiming rewards, and retrieving staking information.
 * All transaction methods return encoded contract calls that can be sent via a wallet provider.
 */
export class StakingService {
  private readonly hubProvider: EvmHubProvider;
  private readonly relayerApiEndpoint: HttpUrl;
  constructor(hubProvider: EvmHubProvider, relayerApiEndpoint: HttpUrl) {
    this.hubProvider = hubProvider;
    this.relayerApiEndpoint = relayerApiEndpoint;
  }

  /**
   * Check if allowance is valid for the stake transaction
   * @param params - The staking parameters
   * @param spokeProvider - The spoke provider
   * @returns {Promise<Result<boolean, StakingError<'ALLOWANCE_CHECK_FAILED'>>>}
   */
  public async isAllowanceValid<S extends SpokeProvider>({
    params,
    spokeProvider,
  }: Prettify<{ params: StakeParams; spokeProvider: S }>): Promise<
    Result<boolean, StakingError<'ALLOWANCE_CHECK_FAILED'>>
  > {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const sodaToken = spokeProvider.chainConfig.supportedTokens.SODA as XToken;
      invariant(sodaToken, 'SODA token not found');

      // For regular EVM chains (non-Sonic), check ERC20 allowance against assetManager
      if (spokeProvider instanceof EvmSpokeProvider) {
        const allowanceResult = await Erc20Service.isAllowanceValid(
          sodaToken.address as `0x${string}`,
          params.amount,
          walletAddress as GetAddressType<EvmSpokeProvider>,
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

      // For Sonic chain, check ERC20 allowance against userRouter
      if (spokeProvider instanceof SonicSpokeProvider) {
        const userRouter = await SonicSpokeService.getUserRouter(walletAddress as `0x${string}`, spokeProvider);

        const allowanceResult = await Erc20Service.isAllowanceValid(
          sodaToken.address as `0x${string}`,
          params.amount,
          walletAddress as GetAddressType<SonicSpokeProvider>,
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
   * Approve token spending for the stake transaction
   * @param params - The staking parameters
   * @param spokeProvider - The spoke provider
   * @param raw - Whether to return raw transaction data
   * @returns Promise<Result<TxReturnType<S, R>, StakingError<'APPROVAL_FAILED'>>>
   */
  public async approve<S extends SpokeProvider, R extends boolean = false>({
    params,
    spokeProvider,
    raw,
  }: Prettify<{ params: StakeParams; spokeProvider: S; raw?: R }>): Promise<
    Result<TxReturnType<S, R>, StakingError<'APPROVAL_FAILED'>>
  > {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const sodaToken = spokeProvider.chainConfig.supportedTokens.SODA as XToken;
      invariant(sodaToken, 'SODA token not found');

      // For regular EVM chains (non-Sonic), approve against assetManager
      if (spokeProvider instanceof EvmSpokeProvider) {
        const result = await Erc20Service.approve(
          sodaToken.address as `0x${string}`,
          params.amount,
          spokeProvider.chainConfig.addresses.assetManager,
          spokeProvider,
          raw,
        );

        return {
          ok: true,
          value: result as TxReturnType<S, R>,
        };
      }

      // For Sonic chain, approve against userRouter
      if (spokeProvider instanceof SonicSpokeProvider) {
        const userRouter = await SonicSpokeService.getUserRouter(
          walletAddress as GetAddressType<SonicSpokeProvider>,
          spokeProvider,
        );

        const result = await Erc20Service.approve(
          sodaToken.address as `0x${string}`,
          params.amount,
          userRouter,
          spokeProvider,
          raw,
        );

        return {
          ok: true,
          value: result as TxReturnType<S, R>,
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
   * Execute stake transaction for staking SODA tokens to receive xSoda shares
   * NOTE: For EVM chains, you may need to approve token spending first using the approve method
   * @param params - The staking parameters
   * @param spokeProvider - The spoke provider
   * @param timeout - The timeout in milliseconds for the transaction
   * @returns Promise<Result<[SpokeTxHash, HubTxHash], StakingError<'STAKE_FAILED'>>>
   */
  public async stake(
    params: StakeParams,
    spokeProvider: SpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[string, string], StakingError<'STAKE_FAILED'>>> {
    try {
      const txResult = await this.createStakeIntent({ params, spokeProvider, raw: false });

      if (!txResult.ok) {
        return {
          ok: false,
          error: {
            code: 'STAKE_FAILED',
            error: txResult.error,
          },
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider
          ? (txResult.data as { address: `0x${string}`; payload: `0x${string}` })
          : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return {
          ok: false,
          error: {
            code: 'STAKE_FAILED',
            error: packetResult.error,
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'STAKE_FAILED',
          error: error,
        },
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
   * @param raw - Whether to return the raw transaction data
   * @returns {Promise<Result<TxReturnType<S, R>, StakingError<'STAKE_FAILED'>>>} - Returns the transaction result
   */
  async createStakeIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>({
    params,
    spokeProvider,
    raw,
  }: Prettify<{ params: StakeParams; spokeProvider: S; raw?: R }>): Promise<
    Result<TxReturnType<S, R>, StakingError<'STAKE_FAILED'>> & { data?: { address: string; payload: Hex } }
  > {
    try {
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const sodaToken = spokeProvider.chainConfig.supportedTokens.SODA as XToken;
      invariant(sodaToken, 'SODA token not found');
      const sodaAsset = getHubAssetInfo(spokeProvider.chainConfig.chain.id, sodaToken.address);
      invariant(sodaAsset, 'SODA asset not found');

      const hubWallet = await WalletAbstractionService.getUserAbstractedWalletAddress(
        walletAddress,
        spokeProvider,
        this.hubProvider,
      );

      let to = hubWallet;
      if (spokeProvider.chainConfig.chain.id === this.hubProvider.chainConfig.chain.id) {
        to = walletAddress as Address;
      }

      const data: Hex = this.buildStakeData(sodaAsset, to, params);

      const txResult = await SpokeService.deposit(
        {
          from: walletAddress,
          to: hubWallet,
          token: sodaToken.address,
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
          address: hubWallet as `0x${string}`,
          payload: data,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: {
          code: 'STAKE_FAILED',
          error: error,
        },
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
  public buildStakeData(sodaAsset: HubAssetInfo, to: Address, params: StakeParams): Hex {
    const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
    const sodaVault = sodaAsset.vault;
    const stakingRouter = hubConfig.addresses.stakingRouter;

    const calls: EvmContractCall[] = [];
    calls.push(Erc20Service.encodeApprove(sodaAsset.asset, sodaVault, params.amount));
    calls.push(EvmVaultTokenService.encodeDeposit(sodaVault, sodaAsset.asset, params.amount));
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(sodaAsset.decimal, params.amount);
    calls.push(Erc20Service.encodeApprove(sodaVault, stakingRouter, translatedAmount));
    calls.push(StakingLogic.encodeStakingRouterStake(stakingRouter, translatedAmount, to, params.minReceive));
    return encodeContractCalls(calls);
  }

  /**
   * Execute unstake transaction for unstaking xSoda shares
   * @param params - The unstaking parameters
   * @param spokeProvider - The spoke provider
   * @param timeout - The timeout in milliseconds for the transaction
   * @returns Promise<Result<[SpokeTxHash, HubTxHash], StakingError<'UNSTAKE_FAILED'>>>
   */
  public async unstake(
    params: UnstakeParams,
    spokeProvider: SpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[string, string], StakingError<'UNSTAKE_FAILED'>>> {
    try {
      const txResult = await this.createUnstakeIntent({ params, spokeProvider, raw: false });

      if (!txResult.ok) {
        return {
          ok: false,
          error: {
            code: 'UNSTAKE_FAILED',
            error: txResult.error,
          },
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider
          ? (txResult.data as { address: `0x${string}`; payload: `0x${string}` })
          : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return {
          ok: false,
          error: {
            code: 'UNSTAKE_FAILED',
            error: packetResult.error,
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'UNSTAKE_FAILED',
          error: error,
        },
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
   * @param raw - Whether to return the raw transaction data
   * @returns {Promise<Result<TxReturnType<S, R>, StakingError<'UNSTAKE_FAILED'>>>} - Returns the transaction result
   */
  async createUnstakeIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>({
    params,
    spokeProvider,
    raw,
  }: Prettify<{ params: UnstakeParams; spokeProvider: S; raw?: R }>): Promise<
    Result<TxReturnType<S, R>, StakingError<'UNSTAKE_FAILED'>> & { data?: { address: string; payload: Hex } }
  > {
    try {
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await WalletAbstractionService.getUserAbstractedWalletAddress(
        walletAddress,
        spokeProvider,
        this.hubProvider,
      );

      const data: Hex = this.buildUnstakeData(hubWallet, params);

      const txResult = await SpokeService.callWallet(hubWallet, data, spokeProvider, this.hubProvider, raw);

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
        data: {
          address: hubWallet as `0x${string}`,
          payload: data,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: {
          code: 'UNSTAKE_FAILED',
          error: error,
        },
      };
    }
  }

  public buildUnstakeData(hubWallet: Address, params: UnstakeParams): Hex {
    const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
    const stakedSoda = hubConfig.addresses.stakedSoda;
    const xSoda = hubConfig.addresses.xSoda;
    const calls: EvmContractCall[] = [];
    calls.push(StakingLogic.encodeXSodaRedeem(xSoda, params.amount, hubWallet, hubWallet));
    calls.push(StakingLogic.encodeUnstake(stakedSoda, hubWallet, params.amount));
    return encodeContractCalls(calls);
  }

  /**
   * Execute instant unstake transaction for instantly unstaking xSoda shares
   * @param params - The instant unstaking parameters
   * @param spokeProvider - The spoke provider
   * @param timeout - The timeout in milliseconds for the transaction
   * @returns Promise<Result<[SpokeTxHash, HubTxHash], StakingError<'INSTANT_UNSTAKE_FAILED'>>>
   */
  public async instantUnstake(
    params: InstantUnstakeParams,
    spokeProvider: SpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[string, string], StakingError<'INSTANT_UNSTAKE_FAILED'>>> {
    try {
      const txResult = await this.createInstantUnstakeIntent({ params, spokeProvider, raw: false });

      if (!txResult.ok) {
        return {
          ok: false,
          error: {
            code: 'INSTANT_UNSTAKE_FAILED',
            error: txResult.error,
          },
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider
          ? (txResult.data as { address: `0x${string}`; payload: `0x${string}` })
          : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return {
          ok: false,
          error: {
            code: 'INSTANT_UNSTAKE_FAILED',
            error: packetResult.error,
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INSTANT_UNSTAKE_FAILED',
          error: error,
        },
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
   * @param raw - Whether to return the raw transaction data
   * @returns {Promise<Result<TxReturnType<S, R>, StakingError<'INSTANT_UNSTAKE_FAILED'>>>} - Returns the transaction result
   */
  async createInstantUnstakeIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>({
    params,
    spokeProvider,
    raw,
  }: Prettify<{ params: InstantUnstakeParams; spokeProvider: S; raw?: R }>): Promise<
    Result<TxReturnType<S, R>, StakingError<'INSTANT_UNSTAKE_FAILED'>> & { data?: { address: string; payload: Hex } }
  > {
    try {
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await WalletAbstractionService.getUserAbstractedWalletAddress(
        walletAddress,
        spokeProvider,
        this.hubProvider,
      );

      const sodaToken = spokeProvider.chainConfig.supportedTokens.SODA as XToken;
      invariant(sodaToken, 'SODA token not found');
      const sodaAsset = getHubAssetInfo(spokeProvider.chainConfig.chain.id, sodaToken.address);
      invariant(sodaAsset, 'SODA asset not found');

      const data: Hex = this.buildInstantUnstakeData(
        sodaAsset,
        spokeProvider.chainConfig.chain.id,
        encodeAddress(spokeProvider.chainConfig.chain.id, walletAddress),
        params,
      );

      const txResult = await SpokeService.callWallet(hubWallet, data, spokeProvider, this.hubProvider, raw);

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
        data: {
          address: hubWallet as `0x${string}`,
          payload: data,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: {
          code: 'INSTANT_UNSTAKE_FAILED',
          error: error,
        },
      };
    }
  }

  public buildInstantUnstakeData(
    sodaAsset: HubAssetInfo,
    dstChainId: SpokeChainId,
    dstWallet: Hex,
    params: InstantUnstakeParams,
  ): Hex {
    const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
    const stakingRouter = hubConfig.addresses.stakingRouter;
    const xSoda = hubConfig.addresses.xSoda;

    const calls: EvmContractCall[] = [];
    calls.push(Erc20Service.encodeApprove(xSoda, stakingRouter, params.amount));
    calls.push(
      StakingLogic.encodeStakingRouterUnstake(
        stakingRouter,
        params.amount,
        params.minAmount,
        sodaAsset.asset,
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
   * @param timeout - The timeout in milliseconds for the transaction
   * @returns Promise<Result<[SpokeTxHash, HubTxHash], StakingError<'CLAIM_FAILED'>>>
   */
  public async claim(
    params: ClaimParams,
    spokeProvider: SpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[string, string], StakingError<'CLAIM_FAILED'>>> {
    try {
      const txResult = await this.createClaimIntent({ params, spokeProvider, raw: false });

      if (!txResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CLAIM_FAILED',
            error: txResult.error,
          },
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider
          ? (txResult.data as { address: `0x${string}`; payload: `0x${string}` })
          : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CLAIM_FAILED',
            error: packetResult.error,
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CLAIM_FAILED',
          error: error,
        },
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
   * @param raw - Whether to return the raw transaction data
   * @returns {Promise<Result<TxReturnType<S, R>, StakingError<'CLAIM_FAILED'>>>} - Returns the transaction result
   */
  async createClaimIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>({
    params,
    spokeProvider,
    raw,
  }: Prettify<{ params: ClaimParams; spokeProvider: S; raw?: R }>): Promise<
    Result<TxReturnType<S, R>, StakingError<'CLAIM_FAILED'>> & { data?: { address: string; payload: Hex } }
  > {
    try {
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await WalletAbstractionService.getUserAbstractedWalletAddress(
        walletAddress,
        spokeProvider,
        this.hubProvider,
      );

      const sodaToken = spokeProvider.chainConfig.supportedTokens.SODA as XToken;
      invariant(sodaToken, 'SODA token not found');
      const sodaAsset = getHubAssetInfo(spokeProvider.chainConfig.chain.id, sodaToken.address);
      invariant(sodaAsset, 'SODA asset not found');

      const data: Hex = this.buildClaimData(
        sodaAsset,
        spokeProvider.chainConfig.chain.id,
        encodeAddress(spokeProvider.chainConfig.chain.id, walletAddress),
        params,
      );

      const txResult = await SpokeService.callWallet(hubWallet, data, spokeProvider, this.hubProvider, raw);

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
        data: {
          address: hubWallet as `0x${string}`,
          payload: data,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: {
          code: 'CLAIM_FAILED',
          error: error,
        },
      };
    }
  }

  public buildClaimData(sodaAsset: HubAssetInfo, dstChainId: SpokeChainId, dstWallet: Hex, params: ClaimParams): Hex {
    const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
    const stakedSoda = hubConfig.addresses.stakedSoda;
    const sodaVault = sodaAsset.vault;
    const calls: EvmContractCall[] = [];
    calls.push(StakingLogic.encodeClaim(stakedSoda, params.requestId));
    // Transfer the claimable amount to the destination wallet
    calls.push(EvmVaultTokenService.encodeWithdraw(sodaVault, sodaAsset.asset, params.amount));
    const translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(sodaAsset.decimal, params.amount);

    if (dstChainId === this.hubProvider.chainConfig.chain.id) {
      calls.push(Erc20Service.encodeTransfer(sodaAsset.asset, dstWallet, translatedAmountOut));
    } else {
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          sodaAsset.asset,
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
   * @param timeout - The timeout in milliseconds for the transaction
   * @returns Promise<Result<[SpokeTxHash, HubTxHash], StakingError<'CANCEL_UNSTAKE_FAILED'>>>
   */
  public async cancelUnstake(
    params: CancelUnstakeParams,
    spokeProvider: SpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[string, string], StakingError<'CANCEL_UNSTAKE_FAILED'>>> {
    try {
      const txResult = await this.createCancelUnstakeIntent({ params, spokeProvider, raw: false });

      if (!txResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CANCEL_UNSTAKE_FAILED',
            error: txResult.error,
          },
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider
          ? (txResult.data as { address: `0x${string}`; payload: `0x${string}` })
          : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CANCEL_UNSTAKE_FAILED',
            error: packetResult.error,
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CANCEL_UNSTAKE_FAILED',
          error: error,
        },
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
   * @param raw - Whether to return the raw transaction data
   * @returns {Promise<Result<TxReturnType<S, R>, StakingError<'CANCEL_UNSTAKE_FAILED'>>>} - Returns the transaction result
   */
  async createCancelUnstakeIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>({
    params,
    spokeProvider,
    raw,
  }: Prettify<{ params: CancelUnstakeParams; spokeProvider: S; raw?: R }>): Promise<
    Result<TxReturnType<S, R>, StakingError<'CANCEL_UNSTAKE_FAILED'>> & { data?: { address: string; payload: Hex } }
  > {
    try {
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      let hubWallet: Address;
      if (spokeProvider instanceof SonicSpokeProvider) {
        hubWallet = walletAddress as `0x${string}`;
      } else {
        hubWallet = await WalletAbstractionService.getUserAbstractedWalletAddress(
          walletAddress,
          spokeProvider,
          this.hubProvider,
        );
      }

      const data: Hex = await this.buildCancelUnstakeData(params, hubWallet);

      const txResult = await SpokeService.callWallet(hubWallet, data, spokeProvider, this.hubProvider, raw);

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
        data: {
          address: hubWallet as `0x${string}`,
          payload: data,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: {
          code: 'CANCEL_UNSTAKE_FAILED',
          error: error,
        },
      };
    }
  }

  public async buildCancelUnstakeData(params: CancelUnstakeParams, hubWallet: Address): Promise<Hex> {
    const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
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
   * @returns Promise<Result<StakingInfo, StakingError<'INFO_FETCH_FAILED'>>>
   */
  public async getStakingInfoFromSpoke(
    spokeProvider: SpokeProvider,
  ): Promise<Result<StakingInfo, StakingError<'INFO_FETCH_FAILED'>>> {
    try {
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      if (spokeProvider instanceof SonicSpokeProvider) {
        return this.getStakingInfo(walletAddress as `0x${string}`);
      }
      const hubWallet = await WalletAbstractionService.getUserAbstractedWalletAddress(
        walletAddress as `0x${string}`,
        spokeProvider,
        this.hubProvider,
      );

      return this.getStakingInfo(hubWallet);
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INFO_FETCH_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Get comprehensive staking information for a user
   * @param userAddress - The user's address
   * @returns Promise<Result<StakingInfo, StakingError<'INFO_FETCH_FAILED'>>>
   */
  public async getStakingInfo(userAddress: Address): Promise<Result<StakingInfo, StakingError<'INFO_FETCH_FAILED'>>> {
    try {
      invariant(userAddress, 'User address is required');

      const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
      const xSoda = hubConfig.addresses.xSoda;

      // Get total assets in xSoda vault (total underlying SODA)
      const totalUnderlying = await StakingLogic.getXSodaTotalAssets(xSoda, this.hubProvider.publicClient);

      // Get user's raw xSODA shares
      const userXSodaShares = await this.getXSodaBalance(xSoda, userAddress);

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
        error: {
          code: 'INFO_FETCH_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Get unstaking information for a user using spoke provider
   * @param spokeProvider - The spoke provider
   * @returns Promise<Result<UnstakingInfo, StakingError<'INFO_FETCH_FAILED'>>>
   */
  public async getUnstakingInfoFromSpoke(
    spokeProvider: SpokeProvider,
  ): Promise<Result<UnstakingInfo, StakingError<'INFO_FETCH_FAILED'>>> {
    try {
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      if (spokeProvider instanceof SonicSpokeProvider) {
        return this.getUnstakingInfo(walletAddress as `0x${string}`);
      }
      const hubWallet = await WalletAbstractionService.getUserAbstractedWalletAddress(
        walletAddress as `0x${string}`,
        spokeProvider,
        this.hubProvider,
      );

      return this.getUnstakingInfo(hubWallet);
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INFO_FETCH_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Get unstaking information for a user
   * @param userAddress - The user's address
   * @returns Promise<Result<UnstakingInfo, StakingError<'INFO_FETCH_FAILED'>>>
   */
  public async getUnstakingInfo(
    userAddress: Address,
  ): Promise<Result<UnstakingInfo, StakingError<'INFO_FETCH_FAILED'>>> {
    try {
      invariant(userAddress, 'User address is required');

      const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
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
        error: {
          code: 'INFO_FETCH_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Get staking configuration from the stakedSoda contract
   * @returns Promise<Result<StakingConfig, StakingError<'INFO_FETCH_FAILED'>>>
   */
  public async getStakingConfig(): Promise<Result<StakingConfig, StakingError<'INFO_FETCH_FAILED'>>> {
    try {
      const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
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
          unstakingPeriod: unstakingPeriod as bigint,
          minUnstakingPeriod: minUnstakingPeriod as bigint,
          maxPenalty: maxPenalty as bigint,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INFO_FETCH_FAILED',
          error: error,
        },
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
   * @param userAddress - The user's address
   * @returns Promise<Result<UnstakingInfo & { requestsWithPenalty: UnstakeRequestWithPenalty[] }, StakingError<'INFO_FETCH_FAILED'>>>
   */
  public async getUnstakingInfoWithPenalty(
    userAddress: Address,
  ): Promise<
    Result<UnstakingInfo & { requestsWithPenalty: UnstakeRequestWithPenalty[] }, StakingError<'INFO_FETCH_FAILED'>>
  > {
    try {
      // Get basic unstaking info
      const unstakingResult = await this.getUnstakingInfo(userAddress);
      if (!unstakingResult.ok) {
        return unstakingResult;
      }

      // Get staking config for penalty calculations
      const configResult = await this.getStakingConfig();
      if (!configResult.ok) {
        return {
          ok: false,
          error: {
            code: 'INFO_FETCH_FAILED',
            error: configResult.error,
          },
        };
      }

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
        error: {
          code: 'INFO_FETCH_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Get instant unstake ratio for a given amount
   * @param amount - The amount of xSoda to estimate instant unstake for
   * @returns Promise<Result<bigint, StakingError<'INFO_FETCH_FAILED'>>>
   */
  public async getInstantUnstakeRatio(amount: bigint): Promise<Result<bigint, StakingError<'INFO_FETCH_FAILED'>>> {
    try {
      const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
      const stakingRouter = hubConfig.addresses.stakingRouter;

      const ratio = await StakingLogic.estimateInstantUnstake(stakingRouter, amount, this.hubProvider.publicClient);

      return {
        ok: true,
        value: ratio,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INFO_FETCH_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Get converted assets amount for xSODA shares
   * @param amount - The amount of xSoda shares to convert
   * @returns Promise<Result<bigint, StakingError<'INFO_FETCH_FAILED'>>>
   */
  public async getConvertedAssets(amount: bigint): Promise<Result<bigint, StakingError<'INFO_FETCH_FAILED'>>> {
    try {
      const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
      const xSoda = hubConfig.addresses.xSoda;

      const convertedAmount = await StakingLogic.convertXSodaSharesToSoda(xSoda, amount, this.hubProvider.publicClient);

      return {
        ok: true,
        value: convertedAmount,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INFO_FETCH_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Get stake ratio for a given amount (xSoda amount and preview deposit)
   * @param amount - The amount of SODA to estimate stake for
   * @returns Promise<Result<[bigint, bigint], StakingError<'INFO_FETCH_FAILED'>>>
   */
  public async getStakeRatio(amount: bigint): Promise<Result<[bigint, bigint], StakingError<'INFO_FETCH_FAILED'>>> {
    try {
      const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
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
        error: {
          code: 'INFO_FETCH_FAILED',
          error: error,
        },
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
