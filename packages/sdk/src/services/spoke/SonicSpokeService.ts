import { type Address, decodeAbiParameters, encodeFunctionData, erc20Abi } from 'viem';
import { sonicWalletFactoryAbi } from '../../abis/sonicWalletFactory.abi.js';
import { variableDebtTokenAbi } from '../../abis/variableDebtToken.abi.js';
import { wrappedSonicAbi } from '../../abis/wrappedSonic.abi.js';
import { SonicSpokeProvider, type EvmHubProvider, type SpokeProvider } from '../../entities/index.js';
import type {
  EvmContractCall,
  EvmReturnType,
  PartnerFee,
  PromiseEvmTxReturnType,
  Result,
  SolverConfig,
  TxReturnType,
} from '../../types.js';
import { Erc20Service, EvmSolverService, type CreateIntentParams, type Intent } from '../index.js';
import { MoneyMarketService } from '../../moneyMarket/MoneyMarketService.js';
import { getHubAssetInfo, getIntentRelayChainId } from '../../constants.js';
import { encodeContractCalls } from '../../utils/evm-utils.js';
import {
  SONIC_MAINNET_CHAIN_ID,
  type EvmRawTransaction,
  type Hex,
  type HubAddress,
  type SpokeChainId,
} from '@sodax/types';
import type { MoneyMarketDataService } from '../../moneyMarket/MoneyMarketDataService.js';
import invariant from 'tiny-invariant';
import { encodeAddress, randomUint256 } from '../../utils/shared-utils.js';

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
  amount: bigint;
};

export class SonicSpokeService {
  private constructor() {}

  /**
   /**
    * Estimates the gas necessary to complete a transaction without submitting it to the network.
    *
    * - Docs: https://viem.sh/docs/actions/public/estimateGas
    * - JSON-RPC Methods: [`eth_estimateGas`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_estimategas)
    *
    * @param {EvmRawTransaction} rawTx - The raw transaction to estimate the gas for.
    * @param {SonicSpokeProvider} spokeProvider - The EVM spoke provider.
    * @returns {Promise<bigint>} Estimated gas for the transaction.
    *
    * @example
    *
    * const rawTx: EvmRawTransaction = {
    *   from: '0x1234...abcd', // sender address
    *   to: '0xabcd...1234',   // recipient address
    *   value: 1000000000000000000n, // 1 ETH in wei
    *   data: '0x', // no calldata
    * };
    *
    * // Assume spokeProvider is an initialized EvmSpokeProvider
    * const estimatedGas = await EvmSpokeService.estimateGas(rawTx, spokeProvider);
    * console.log(`Estimated gas: ${estimatedGas}`);
    */
  public static async estimateGas(rawTx: EvmRawTransaction, spokeProvider: SonicSpokeProvider): Promise<bigint> {
    // Use viem's estimateGas with explicit parameter types
    return spokeProvider.publicClient.estimateGas({
      account: rawTx.from,
      to: rawTx.to,
      value: rawTx.value,
      data: rawTx.data,
    });
  }

  /**
   * Get the derived address of a contract deployed with CREATE3.
   * @param address - User's address on the specified chain as hex
   * @param provider - Sonic Spoke provider
   * @returns {HubAddress} The computed contract address as a EVM address (hex) string
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
  public static async deposit<S extends SpokeProvider, R extends boolean = false>(
    params: SonicSpokeDepositParams,
    spokeProvider: S,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    invariant(spokeProvider instanceof SonicSpokeProvider, '[SonicSpokeService] invalid spoke provider');

    const userHubAddress = params.to ?? (await SonicSpokeService.getUserRouter(params.from, spokeProvider));

    // Decode the data field which contains the encoded calls array
    const calls = Array.from(
      decodeAbiParameters(
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
      )[0] satisfies readonly EvmContractCall[],
    );

    if (params.token.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase()) {
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
      const transferFromCall = Erc20Service.encodeTransferFrom(
        params.token,
        params.from,
        userHubAddress,
        params.amount,
      );
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
      value: params.token.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase() ? params.amount : 0n,
    } satisfies TxReturnType<SonicSpokeProvider, true>;

    if (raw) {
      return Promise.resolve(rawTx) satisfies PromiseEvmTxReturnType<true> as PromiseEvmTxReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  public static async createSwapIntent<R extends boolean = false>(
    createIntentParams: CreateIntentParams,
    creatorHubWalletAddress: Address,
    solverConfig: SolverConfig,
    fee: PartnerFee | undefined,
    spokeProvider: SonicSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<[TxReturnType<SonicSpokeProvider, R>, Intent, bigint, Hex]> {
    const inputToken = createIntentParams.inputToken as `0x${string}`;

    const outputToken =
      createIntentParams.dstChain !== SONIC_MAINNET_CHAIN_ID
        ? getHubAssetInfo(createIntentParams.dstChain, createIntentParams.outputToken)?.asset
        : (createIntentParams.outputToken as `0x${string}`);

    invariant(
      inputToken,
      `hub asset not found for spoke chain token (intent.inputToken): ${createIntentParams.inputToken}`,
    );
    invariant(
      outputToken,
      `hub asset not found for spoke chain token (intent.outputToken): ${createIntentParams.outputToken}`,
    );

    const [feeData, feeAmount] = EvmSolverService.createIntentFeeData(fee, createIntentParams.inputAmount);

    const intentsContract = solverConfig.intentsContract;
    const intent = {
      ...createIntentParams,
      inputToken,
      outputToken,
      inputAmount: createIntentParams.inputAmount - feeAmount,
      srcChain: getIntentRelayChainId(createIntentParams.srcChain),
      dstChain: getIntentRelayChainId(createIntentParams.dstChain),
      srcAddress: encodeAddress(createIntentParams.srcChain, createIntentParams.srcAddress),
      dstAddress: encodeAddress(createIntentParams.dstChain, createIntentParams.dstAddress),
      intentId: randomUint256(),
      creator: creatorHubWalletAddress,
      data: feeData, // fee amount will be deducted from the input amount
    } satisfies Intent;

    const txData = EvmSolverService.encodeCreateIntent(intent, intentsContract);

    const rawTx = {
      from: await spokeProvider.walletProvider.getWalletAddress(),
      to: txData.address,
      data: txData.data,
      value:
        createIntentParams.inputToken.toLowerCase() === hubProvider.chainConfig.nativeToken.toLowerCase()
          ? createIntentParams.inputAmount
          : 0n,
    } satisfies EvmReturnType<true>;

    if (raw) {
      return [
        rawTx satisfies TxReturnType<SonicSpokeProvider, true> as TxReturnType<SonicSpokeProvider, R>,
        intent,
        feeAmount,
        txData.data,
      ];
    }

    return [
      (await spokeProvider.walletProvider.sendTransaction(rawTx)) satisfies EvmReturnType<false> as EvmReturnType<R>,
      intent,
      feeAmount,
      txData.data,
    ];
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
  public static async callWallet<S extends SpokeProvider, R extends boolean>(
    payload: Hex,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    invariant(spokeProvider instanceof SonicSpokeProvider, '[SonicSpokeService] invalid spoke provider');

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
    } satisfies TxReturnType<SonicSpokeProvider, true>;

    if (raw) {
      return rawTx as TxReturnType<S, R>;
    }

    return (await spokeProvider.walletProvider.sendTransaction(rawTx)) as TxReturnType<S, R>;
  }

  /**
   * Get withdraw information for a given token
   * @param token - The address of the underlying token
   * @param amount - The amount to withdraw
   * @param spokeProvider - The spoke provider
   * @param moneyMarketService - The money market service
   * @returns {WithdrawInfo} WithdrawInfo containing aToken address, amount and vault address
   */
  public static async getWithdrawInfo(
    token: Address,
    amount: bigint,
    spokeProvider: SonicSpokeProvider,
    dataService: MoneyMarketDataService,
  ): Promise<WithdrawInfo> {
    const assetConfig = getHubAssetInfo(spokeProvider.chainConfig.chain.id, token);

    if (!assetConfig) {
      throw new Error('[SonicSpokeService.getWithdrawInfo] Hub asset not found');
    }

    const vaultAddress = assetConfig.vault;

    const [normalizedIncome, reserveData] = await Promise.all([
      dataService.getReserveNormalizedIncome(vaultAddress),
      dataService.getReserveData(vaultAddress),
    ]);

    const aTokenAddress = reserveData.aTokenAddress;
    const aTokenAmount = MoneyMarketService.calculateATokenAmount(amount, normalizedIncome);

    return {
      aTokenAddress,
      aTokenAmount,
      token,
    };
  }

  /**
   * Get borrow information for a given token
   * @param token - The address of the underlying token
   * @param amount - The amount to borrow
   * @param chainId - The chain ID
   * @param moneyMarketService - The money market service
   * @returns BorrowInfo containing variable debt token address and vault address
   */
  public static async getBorrowInfo(
    token: Address,
    amount: bigint,
    chainId: SpokeChainId,
    dataService: MoneyMarketDataService,
  ): Promise<BorrowInfo> {
    const assetConfig = getHubAssetInfo(chainId, token);

    if (!assetConfig) {
      throw new Error('[SonicSpokeService.getBorrowInfo] Hub asset not found');
    }

    const vaultAddress = assetConfig.vault;
    const reserveData = await dataService.getReserveData(vaultAddress);
    const variableDebtTokenAddress = reserveData.variableDebtTokenAddress;

    return {
      variableDebtTokenAddress,
      vaultAddress,
      amount,
    };
  }

  /**
   * Check if the user has approved the withdrawal of tokens from the spoke chain using the Sonic wallet abstraction.
   * @param from - The address of the user on the spoke chain
   * @param withdrawInfo - The information about the withdrawal
   * @param spokeProvider - The spoke provider
   * @param spender - The address of the spender
   * @returns {Promise<Result<boolean>>} A promise that resolves to the result of the approval check
   */
  public static async isWithdrawApproved(
    from: Address,
    withdrawInfo: WithdrawInfo,
    spokeProvider: SonicSpokeProvider,
    spender?: HubAddress,
  ): Promise<Result<boolean>> {
    try {
      const spenderAddress = spender ?? (await SonicSpokeService.getUserRouter(from, spokeProvider));

      return Erc20Service.isAllowanceValid(
        withdrawInfo.aTokenAddress,
        withdrawInfo.aTokenAmount,
        from,
        spenderAddress,
        spokeProvider,
      );
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  /**
   * Approve the withdrawal of tokens from the spoke chain using the Sonic wallet abstraction.
   * @param from - The address of the user on the spoke chain
   * @param withdrawInfo - The information about the withdrawal
   * @param spokeProvider - The spoke provider
   * @param raw - Whether to return the raw transaction data
   * @returns {PromiseEvmTxReturnType<R>} A promise that resolves to the transaction hash
   */
  public static async approveWithdraw<R extends boolean = false>(
    from: Address,
    withdrawInfo: WithdrawInfo,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const [userRouter, walletAddress] = await Promise.all([
      SonicSpokeService.getUserRouter(from, spokeProvider),
      spokeProvider.walletProvider.getWalletAddress(),
    ]);

    const txData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [userRouter, withdrawInfo.aTokenAmount],
    });

    const rawTx = {
      from: walletAddress,
      to: withdrawInfo.aTokenAddress,
      data: txData,
      value: 0n,
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Check if the user has approved the borrowing of tokens from the spoke chain using the Sonic wallet abstraction.
   * @param from - The address of the user on the spoke chain
   * @param borrowInfo - The information about the borrowing
   * @param spokeProvider - The spoke provider
   * @param spender - The address of the spender
   * @returns {Promise<Result<boolean>>} A promise that resolves to the result of the approval check
   */
  public static async isBorrowApproved(
    from: Address,
    borrowInfo: BorrowInfo,
    spokeProvider: SonicSpokeProvider,
    spender?: HubAddress,
  ): Promise<Result<boolean>> {
    try {
      const spenderAddress = spender ?? (await SonicSpokeService.getUserRouter(from, spokeProvider));

      const allowance: bigint = await spokeProvider.publicClient.readContract({
        address: borrowInfo.variableDebtTokenAddress,
        abi: variableDebtTokenAbi,
        functionName: 'borrowAllowance',
        args: [from, spenderAddress],
      });

      return {
        ok: true,
        value: allowance >= borrowInfo.amount,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  public static async approveBorrow<R extends boolean = false>(
    from: Address,
    borrowInfo: BorrowInfo,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const [userRouter, walletAddress] = await Promise.all([
      SonicSpokeService.getUserRouter(from, spokeProvider),
      spokeProvider.walletProvider.getWalletAddress(),
    ]);

    const txData = encodeFunctionData({
      abi: variableDebtTokenAbi,
      functionName: 'approveDelegation',
      args: [userRouter, borrowInfo.amount],
    });

    const rawTx = {
      from: walletAddress,
      to: borrowInfo.variableDebtTokenAddress,
      data: txData,
      value: 0n,
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  public static async buildWithdrawData(
    from: Address,
    withdrawInfo: WithdrawInfo,
    amount: bigint,
    spokeProvider: SonicSpokeProvider,
    moneyMarketService: MoneyMarketService,
  ): Promise<Hex> {
    const userRouter = await SonicSpokeService.getUserRouter(from, spokeProvider);

    // Add withdraw call
    const withdrawCall = moneyMarketService.buildWithdrawData(
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
    // move aTokens to user wallet address
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
    console.log('calls', calls);

    return encodeContractCalls(calls);
  }
}
