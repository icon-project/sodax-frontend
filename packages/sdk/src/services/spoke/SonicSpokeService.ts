import { type Address, decodeAbiParameters, encodeFunctionData, erc20Abi } from 'viem';
import { sonicWalletFactoryAbi } from '../../abis/sonicWalletFactory.abi.js';
import { variableDebtTokenAbi } from '../../abis/variableDebtToken.abi.js';
import { wrappedSonicAbi } from '../../abis/wrappedSonic.abi.js';
import type { SonicSpokeProvider } from '../../entities/index.js';
import type { EvmContractCall, EvmReturnType, PromiseEvmTxReturnType } from '../../types.js';
import { Erc20Service } from '../index.js';
import type { MoneyMarketService } from '../moneyMarket/MoneyMarketService.js';
import { getHubAssetInfo } from '../../constants.js';
import { encodeContractCalls } from '../../utils/evm-utils.js';
import type { Hex, HubAddress, SpokeChainId } from '@sodax/types';

export type SonicSpokeDepositParams = {
  from: Address; // The address of the user on the spoke chain
  to?: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: Address; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit (encoded calls array)
};

export type WithdrawInfo = {
  aTokenAddress: Address;
  aTokenAmount: bigint;
  token: Address;
};

export type BorrowInfo = {
  variableDebtTokenAddress: Address;
  vaultAddress: Address;
};

export class SonicSpokeService {
  private constructor() {}

  /**
   * Get the derived address of a contract deployed with CREATE3.
   * @param address User's address on the specified chain as hex
   * @param provider Spoke provider
   * @returns The computed contract address as a EVM address (hex) string
   */
  public static async getUserRouter(address: Address, provider: SonicSpokeProvider): Promise<HubAddress> {
    return provider.publicClient.readContract({
      address: provider.chainConfig.addresses.walletRouter,
      abi: sonicWalletFactoryAbi,
      functionName: 'getDeployedAddress',
      args: [address],
    });
  }

  /**
   * Deposit tokens to the spoke chain using the Sonic wallet abstraction.
   * @param {SonicSpokeDepositParams} params - The parameters for the deposit
   * @param {SonicSpokeProvider} spokeProvider - The provider for the spoke chain
   * @returns {PromiseEvmTxReturnType<R>} A promise that resolves to the transaction hash
   */
  public static async deposit<R extends boolean = false>(
    params: SonicSpokeDepositParams,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const userHubAddress = params.to ?? (await SonicSpokeService.getUserRouter(params.from, spokeProvider));

    // Decode the data field which contains the encoded calls array
    const calls = Array.from(decodeAbiParameters(
      [
        {
          name: 'calls',
          type: 'tuple[]',
          components: [
            { name: 'address', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
          ],
        },
      ],
      params.data,
    )[0] satisfies readonly EvmContractCall[]);

    if (params.token === spokeProvider.chainConfig.nativeToken) {
      // Add a call to wrap the native token
      const wrapCall = {
        address: spokeProvider.chainConfig.addresses.wrappedSonic,
        value: params.amount,
        data: encodeFunctionData({
          abi: wrappedSonicAbi,
          functionName: 'deposit',
        }),
      } satisfies EvmContractCall;
      calls.unshift(wrapCall);
    } else {
      const transferFromCall = Erc20Service.encodeTransferFrom(params.token, params.from, userHubAddress, params.amount);
      calls.unshift(transferFromCall);
    }

    const txData = encodeFunctionData({
      abi: sonicWalletFactoryAbi,
      functionName: 'route',
      args: [
        calls.map(call => ({
          addr: call.address,
          value: call.value,
          data: call.data,
        })),
      ],
    });

    const rawTx = {
      from: params.from,
      to: spokeProvider.chainConfig.addresses.walletRouter,
      data: txData,
      value: params.token === spokeProvider.chainConfig.nativeToken ? params.amount : 0n,
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

    /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {SonicSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
    public static async getDeposit(token: Address, spokeProvider: SonicSpokeProvider): Promise<bigint> {
      return spokeProvider.publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [token],
      });
    }

  /**
   * Execute a batch of contract calls through the Sonic wallet contract.
   * @param {Hex} payload - The encoded payload containing the calls array
   * @param {SonicSpokeProvider} spokeProvider - The provider for the spoke chain
   * @returns {PromiseEvmTxReturnType<R>} A promise that resolves to the transaction hash
   */
  public static async callWallet<R extends boolean = false>(
    payload: Hex,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    // Decode the payload which contains the encoded calls array
    const calls = decodeAbiParameters(
      [
        {
          name: 'calls',
          type: 'tuple[]',
          components: [
            { name: 'address', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
          ],
        },
      ],
      payload,
    )[0] satisfies readonly EvmContractCall[];

    const txData = encodeFunctionData({
      abi: sonicWalletFactoryAbi,
      functionName: 'route',
      args: [
        calls.map(call => ({
          addr: call.address,
          value: call.value,
          data: call.data,
        })),
      ],
    });

    const rawTx = {
      from: await spokeProvider.walletProvider.getWalletAddress(),
      to: spokeProvider.chainConfig.addresses.walletRouter,
      data: txData,
      value: 0n,
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Get withdraw information for a given token
   * @param token The address of the underlying token
   * @param amount The amount to withdraw
   * @param spokeProvider The spoke provider
   * @param moneyMarketService The money market service
   * @returns WithdrawInfo containing aToken address, amount and vault address
   */
  public static async getWithdrawInfo(
    token: Address,
    amount: bigint,
    spokeProvider: SonicSpokeProvider,
    moneyMarketService: MoneyMarketService,
  ): Promise<WithdrawInfo> {
    const assetConfig = getHubAssetInfo(spokeProvider.chainConfig.chain.id, token);

    if (!assetConfig) {
      throw new Error('[SonicSpokeService.getWithdrawInfo] Hub asset not found');
    }

    const vaultAddress = assetConfig.vault;
    const reserveData = await moneyMarketService.getReserveData(moneyMarketService.config.lendingPool, vaultAddress);
    const aTokenAddress = reserveData.aTokenAddress;
    const aTokenAmount = await moneyMarketService.calculateATokenAmount(
      moneyMarketService.config.lendingPool,
      amount,
      vaultAddress,
    );

    return {
      aTokenAddress,
      aTokenAmount,
      token,
    };
  }

  /**
   * Get borrow information for a given token
   * @param token The address of the underlying token
   * @param spokeProvider The spoke provider
   * @param moneyMarketService The money market service
   * @returns BorrowInfo containing variable debt token address and vault address
   */
  public static async getBorrowInfo(
    token: Address,
    chainId: SpokeChainId,
    moneyMarketService: MoneyMarketService,
  ): Promise<BorrowInfo> {
    const assetConfig = getHubAssetInfo(chainId, token);

    if (!assetConfig) {
      throw new Error('[SonicSpokeService.getBorrowInfo] Hub asset not found');
    }

    const vaultAddress = assetConfig?.vault as Address;
    const reserveData = await moneyMarketService.getReserveData(moneyMarketService.config.lendingPool, vaultAddress);
    const variableDebtTokenAddress = reserveData.variableDebtTokenAddress;

    return {
      variableDebtTokenAddress,
      vaultAddress,
    };
  }

  public static async approveWithdraw<R extends boolean = false>(
    from: Address,
    withdrawInfo: WithdrawInfo,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const userRouter = await SonicSpokeService.getUserRouter(from, spokeProvider);

    const txData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [userRouter, withdrawInfo.aTokenAmount],
    });

    const rawTx = {
      from: await spokeProvider.walletProvider.getWalletAddress(),
      to: withdrawInfo.aTokenAddress,
      data: txData,
      value: 0n,
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  public static async approveBorrow<R extends boolean = false>(
    from: Address,
    borrowInfo: BorrowInfo,
    amount: bigint,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const userRouter = await SonicSpokeService.getUserRouter(from, spokeProvider);

    const txData = encodeFunctionData({
      abi: variableDebtTokenAbi,
      functionName: 'approveDelegation',
      args: [userRouter, amount],
    });

    const rawTx = {
      from: await spokeProvider.walletProvider.getWalletAddress(),
      to: borrowInfo.variableDebtTokenAddress,
      data: txData,
      value: 0n,
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  public static async withdrawData(
    from: Address,
    withdrawInfo: WithdrawInfo,
    amount: bigint,
    spokeProvider: SonicSpokeProvider,
    moneyMarketService: MoneyMarketService,
  ): Promise<Hex> {
    const userRouter = await SonicSpokeService.getUserRouter(from, spokeProvider);

    // Add withdraw call
    const withdrawCall = moneyMarketService.withdrawData(
      userRouter,
      from,
      withdrawInfo.token,
      amount,
      spokeProvider.chainConfig.chain.id,
    );
    const calls = decodeAbiParameters(
      [
        {
          name: 'calls',
          type: 'tuple[]',
          components: [
            { name: 'address', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
          ],
        },
      ],
      withdrawCall,
    )[0] as {
      address: Address;
      value: bigint;
      data: `0x${string}`;
    }[];

    const transferFromCall = Erc20Service.encodeTransferFrom(
      withdrawInfo.aTokenAddress,
      from,
      userRouter,
      withdrawInfo.aTokenAmount,
    );
    calls.unshift({
      address: transferFromCall.address,
      value: transferFromCall.value,
      data: transferFromCall.data,
    });

    return encodeContractCalls(calls);
  }
}