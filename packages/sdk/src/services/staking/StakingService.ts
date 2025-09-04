// packages/sdk/src/services/staking/StakingService.ts
import invariant from 'tiny-invariant';
import { erc20Abi, type Address } from 'viem';
import { StakingLogic } from './StakingLogic.js';
import type {
  UnstakeSodaRequest,
  EvmContractCall,
  TxReturnType,
  GetSpokeDepositParamsType,
  HttpUrl,
  Prettify,
} from '../../types.js';
import {
  encodeContractCalls,
  Erc20Service,
  relayTxAndWaitPacket,
  SolanaSpokeProvider,
  SpokeService,
  WalletAbstractionService,
  type EvmHubProvider,
  type SpokeProvider,
} from '../../index.js';
import type { Hex } from 'viem';
import { DEFAULT_RELAY_TX_TIMEOUT, getHubChainConfig } from '../../constants.js';
import type { Result } from '../../types.js';

export type StakeParams = {
  amount: bigint;
  account: Address;
  srcAsset: Address; // SODA token address
};

export type UnstakeParams = {
  amount: bigint;
  account: Address;
};

export type ClaimParams = {
  requestId: bigint;
};

export type WithdrawParams = {
  amount: bigint;
  account: Address;
};

export type StakingInfo = {
  totalStaked: bigint;
  userStaked: bigint;
  userXSodaBalance: bigint;
};

export type UnstakingInfo = {
  userUnstakeSodaRequests: readonly UnstakeSodaRequest[];
  totalUnstaking: bigint;
};

export type StakingErrorCode =
  | 'STAKE_FAILED'
  | 'UNSTAKE_FAILED'
  | 'CLAIM_FAILED'
  | 'WITHDRAW_FAILED'
  | 'INFO_FETCH_FAILED';

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
   * Execute stake transaction for staking SODA tokens to receive xSoda shares
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
   * @param params - The stake parameters including amount, account, and source asset
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
      const hubWallet = await WalletAbstractionService.getUserAbstractedWalletAddress(
        walletAddress,
        spokeProvider,
        this.hubProvider,
      );

      const data: Hex = this.buildStakeData(params);

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

  public buildStakeData(params: StakeParams): Hex {
    const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
    const sodaToken = hubConfig.addresses.sodaToken;
    const stakedSoda = hubConfig.addresses.stakedSoda;
    const xSoda = hubConfig.addresses.xSoda;
    const calls: EvmContractCall[] = [];
    calls.push(Erc20Service.encodeApprove(sodaToken, stakedSoda, params.amount));
    calls.push(StakingLogic.encodeDepositFor(stakedSoda, params.account, params.amount));
    calls.push(Erc20Service.encodeApprove(stakedSoda, xSoda, params.amount));
    calls.push(StakingLogic.encodeXSodaDeposit(xSoda, params.amount, params.account));
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

      const data: Hex = this.buildUnstakeData(params);

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

  public buildUnstakeData(params: UnstakeParams): Hex {
    const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
    const stakedSoda = hubConfig.addresses.stakedSoda;
    const xSoda = hubConfig.addresses.xSoda;
    const calls: EvmContractCall[] = [];
    calls.push(Erc20Service.encodeApprove(xSoda, stakedSoda, params.amount));
    calls.push(StakingLogic.encodeUnstake(stakedSoda, params.account, params.amount));
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

      const data: Hex = this.buildClaimData(params);

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

  public buildClaimData(params: ClaimParams): Hex {
    const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
    const stakedSoda = hubConfig.addresses.stakedSoda;
    const calls: EvmContractCall[] = [];
    calls.push(StakingLogic.encodeClaim(stakedSoda, params.requestId));
    return encodeContractCalls(calls);
  }

  /**
   * Execute withdraw transaction for withdrawing xSoda shares to SODA tokens
   * @param params - The withdraw parameters
   * @param spokeProvider - The spoke provider
   * @param timeout - The timeout in milliseconds for the transaction
   * @returns Promise<Result<[SpokeTxHash, HubTxHash], StakingError<'WITHDRAW_FAILED'>>>
   */
  public async withdraw(
    params: WithdrawParams,
    spokeProvider: SpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[string, string], StakingError<'WITHDRAW_FAILED'>>> {
    try {
      const txResult = await this.createWithdrawIntent({ params, spokeProvider, raw: false });

      if (!txResult.ok) {
        return {
          ok: false,
          error: {
            code: 'WITHDRAW_FAILED',
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
            code: 'WITHDRAW_FAILED',
            error: packetResult.error,
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'WITHDRAW_FAILED',
          error: error,
        },
      };
    }
  }

  /**
   * Create withdraw intent only (without relaying to hub)
   * NOTE: This method only executes the transaction on the spoke chain and creates the withdraw intent
   * In order to successfully withdraw tokens, you need to:
   * 1. Check if the allowance is sufficient using isAllowanceValid
   * 2. Approve the appropriate contract to spend the tokens using approve
   * 3. Create the withdraw intent using this method
   * 4. Relay the transaction to the hub and await completion using the withdraw method
   *
   * @param params - The withdraw parameters including amount and account
   * @param spokeProvider - The spoke provider for the source chain
   * @param raw - Whether to return the raw transaction data
   * @returns {Promise<Result<TxReturnType<S, R>, StakingError<'WITHDRAW_FAILED'>>>} - Returns the transaction result
   */
  async createWithdrawIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>({
    params,
    spokeProvider,
    raw,
  }: Prettify<{ params: WithdrawParams; spokeProvider: S; raw?: R }>): Promise<
    Result<TxReturnType<S, R>, StakingError<'WITHDRAW_FAILED'>> & { data?: { address: string; payload: Hex } }
  > {
    try {
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await WalletAbstractionService.getUserAbstractedWalletAddress(
        walletAddress,
        spokeProvider,
        this.hubProvider,
      );

      const data: Hex = this.buildWithdrawData(params);

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
          code: 'WITHDRAW_FAILED',
          error: error,
        },
      };
    }
  }

  public buildWithdrawData(params: WithdrawParams): Hex {
    const hubConfig = getHubChainConfig(this.hubProvider.chainConfig.chain.id);
    const stakedSoda = hubConfig.addresses.stakedSoda;
    const xSoda = hubConfig.addresses.xSoda;
    const calls: EvmContractCall[] = [];
    calls.push(Erc20Service.encodeApprove(xSoda, stakedSoda, params.amount));
    calls.push(StakingLogic.encodeWithdrawTo(stakedSoda, params.account, params.amount));
    return encodeContractCalls(calls);
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

      // Get total assets in xSoda vault
      const totalStaked = await StakingLogic.getXSodaTotalAssets(xSoda, this.hubProvider.publicClient);

      // Get user's xSoda balance
      const userXSodaBalance = await StakingLogic.convertXSodaSharesToSoda(
        xSoda,
        await this.getXSodaBalance(xSoda, userAddress),
        this.hubProvider.publicClient,
      );

      // Get user's staked amount (this would need to be calculated based on xSoda balance)
      const userStaked = userXSodaBalance;

      return {
        ok: true,
        value: {
          totalStaked,
          userStaked,
          userXSodaBalance,
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
      const totalUnstaking = userUnstakeSodaRequests.reduce((total, request) => total + request.amount, 0n);

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
