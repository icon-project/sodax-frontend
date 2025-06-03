import { type Address, decodeAbiParameters, encodeFunctionData, erc20Abi } from 'viem';
import { sonicWalletFactoryAbi } from '../../abis/sonicWalletFactory.abi.js';
import { variableDebtTokenAbi } from '../../abis/variableDebtToken.abi.js';
import type { EvmHubProvider, SonicSpokeProvider } from '../../entities/index.js';
import type { EvmRawTransaction, EvmReturnType, Hex, PromiseEvmTxReturnType, TxReturnType } from '../../types.js';
import { Erc20Service } from '../index.js';
import type { MoneyMarketService } from '../moneyMarket/MoneyMarketService.js';
import { hubAssets } from '../../constants.js';

export type SonicSpokeDepositParams = {
  from: Address; // The address of the user on the spoke chain
  token: Address; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit (encoded calls array)
};

export class SonicSpokeService {
  private constructor() {}

  /**
   * Get the derived address of a contract deployed with CREATE3.
   * @param address User's address on the specified chain as hex
   * @param provider Spoke provider
   * @returns The computed contract address as a EVM address (hex) string
   */
  public static async getUserWallet(address: Address, provider: SonicSpokeProvider): Promise<Address> {
    return provider.publicClient.readContract({
      address: provider.chainConfig.addresses.walletRouter as Address,
      abi: sonicWalletFactoryAbi,
      functionName: 'getDeployedAddress',
      args: [address],
    });
  }

  /**
   * Deposit tokens to the spoke chain using the Sonic wallet abstraction.
   * @param {SonicSpokeDepositParams} params - The parameters for the deposit
   * @param {SonicSpokeProvider} spokeProvider - The provider for the spoke chain
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain
   * @returns {PromiseEvmTxReturnType<R>} A promise that resolves to the transaction hash
   */
  public static async deposit<R extends boolean = false>(
    params: SonicSpokeDepositParams,
    spokeProvider: SonicSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const userRouter = await SonicSpokeService.getUserWallet(params.from, spokeProvider);
    // Decode the data field which contains the encoded calls array
    const calls = decodeAbiParameters(
      [
        {
          name: 'calls',
          type: 'tuple[]',
          components: [
            { name: 'addr', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
          ],
        },
      ],
      params.data,
    )[0] as {
      addr: Address;
      value: bigint;
      data: `0x${string}`;
    }[];

    if (params.token === spokeProvider.chainConfig.nativeToken) {
      // Add a call to wrap the native token
      const wrapCall = {
        addr: spokeProvider.chainConfig.addresses.wrappedSonic as Address,
        value: params.amount,
        data: encodeFunctionData({
          abi: [{ name: 'deposit', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] }],
          functionName: 'deposit',
        }),
      };
      calls.unshift(wrapCall);
    } else {
      const transferFromCall = Erc20Service.encodeTransferFrom(params.token, params.from, userRouter, params.amount);
      calls.unshift({
        addr: transferFromCall.address,
        value: transferFromCall.value,
        data: transferFromCall.data,
      });
    }

    const txData = encodeFunctionData({
      abi: sonicWalletFactoryAbi,
      functionName: 'callWallet',
      args: [calls],
    });

    const rawTx = {
      from: spokeProvider.walletProvider.getWalletAddress(),
      to: spokeProvider.chainConfig.addresses.walletRouter as Address,
      data: txData,
      value: params.token === spokeProvider.chainConfig.nativeToken ? params.amount : 0n,
    };

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Execute a batch of contract calls through the Sonic wallet contract.
   * @param {Address} from - The address of the user on the spoke chain
   * @param {Hex} payload - The encoded payload containing the calls array
   * @param {SonicSpokeProvider} spokeProvider - The provider for the spoke chain
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain
   * @returns {PromiseEvmTxReturnType<R>} A promise that resolves to the transaction hash
   */
  public static async callWallet<R extends boolean = false>(
    from: Address,
    payload: Hex,
    spokeProvider: SonicSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    // Decode the payload which contains the encoded calls array
    const calls = decodeAbiParameters(
      [
        {
          name: 'calls',
          type: 'tuple[]',
          components: [
            { name: 'addr', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
          ],
        },
      ],
      payload,
    )[0] as {
      addr: Address;
      value: bigint;
      data: `0x${string}`;
    }[];

    const txData = encodeFunctionData({
      abi: sonicWalletFactoryAbi,
      functionName: 'callWallet',
      args: [calls],
    });

    const rawTx = {
      from: spokeProvider.walletProvider.getWalletAddress(),
      to: spokeProvider.chainConfig.addresses.walletRouter as Address,
      data: txData,
      value: 0n,
    };

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Encode money market withdraw operation for Sonic wallet.
   * @param {Address} from - The address of the user on the spoke chain
   * @param {Address} token - The address of the token to withdraw
   * @param {bigint} amount - The amount to withdraw
   * @param {Address} to - The address that will receive the withdrawn tokens
   * @param {SonicSpokeProvider} spokeProvider - The provider for the spoke chain
   * @returns {Hex} The encoded calls array for the Sonic wallet
   */
  public static async encodeMoneyMarketWithdraw(
    from: Address,
    token: Address,
    amount: bigint,
    to: Address,
    aTokenAmount: bigint,
    aTokenAddress: Address,
    spokeProvider: SonicSpokeProvider,
    moneyMarketService: MoneyMarketService,
  ): Promise<Hex> {
    const userRouter = await SonicSpokeService.getUserWallet(from, spokeProvider);

    //const assetConfig = hubAssets[spokeProvider.chainConfig.chain.id][token];
    //const vaultAddress = assetConfig?.vault as Address;

    //const reserveData = await moneyMarketService.getReserveData(moneyMarketService.config.lendingPool, vaultAddress);
    //const aTokenAddress = reserveData.aTokenAddress;
    //const aTokenAmount = await moneyMarketService.calculateATokenAmount(
    //  moneyMarketService.config.lendingPool,
    //  amount,
    //  token,
    //);

    // Add withdraw call
    const withdrawCall = moneyMarketService.withdrawData(from, to, token, amount, spokeProvider.chainConfig.chain.id);
    const calls = decodeAbiParameters(
      [
        {
          name: 'calls',
          type: 'tuple[]',
          components: [
            { name: 'addr', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
          ],
        },
      ],
      withdrawCall,
    )[0] as {
      addr: Address;
      value: bigint;
      data: `0x${string}`;
    }[];

    const transferFromCall = Erc20Service.encodeTransferFrom(aTokenAddress, from, userRouter, aTokenAmount);
    calls.unshift({
      addr: transferFromCall.address,
      value: transferFromCall.value,
      data: transferFromCall.data,
    });

    return encodeFunctionData({
      abi: sonicWalletFactoryAbi,
      functionName: 'callWallet',
      args: [calls],
    });
  }

  public static async approveWithdraw<R extends boolean = false>(
    from: Address,
    token: Address,
    amount: bigint,
    spokeProvider: SonicSpokeProvider,
    moneyMarketService: MoneyMarketService,
    raw?: R,
  ): Promise<[Address, bigint, PromiseEvmTxReturnType<R>]> {
    const userRouter = await SonicSpokeService.getUserWallet(from, spokeProvider);

    const assetConfig = hubAssets[spokeProvider.chainConfig.chain.id][token];
    const vaultAddress = assetConfig?.vault as Address;
    const reserveData = await moneyMarketService.getReserveData(moneyMarketService.config.lendingPool, vaultAddress);
    const aTokenAddress = reserveData.aTokenAddress;
    const aTokenAmount = await moneyMarketService.calculateATokenAmount(
      moneyMarketService.config.lendingPool,
      amount,
      token,
    );

    const txData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [userRouter, aTokenAmount],
    });

    const rawTx = {
      from: spokeProvider.walletProvider.getWalletAddress(),
      to: aTokenAddress,
      data: txData,
      value: 0n,
    };

    if (raw) {
      return [aTokenAddress, aTokenAmount, rawTx as PromiseEvmTxReturnType<R>];
    }

    return [
      aTokenAddress,
      aTokenAmount,
      spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>,
    ];
  }

  public static async approveBorrow<R extends boolean = false>(
    from: Address,
    token: Address,
    amount: bigint,
    spokeProvider: SonicSpokeProvider,
    moneyMarketService: MoneyMarketService,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const userRouter = await SonicSpokeService.getUserWallet(from, spokeProvider);

    const assetConfig = hubAssets[spokeProvider.chainConfig.chain.id][token];
    const vaultAddress = assetConfig?.vault as Address;
    const reserveData = await moneyMarketService.getReserveData(moneyMarketService.config.lendingPool, vaultAddress);
    const variableDebtTokenAddress = reserveData.variableDebtTokenAddress;

    const txData = encodeFunctionData({
      abi: variableDebtTokenAbi,
      functionName: 'approveDelegation',
      args: [userRouter, amount],
    });

    const rawTx = {
      from: spokeProvider.walletProvider.getWalletAddress(),
      to: variableDebtTokenAddress,
      data: txData,
      value: 0n,
    } as const;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }
}
