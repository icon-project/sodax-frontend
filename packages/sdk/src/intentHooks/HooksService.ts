import type { PublicClient, WalletClient, Hex, Address as ViemAddress } from 'viem';
import { encodeAbiParameters, encodePacked, keccak256 } from 'viem';
import {
  getSolverConfig,
  getMoneyMarketConfig,
  getHooksConfig,
  type Address,
  type HooksConfig,
  type CreditHookParams,
  type CreditDelegationStatus,
  type LeverageHookParams,
  type DebtSideLeverageHookParams,
  type DebtSideLeverageStatus,
  type DeleverageHookParams,
  type ATokenApprovalInfo,
  type LiquidationHookParams,
  type LiquidationOpportunity,
  type IntentCreationResult,
  type ApprovalResult,
  type HubChainId,
  type HookIntent,
  type HookIntentState,
  type HookPendingIntentState,
  type FillHookIntentParams,
  type CancelIntentResult,
  type FillIntentResult,
} from '@sodax/types';
import { erc20Abi } from '../shared/abis/erc20.abi.js';
import { poolAbi } from '../shared/abis/pool.abi.js';
import { variableDebtTokenAbi } from '../shared/abis/variableDebtToken.abi.js';
import { IntentsAbi } from '../shared/abis/intents.abi.js';
import { randomUint256 } from '../shared/utils/shared-utils.js';
import type { Result } from '../shared/types.js';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

/**
 * Hook types for credit delegation and token approvals
 */
export enum HookType {
  Credit = 'credit',
  Leverage = 'leverage',
  DebtSideLeverage = 'debtSideLeverage',
  Deleverage = 'deleverage',
  Liquidation = 'liquidation',
}

export type HooksServiceConstructorParams = {
  publicClient: PublicClient;
  walletClient?: WalletClient;
  chainId: HubChainId;
};

/**
 * Helper function to get the wallet address from a WalletClient
 */
async function getWalletAddress(walletClient: WalletClient): Promise<ViemAddress> {
  const addresses = await walletClient.getAddresses();
  const address = addresses[0];
  if (!address) {
    throw new Error('No wallet address available');
  }
  return address;
}

export class HooksService {
  private readonly publicClient: PublicClient;
  private readonly walletClient?: WalletClient;
  private readonly hooksConfig: HooksConfig;
  private readonly intentsAddress: Address;
  private readonly poolAddress: Address;

  constructor({ publicClient, walletClient, chainId }: HooksServiceConstructorParams) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;

    const solverConfig = getSolverConfig(chainId);
    const moneyMarketConfig = getMoneyMarketConfig(chainId);
    this.hooksConfig = getHooksConfig(chainId);
    this.intentsAddress = solverConfig.intentsContract;
    this.poolAddress = moneyMarketConfig.lendingPool;
  }

  // === SHARED APPROVAL METHODS ===

  /**
   * Get the hook address for a given hook type
   * @param hookType - The type of hook
   * @returns The hook contract address
   */
  getHookAddress(hookType: HookType): Address {
    const hookAddressMap: Record<HookType, Address> = {
      [HookType.Credit]: this.hooksConfig.creditHookAddress,
      [HookType.Leverage]: this.hooksConfig.leverageHookAddress,
      [HookType.DebtSideLeverage]: this.hooksConfig.debtSideLeverageHookAddress,
      [HookType.Deleverage]: this.hooksConfig.deleverageHookAddress,
      [HookType.Liquidation]: this.hooksConfig.liquidationHookAddress,
    };
    return hookAddressMap[hookType];
  }

  /**
   * Get credit delegation status for a debt asset to a specific hook
   * @param debtAsset - The address of the debt asset
   * @param userAddress - The user's wallet address
   * @param hookType - The hook type to check delegation for
   * @returns Credit delegation status with allowance information
   */
  async getCreditDelegationStatus(
    debtAsset: Address,
    userAddress: Address,
    hookType: HookType,
  ): Promise<Result<CreditDelegationStatus>> {
    try {
      const debtTokenAddress = await this.getVariableDebtToken(debtAsset);

      // If variable debt token is zero address, the asset is not initialized as a reserve
      if (debtTokenAddress === ZERO_ADDRESS) {
        return {
          ok: false,
          error: new Error(`Asset ${debtAsset} is not initialized as a reserve in the lending pool`),
        };
      }

      const hookAddress = this.getHookAddress(hookType);

      const allowance = await this.publicClient.readContract({
        address: debtTokenAddress,
        abi: variableDebtTokenAbi,
        functionName: 'borrowAllowance',
        args: [userAddress, hookAddress],
      });

      return {
        ok: true,
        value: {
          delegated: allowance > 0n,
          allowance: allowance.toString(),
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Approve credit delegation for a specific hook
   * @param debtAsset - The address of the debt asset
   * @param amount - The amount to approve for delegation
   * @param hookType - The hook type to approve delegation for
   * @returns Approval result with transaction hash
   */
  async approveCreditDelegation(
    debtAsset: Address,
    amount: string,
    hookType: HookType,
  ): Promise<Result<ApprovalResult>> {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      const debtTokenAddress = await this.getVariableDebtToken(debtAsset);
      const hookAddress = this.getHookAddress(hookType);
      if (!this.walletClient.account) {
        throw new Error('Wallet client account is required');
      }
      const hash = await this.walletClient.writeContract({
        address: debtTokenAddress,
        abi: variableDebtTokenAbi,
        functionName: 'approveDelegation',
        args: [hookAddress, BigInt(amount)],
        chain: this.walletClient.chain,
        account: this.walletClient.account,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        ok: true,
        value: { txHash: hash, approved: true },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Approve token spending for a specific hook
   * @param tokenAddress - The address of the token to approve
   * @param amount - The amount to approve
   * @param hookType - The hook type to approve spending for
   * @returns Approval result with transaction hash
   */
  async approveToken(tokenAddress: Address, amount: string, hookType: HookType): Promise<Result<ApprovalResult>> {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      const hookAddress = this.getHookAddress(hookType);
      if (!this.walletClient.account) {
        throw new Error('Wallet client account is required');
      }

      const hash = await this.walletClient.writeContract({
        address: tokenAddress as ViemAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [hookAddress as ViemAddress, BigInt(amount)],
        account: this.walletClient.account,
        chain: this.walletClient.chain,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        ok: true,
        value: { txHash: hash, approved: true },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Approve aToken spending for a specific hook (resolves aToken address from underlying asset)
   * @param underlyingAsset - The address of the underlying collateral asset
   * @param amount - The amount to approve
   * @param hookType - The hook type to approve spending for
   * @returns Approval result with transaction hash
   */
  async approveAToken(underlyingAsset: Address, amount: string, hookType: HookType): Promise<Result<ApprovalResult>> {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      const aTokenAddress = await this.getAToken(underlyingAsset);
      const hookAddress = this.getHookAddress(hookType);
      if (!this.walletClient.account) {
        throw new Error('Wallet client account is required');
      }

      const hash = await this.walletClient.writeContract({
        address: aTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [hookAddress as ViemAddress, BigInt(amount)],
        account: this.walletClient.account,
        chain: this.walletClient.chain,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        ok: true,
        value: { txHash: hash, approved: true },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  // === CREDIT HOOK (Limit Orders) ===

  /**
   * Create a credit intent (limit order)
   * @param params - Credit hook parameters
   *   - solver: Optional specific solver address. If not provided or address(0), any solver can fill the intent.
   * @param chainId - The chain ID
   * @returns Intent creation result with transaction hash
   */
  async createCreditIntent(params: CreditHookParams, chainId: number): Promise<Result<IntentCreationResult>> {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      const userAddress = await getWalletAddress(this.walletClient);
      const intentData = this.encodeIntentData(
        this.hooksConfig.creditHookAddress,
        '0x',
        params.feeReceiver,
        params.feeAmount,
      );

      const deadlineValue = params.deadline && params.deadline !== '' ? params.deadline : '0';
      const intent = {
        intentId: randomUint256(),
        creator: userAddress,
        inputToken: params.debtAsset as ViemAddress,
        outputToken: params.targetAsset as ViemAddress,
        inputAmount: BigInt(params.maxPayment),
        minOutputAmount: BigInt(params.minReceive),
        deadline: BigInt(deadlineValue),
        allowPartialFill: false,
        srcChain: BigInt(chainId),
        dstChain: BigInt(chainId),
        srcAddress: userAddress.toLowerCase() as Hex,
        dstAddress: userAddress.toLowerCase() as Hex,
        solver: (params.solver || ZERO_ADDRESS) as ViemAddress, // Use provided solver or zero address (any solver)
        data: intentData,
      };

      if (!this.walletClient.account) {
        throw new Error('Wallet client account is required');
      }
      const hash = await this.walletClient.writeContract({
        address: this.intentsAddress as ViemAddress,
        abi: IntentsAbi,
        functionName: 'createIntent',
        args: [intent],
        chain: this.walletClient.chain,
        account: this.walletClient.account,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        ok: true,
        value: { txHash: hash },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  // === LEVERAGE HOOK ===

  /**
   * Create a leverage intent
   * @param params - Leverage hook parameters
   * @param chainId - The chain ID
   * @returns Intent creation result with transaction hash
   */
  async createLeverageIntent(params: LeverageHookParams, chainId: number): Promise<Result<IntentCreationResult>> {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      const userAddress = await getWalletAddress(this.walletClient);
      const intentData = this.encodeIntentData(
        this.hooksConfig.leverageHookAddress,
        '0x',
        params.feeReceiver,
        params.feeAmount,
      );

      const intent = {
        intentId: randomUint256(),
        creator: userAddress,
        inputToken: params.debtAsset as ViemAddress,
        outputToken: params.collateralAsset as ViemAddress,
        inputAmount: BigInt(params.borrowAmount),
        minOutputAmount: BigInt(params.collateralAmount),
        deadline: BigInt(params.deadline || '0'),
        allowPartialFill: false,
        srcChain: BigInt(chainId),
        dstChain: BigInt(chainId),
        srcAddress: userAddress.toLowerCase() as Hex,
        dstAddress: (this.hooksConfig.leverageHookAddress as string).toLowerCase() as Hex,
        solver: (params.solver || ZERO_ADDRESS) as ViemAddress, // Use provided solver or zero address (any solver)
        data: intentData,
      };

      if (!this.walletClient.account) {
        throw new Error('Wallet client account is required');
      }
      const hash = await this.walletClient.writeContract({
        address: this.intentsAddress as ViemAddress,
        abi: IntentsAbi,
        functionName: 'createIntent',
        args: [intent],
        chain: this.walletClient.chain,
        account: this.walletClient.account,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        ok: true,
        value: { txHash: hash },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  // === DEBT SIDE LEVERAGE HOOK ===

  /**
   * Get the debt side leverage status for a user
   * @param debtAsset - The address of the debt asset
   * @param userAddress - The user's wallet address
   * @returns Debt side leverage status
   */
  async getDebtSideLeverageStatus(debtAsset: Address, userAddress: Address): Promise<Result<DebtSideLeverageStatus>> {
    try {
      const debtTokenAddress = await this.getVariableDebtToken(debtAsset);
      const hookAddress = this.hooksConfig.debtSideLeverageHookAddress;

      const [tokenAllowance, creditDelegation, tokenBalance] = await Promise.all([
        this.publicClient.readContract({
          address: debtAsset as ViemAddress,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [userAddress as ViemAddress, hookAddress as ViemAddress],
        }),
        this.publicClient.readContract({
          address: debtTokenAddress,
          abi: variableDebtTokenAbi,
          functionName: 'borrowAllowance',
          args: [userAddress as ViemAddress, hookAddress as ViemAddress],
        }),
        this.publicClient.readContract({
          address: debtAsset as ViemAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress as ViemAddress],
        }),
      ]);

      return {
        ok: true,
        value: {
          tokenAllowance: tokenAllowance.toString(),
          creditDelegation: creditDelegation.toString(),
          tokenBalance: tokenBalance.toString(),
          isReady: tokenAllowance > 0n && creditDelegation > 0n && tokenBalance > 0n,
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Create a debt side leverage intent
   * @param params - Debt side leverage hook parameters
   * @param chainId - The chain ID
   * @returns Intent creation result with transaction hash
   */
  async createDebtSideLeverageIntent(
    params: DebtSideLeverageHookParams,
    chainId: number,
  ): Promise<Result<IntentCreationResult>> {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      const userAddress = await getWalletAddress(this.walletClient);
      const hookData = this.encodeHookDataWithUint256(params.userProvidedAmount);
      const intentData = this.encodeIntentData(
        this.hooksConfig.debtSideLeverageHookAddress,
        hookData,
        params.feeReceiver,
        params.feeAmount,
      );

      const intent = {
        intentId: randomUint256(),
        creator: userAddress,
        inputToken: params.debtAsset as ViemAddress,
        outputToken: params.collateralAsset as ViemAddress,
        inputAmount: BigInt(params.totalBorrowAmount),
        minOutputAmount: BigInt(params.collateralAmount),
        deadline: BigInt(params.deadline || '0'),
        allowPartialFill: false,
        srcChain: BigInt(chainId),
        dstChain: BigInt(chainId),
        srcAddress: userAddress.toLowerCase() as Hex,
        dstAddress: (this.hooksConfig.debtSideLeverageHookAddress as string).toLowerCase() as Hex,
        solver: (params.solver || ZERO_ADDRESS) as ViemAddress, // Use provided solver or zero address (any solver)
        data: intentData,
      };

      if (!this.walletClient.account) {
        throw new Error('Wallet client account is required');
      }
      const hash = await this.walletClient.writeContract({
        address: this.intentsAddress as ViemAddress,
        abi: IntentsAbi,
        functionName: 'createIntent',
        args: [intent],
        chain: this.walletClient.chain,
        account: this.walletClient.account,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        ok: true,
        value: { txHash: hash },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  // === DELEVERAGE HOOK ===

  /**
   * Get aToken approval information for deleverage
   * Note: The hook contract checks aToken for intent.inputToken (collateralAsset), not debtAsset
   * @param collateralAsset - The address of the collateral asset (inputToken in the intent)
   * @param userAddress - The user's wallet address
   * @param withdrawAmount - The amount to withdraw (inputAmount in the intent)
   * @param feeAmount - Optional fee amount
   * @returns aToken approval information
   */
  async getATokenApprovalInfo(
    collateralAsset: Address,
    userAddress: Address,
    withdrawAmount: string,
    feeAmount?: string,
  ): Promise<Result<ATokenApprovalInfo>> {
    try {
      // Hook checks aToken for intent.inputToken (collateralAsset), which is what we withdraw
      const aTokenAddress = await this.getAToken(collateralAsset);
      const currentAllowance = await this.publicClient.readContract({
        address: aTokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress as ViemAddress, this.hooksConfig.deleverageHookAddress as ViemAddress],
      });

      // Hook requires: allowance >= intent.inputAmount + fee
      const aTokensNeeded = BigInt(withdrawAmount) + BigInt(feeAmount || '0');

      return {
        ok: true,
        value: {
          aTokenAddress,
          aTokensNeeded: aTokensNeeded.toString(),
          currentAllowance: currentAllowance.toString(),
          isApproved: BigInt(currentAllowance) >= aTokensNeeded,
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Create a deleverage intent
   * @param params - Deleverage hook parameters
   * @param chainId - The chain ID
   * @returns Intent creation result with transaction hash
   */
  async createDeleverageIntent(params: DeleverageHookParams, chainId: number): Promise<Result<IntentCreationResult>> {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      const userAddress = await getWalletAddress(this.walletClient);
      const intentData = this.encodeIntentData(
        this.hooksConfig.deleverageHookAddress,
        '0x',
        params.feeReceiver,
        params.feeAmount,
      );

      const intent = {
        intentId: randomUint256(),
        creator: userAddress,
        // For deleverage: Hook's _onFillIntent expects:
        // - intent.inputToken = collateralAsset (to withdraw using inputAmount)
        // - intent.outputToken = debtAsset (to repay using outputAmount)
        // The hook will pull outputToken (debtAsset) from its balance to repay
        inputToken: params.collateralAsset as ViemAddress, // Collateral to withdraw from pool
        outputToken: params.debtAsset as ViemAddress, // Debt to repay
        inputAmount: BigInt(params.withdrawAmount), // Amount of collateral to withdraw
        minOutputAmount: BigInt(params.repayAmount), // Amount of debt to repay
        deadline: BigInt(params.deadline || '0'),
        allowPartialFill: false,
        srcChain: BigInt(chainId),
        dstChain: BigInt(chainId),
        srcAddress: userAddress.toLowerCase() as Hex,
        dstAddress: (this.hooksConfig.deleverageHookAddress as string).toLowerCase() as Hex,
        solver: (params.solver || ZERO_ADDRESS) as ViemAddress, // Use provided solver or zero address (any solver)
        data: intentData,
      };

      if (!this.walletClient.account) {
        throw new Error('Wallet client account is required');
      }
      const hash = await this.walletClient.writeContract({
        address: this.intentsAddress as ViemAddress,
        abi: IntentsAbi,
        functionName: 'createIntent',
        args: [intent],
        chain: this.walletClient.chain,
        account: this.walletClient.account,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        ok: true,
        value: { txHash: hash },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  // === LIQUIDATION HOOK ===

  /**
   * Get liquidation opportunity for a user
   * @param userAddress - The user's wallet address to check
   * @returns Liquidation opportunity information
   */
  async getLiquidationOpportunity(userAddress: Address): Promise<Result<LiquidationOpportunity>> {
    try {
      const accountData = await this.publicClient.readContract({
        address: this.poolAddress as ViemAddress,
        abi: poolAbi,
        functionName: 'getUserAccountData',
        args: [userAddress as ViemAddress],
      });

      const [totalCollateralBase, totalDebtBase, availableBorrowsBase, currentLiquidationThreshold, ltv, healthFactor] =
        accountData;

      return {
        ok: true,
        value: {
          userAddress,
          healthFactor: healthFactor.toString(),
          isLiquidatable: healthFactor < BigInt(1e18),
          accountData: {
            totalCollateralBase: totalCollateralBase.toString(),
            totalDebtBase: totalDebtBase.toString(),
            availableBorrowsBase: availableBorrowsBase.toString(),
            currentLiquidationThreshold: currentLiquidationThreshold.toString(),
            ltv: ltv.toString(),
            healthFactor: healthFactor.toString(),
          },
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Create a liquidation intent
   * @param params - Liquidation hook parameters
   * @param chainId - The chain ID
   * @returns Intent creation result with transaction hash
   */
  async createLiquidationIntent(params: LiquidationHookParams, chainId: number): Promise<Result<IntentCreationResult>> {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      // Check if position is liquidatable
      const opportunityResult = await this.getLiquidationOpportunity(params.userToLiquidate);
      if (!opportunityResult.ok) {
        return opportunityResult;
      }

      if (!opportunityResult.value.isLiquidatable) {
        return {
          ok: false,
          error: new Error(
            `Position is not liquidatable. Health factor: ${opportunityResult.value.healthFactor} (must be < 1.0)`,
          ),
        };
      }

      const creatorAddress = await getWalletAddress(this.walletClient);
      const hookData = this.encodeAddressToHookData(params.userToLiquidate);
      const intentData = this.encodeIntentData(
        this.hooksConfig.liquidationHookAddress,
        hookData,
        params.feeReceiver,
        params.feeAmount,
      );

      const intent = {
        intentId: randomUint256(),
        creator: creatorAddress,
        inputToken: params.collateralAsset as ViemAddress,
        outputToken: params.debtAsset as ViemAddress,
        inputAmount: BigInt(params.collateralAmount),
        minOutputAmount: BigInt(params.debtAmount),
        deadline: BigInt(params.deadline || '0'),
        allowPartialFill: false,
        srcChain: BigInt(chainId),
        dstChain: BigInt(chainId),
        srcAddress: creatorAddress.toLowerCase() as Hex,
        dstAddress: (this.hooksConfig.liquidationHookAddress as string).toLowerCase() as Hex,
        solver: (params.solver || ZERO_ADDRESS) as ViemAddress, // Use provided solver or zero address (any solver)
        data: intentData,
      };

      const hash = await this.walletClient.writeContract({
        address: this.intentsAddress as ViemAddress,
        abi: IntentsAbi,
        functionName: 'createIntent',
        args: [intent],
        account: creatorAddress,
        chain: this.walletClient.chain,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        ok: true,
        value: { txHash: hash },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  // === INTENT LIFECYCLE METHODS ===

  /**
   * Cancel a pending intent
   * @param intent - The full intent object to cancel
   * @returns Cancel result with transaction hash
   */
  async cancelIntent(intent: HookIntent): Promise<Result<CancelIntentResult>> {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      if (!this.walletClient.account) {
        throw new Error('Wallet client account is required');
      }

      const hash = await this.walletClient.writeContract({
        address: this.intentsAddress as ViemAddress,
        abi: IntentsAbi,
        functionName: 'cancelIntent',
        args: [this.intentToContractFormat(intent)],
        account: this.walletClient.account,
        chain: this.walletClient.chain,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        ok: true,
        value: { txHash: hash, cancelled: true },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Fill an intent (for solvers)
   * @param params - Fill parameters including intent, amounts, and optional external fill ID
   * @returns Fill result with transaction hash
   */
  async fillIntent(params: FillHookIntentParams): Promise<Result<FillIntentResult>> {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      if (!this.walletClient.account) {
        throw new Error('Wallet client account is required');
      }
      const externalFillId = params.externalFillId ? BigInt(params.externalFillId) : 0n;

      // For fillIntent, solver needs to provide output tokens
      // If output token is native, solver needs to send ETH with the transaction
      const isNativeOutput = params.intent.outputToken === ZERO_ADDRESS;

      // Estimate gas first, then add 20% buffer for complex operations
      const estimatedGas = await this.publicClient.estimateContractGas({
        address: this.intentsAddress as ViemAddress,
        abi: IntentsAbi,
        functionName: 'fillIntent',
        args: [
          this.intentToContractFormat(params.intent),
          BigInt(params.inputAmount),
          BigInt(params.outputAmount),
          externalFillId,
        ],
        account: this.walletClient.account,
        ...(isNativeOutput ? { value: BigInt(params.outputAmount) } : {}),
      });

      // Add 30% buffer to handle gas estimation inaccuracies for complex hook operations
      const gasLimit = (estimatedGas * 130n) / 100n;

      const hash = await this.walletClient.writeContract({
        address: this.intentsAddress as ViemAddress,
        abi: IntentsAbi,
        functionName: 'fillIntent',
        args: [
          this.intentToContractFormat(params.intent),
          BigInt(params.inputAmount),
          BigInt(params.outputAmount),
          externalFillId,
        ],
        account: this.walletClient.account,
        chain: this.walletClient.chain,
        gas: gasLimit,
        ...(isNativeOutput ? { value: BigInt(params.outputAmount) } : {}),
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });

      if (receipt.status === 'reverted') {
        return {
          ok: false,
          error: new Error('Transaction reverted'),
        };
      }

      return {
        ok: true,
        value: { txHash: hash, filled: true },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Get the state of an intent by its hash
   * @param intentHash - The keccak256 hash of the intent
   * @returns Intent state (exists, remainingInput, receivedOutput, pendingPayment)
   */
  async getIntentState(intentHash: Hex): Promise<Result<HookIntentState>> {
    try {
      const state = await this.publicClient.readContract({
        address: this.intentsAddress as ViemAddress,
        abi: IntentsAbi,
        functionName: 'intentStates',
        args: [intentHash],
      });

      return {
        ok: true,
        value: {
          exists: state[0],
          remainingInput: state[1].toString(),
          receivedOutput: state[2].toString(),
          pendingPayment: state[3],
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Get the pending state of an intent
   * @param intentHash - The keccak256 hash of the intent
   * @returns Pending intent state (pendingInput, pendingOutput)
   */
  async getPendingIntentState(intentHash: Hex): Promise<Result<HookPendingIntentState>> {
    try {
      const state = await this.publicClient.readContract({
        address: this.intentsAddress as ViemAddress,
        abi: IntentsAbi,
        functionName: 'pendingIntentStates',
        args: [intentHash],
      });

      return {
        ok: true,
        value: {
          pendingInput: state[0].toString(),
          pendingOutput: state[1].toString(),
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Compute the keccak256 hash of an intent (used as intent ID on-chain)
   * @param intent - The intent object
   * @returns The intent hash
   */
  computeIntentHash(intent: HookIntent): Hex {
    const encoded = encodeAbiParameters(
      [
        {
          type: 'tuple',
          components: [
            { name: 'intentId', type: 'uint256' },
            { name: 'creator', type: 'address' },
            { name: 'inputToken', type: 'address' },
            { name: 'outputToken', type: 'address' },
            { name: 'inputAmount', type: 'uint256' },
            { name: 'minOutputAmount', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'allowPartialFill', type: 'bool' },
            { name: 'srcChain', type: 'uint256' },
            { name: 'dstChain', type: 'uint256' },
            { name: 'srcAddress', type: 'bytes' },
            { name: 'dstAddress', type: 'bytes' },
            { name: 'solver', type: 'address' },
            { name: 'data', type: 'bytes' },
          ],
        },
      ],
      [this.intentToContractFormat(intent)],
    );
    return keccak256(encoded);
  }

  /**
   * Check if an intent exists and is fillable
   * @param intentHash - The intent hash
   * @returns Whether the intent can be filled
   */
  async isFillable(intentHash: Hex): Promise<Result<boolean>> {
    try {
      const stateResult = await this.getIntentState(intentHash);
      if (!stateResult.ok) {
        return stateResult;
      }

      const pendingResult = await this.getPendingIntentState(intentHash);
      if (!pendingResult.ok) {
        return pendingResult;
      }

      const { exists, remainingInput, pendingPayment } = stateResult.value;
      const { pendingInput } = pendingResult.value;

      // Intent is fillable if it exists, has remaining input, no pending payment, and available input
      const availableInput = BigInt(remainingInput) - BigInt(pendingInput);
      const fillable = exists && !pendingPayment && availableInput > 0n;

      return { ok: true, value: fillable };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Convert Intent object to contract format for contract calls
   */
  private intentToContractFormat(intent: HookIntent): {
    intentId: bigint;
    creator: ViemAddress;
    inputToken: ViemAddress;
    outputToken: ViemAddress;
    inputAmount: bigint;
    minOutputAmount: bigint;
    deadline: bigint;
    allowPartialFill: boolean;
    srcChain: bigint;
    dstChain: bigint;
    srcAddress: Hex;
    dstAddress: Hex;
    solver: ViemAddress;
    data: Hex;
  } {
    return {
      intentId: intent.intentId,
      creator: intent.creator as ViemAddress,
      inputToken: intent.inputToken as ViemAddress,
      outputToken: intent.outputToken as ViemAddress,
      inputAmount: intent.inputAmount,
      minOutputAmount: intent.minOutputAmount,
      deadline: intent.deadline,
      allowPartialFill: intent.allowPartialFill,
      srcChain: intent.srcChain,
      dstChain: intent.dstChain,
      srcAddress: intent.srcAddress as Hex,
      dstAddress: intent.dstAddress as Hex,
      solver: intent.solver as ViemAddress,
      data: intent.data as Hex,
    };
  }

  // === HELPER METHODS ===

  /**
   * Get the variable debt token address for an asset
   * @param asset - The asset address
   * @returns The variable debt token address
   */
  private async getVariableDebtToken(asset: Address): Promise<ViemAddress> {
    const reserveData = await this.publicClient.readContract({
      address: this.poolAddress as ViemAddress,
      abi: poolAbi,
      functionName: 'getReserveData',
      args: [asset as ViemAddress],
    });

    return reserveData.variableDebtTokenAddress;
  }

  /**
   * Get the aToken address for an asset
   * @param asset - The asset address
   * @returns The aToken address
   */
  private async getAToken(asset: Address): Promise<ViemAddress> {
    const reserveData = await this.publicClient.readContract({
      address: this.poolAddress as ViemAddress,
      abi: poolAbi,
      functionName: 'getReserveData',
      args: [asset as ViemAddress],
    });

    return reserveData.aTokenAddress;
  }

  /**
   * Encode intent data with hook address and optional fee data
   * Format matches IntentDataLib:
   * - Without fee: uint8(2) + abi.encode(HookData({hook: address, data: bytes}))
   * - With fee: uint8(0) + abi.encode(ArrayData({data: [DataEntry(FeeData), DataEntry(HookData)]}))
   *
   * IntentDataLib.decodeIntentData expects:
   * - First byte: dataType (0=ARRAY, 1=FEE, 2=HOOK)
   * - Rest: abi-encoded data
   */
  private encodeIntentData(hookAddress: Address, hookData: string, feeReceiver?: Address, feeAmount?: string): Hex {
    // Encode HookData struct: {hook: address, data: bytes}
    // Use tuple encoding without names to match Solidity's abi.decode expectations
    const hookDataBytes = hookData === '0x' || hookData === '' ? '0x' : (hookData as Hex);
    const encodedHookData = encodeAbiParameters(
      [
        {
          type: 'tuple',
          components: [
            { type: 'address' }, // NO name field
            { type: 'bytes' }, // NO name field
          ],
        },
      ],
      [[hookAddress, hookDataBytes]], // Note: extra array wrapper for tuple
    );

    if (feeReceiver && feeAmount) {
      // With fee: Use ArrayData format
      // Step 1: Encode FeeData struct: {fee: uint256, receiver: address}
      // Use tuple encoding without names to match Solidity's abi.decode expectations
      const encodedFeeData = encodeAbiParameters(
        [
          {
            type: 'tuple',
            components: [
              { type: 'uint256' }, // NO name field
              { type: 'address' }, // NO name field
            ],
          },
        ],
        [[BigInt(feeAmount), feeReceiver]], // Note: extra array wrapper for tuple
      );

      // Step 3: Encode ArrayData struct: {data: DataEntry[]}
      // Match Solidity: ArrayData memory arrayData = ArrayData({data: entries});
      // Then: bytes memory arrayEncoded = abi.encode(arrayData);
      // ArrayData is a struct with one field: data (DataEntry[])
      // DataEntry is a struct: {dataType: uint8, data: bytes}
      const arrayData = encodeAbiParameters(
        [
          {
            type: 'tuple',
            components: [
              {
                name: 'data',
                type: 'tuple[]',
                components: [
                  { name: 'dataType', type: 'uint8' },
                  { name: 'data', type: 'bytes' },
                ],
              },
            ],
          },
        ],
        [
          {
            data: [
              { dataType: 1, data: encodedFeeData },
              { dataType: 2, data: encodedHookData },
            ],
          },
        ],
      );

      // Step 4: Final encoding: abi.encodePacked(uint8(0), abi.encode(ArrayData))
      // Match Solidity: bytes memory rawData = abi.encodePacked(uint8(0), arrayEncoded);
      return encodePacked(['uint8', 'bytes'], [0, arrayData]) as Hex;
    }

    // Without fee: abi.encodePacked(uint8(2), abi.encode(HookData))
    // Match Solidity: abi.encodePacked(uint8(2), abi.encode(HookData({hook: address, data: bytes})))
    // Use encodePacked to match Solidity's abi.encodePacked exactly
    return encodePacked(['uint8', 'bytes'], [2, encodedHookData]) as Hex;
  }

  /**
   * Encode a uint256 value as hook data
   */
  private encodeHookDataWithUint256(value: string): Hex {
    return `0x${BigInt(value).toString(16).padStart(64, '0')}` as Hex;
  }

  /**
   * Encode an address as hook data
   */
  private encodeAddressToHookData(address: Address): Hex {
    return `0x${(address as string).replace('0x', '')}` as Hex;
  }

  // === CONVENIENCE METHODS (WITH PREREQUISITES) ===

  /**
   * Create a credit intent with automatic prerequisite handling
   * Automatically checks and approves credit delegation if needed
   * @param params - Credit hook parameters
   * @param chainId - The chain ID
   * @param options - Optional settings
   *   - checkOnly: If true, only checks prerequisites without creating intent
   *   - autoApprove: If true, automatically approves if needed (default: true)
   * @returns Intent creation result with transaction hash and prerequisite info
   */
  async createCreditIntentWithPrerequisites(
    params: CreditHookParams,
    chainId: number,
    options?: { checkOnly?: boolean; autoApprove?: boolean },
  ): Promise<
    Result<
      IntentCreationResult & {
        prerequisites: { creditDelegationApproved: boolean };
      }
    >
  > {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      const userAddress = await getWalletAddress(this.walletClient);
      // In check-only mode, don't auto-approve
      const autoApprove = options?.checkOnly ? false : options?.autoApprove !== false;

      // Check credit delegation status
      const delegationStatus = await this.getCreditDelegationStatus(params.debtAsset, userAddress, HookType.Credit);
      if (!delegationStatus.ok) {
        return delegationStatus;
      }

      let creditDelegationApproved = delegationStatus.value.delegated;
      const neededAmount = BigInt(params.maxPayment);

      // Approve credit delegation if needed
      if (!creditDelegationApproved && autoApprove && !options?.checkOnly) {
        const approveResult = await this.approveCreditDelegation(params.debtAsset, params.maxPayment, HookType.Credit);
        if (!approveResult.ok) {
          return approveResult;
        }
        creditDelegationApproved = true;
      } else if (!creditDelegationApproved) {
        return {
          ok: false,
          error: new Error(
            `Credit delegation not approved. Current allowance: ${delegationStatus.value.allowance}, needed: ${params.maxPayment}`,
          ),
        };
      } else if (BigInt(delegationStatus.value.allowance) < neededAmount) {
        // Check if existing allowance is sufficient
        if (autoApprove && !options?.checkOnly) {
          const approveResult = await this.approveCreditDelegation(
            params.debtAsset,
            params.maxPayment,
            HookType.Credit,
          );
          if (!approveResult.ok) {
            return approveResult;
          }
        } else {
          return {
            ok: false,
            error: new Error(
              `Insufficient credit delegation allowance. Current: ${delegationStatus.value.allowance}, needed: ${params.maxPayment}`,
            ),
          };
        }
      }

      if (options?.checkOnly) {
        return {
          ok: true,
          value: {
            txHash: '0x' as Hex,
            prerequisites: { creditDelegationApproved },
          },
        };
      }

      // Create the intent
      const createResult = await this.createCreditIntent(params, chainId);
      if (!createResult.ok) {
        return createResult;
      }

      return {
        ok: true,
        value: {
          ...createResult.value,
          prerequisites: { creditDelegationApproved },
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Create a leverage intent with automatic prerequisite handling
   * Automatically checks and approves credit delegation if needed
   */
  async createLeverageIntentWithPrerequisites(
    params: LeverageHookParams,
    chainId: number,
    options?: { checkOnly?: boolean; autoApprove?: boolean },
  ): Promise<
    Result<
      IntentCreationResult & {
        prerequisites: { creditDelegationApproved: boolean };
      }
    >
  > {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      const userAddress = await getWalletAddress(this.walletClient);
      const autoApprove = options?.autoApprove !== false;

      // Check credit delegation status
      const delegationStatus = await this.getCreditDelegationStatus(params.debtAsset, userAddress, HookType.Leverage);
      if (!delegationStatus.ok) {
        return delegationStatus;
      }

      // When there's a fee, the hook checks: allowance >= borrowAmount + fee
      // From unit test: ICreditDelegationToken(vDebtWeth).approveDelegation(address(_hook), borrowAmount+fee);
      const feeAmount = params.feeAmount ? BigInt(params.feeAmount) : 0n;
      const neededAmount = BigInt(params.borrowAmount) + feeAmount;

      let creditDelegationApproved = delegationStatus.value.delegated;

      // Approve credit delegation if needed (must include fee if present)
      if (!creditDelegationApproved && autoApprove) {
        const approveResult = await this.approveCreditDelegation(
          params.debtAsset,
          neededAmount.toString(),
          HookType.Leverage,
        );
        if (!approveResult.ok) {
          return approveResult;
        }
        creditDelegationApproved = true;
      } else if (!creditDelegationApproved) {
        return {
          ok: false,
          error: new Error(
            `Credit delegation not approved. Current allowance: ${delegationStatus.value.allowance}, needed: ${neededAmount.toString()} (borrowAmount: ${params.borrowAmount}${feeAmount > 0n ? ` + fee: ${feeAmount.toString()}` : ''})`,
          ),
        };
      } else if (BigInt(delegationStatus.value.allowance) < neededAmount) {
        if (autoApprove) {
          const approveResult = await this.approveCreditDelegation(
            params.debtAsset,
            neededAmount.toString(),
            HookType.Leverage,
          );
          if (!approveResult.ok) {
            return approveResult;
          }
        } else {
          return {
            ok: false,
            error: new Error(
              `Insufficient credit delegation allowance. Current: ${delegationStatus.value.allowance}, needed: ${neededAmount.toString()} (borrowAmount: ${params.borrowAmount}${feeAmount > 0n ? ` + fee: ${feeAmount.toString()}` : ''})`,
            ),
          };
        }
      }

      if (options?.checkOnly) {
        return {
          ok: true,
          value: {
            txHash: '0x' as Hex,
            prerequisites: { creditDelegationApproved },
          },
        };
      }

      // Create the intent
      const createResult = await this.createLeverageIntent(params, chainId);
      if (!createResult.ok) {
        return createResult;
      }

      return {
        ok: true,
        value: {
          ...createResult.value,
          prerequisites: { creditDelegationApproved },
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Create a debt side leverage intent with automatic prerequisite handling
   * Automatically checks and approves credit delegation and token spending if needed
   */
  async createDebtSideLeverageIntentWithPrerequisites(
    params: DebtSideLeverageHookParams,
    chainId: number,
    options?: { checkOnly?: boolean; autoApprove?: boolean },
  ): Promise<
    Result<
      IntentCreationResult & {
        prerequisites: {
          creditDelegationApproved: boolean;
          tokenApproved: boolean;
        };
      }
    >
  > {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      const userAddress = await getWalletAddress(this.walletClient);
      const autoApprove = options?.autoApprove !== false;

      // Check credit delegation status
      const delegationStatus = await this.getCreditDelegationStatus(
        params.debtAsset,
        userAddress,
        HookType.DebtSideLeverage,
      );
      if (!delegationStatus.ok) {
        return delegationStatus;
      }

      // Check token approval status
      const statusResult = await this.getDebtSideLeverageStatus(params.debtAsset, userAddress);
      if (!statusResult.ok) {
        return statusResult;
      }

      let creditDelegationApproved = delegationStatus.value.delegated;
      let tokenApproved = BigInt(statusResult.value.tokenAllowance) >= BigInt(params.userProvidedAmount);

      const neededDelegationAmount = BigInt(params.totalBorrowAmount) - BigInt(params.userProvidedAmount);
      const neededTokenAmount = BigInt(params.userProvidedAmount);

      // Approve credit delegation if needed
      if (!creditDelegationApproved && autoApprove) {
        const approveResult = await this.approveCreditDelegation(
          params.debtAsset,
          neededDelegationAmount.toString(),
          HookType.DebtSideLeverage,
        );
        if (!approveResult.ok) {
          return approveResult;
        }
        creditDelegationApproved = true;
      } else if (!creditDelegationApproved) {
        return {
          ok: false,
          error: new Error(
            `Credit delegation not approved. Current allowance: ${delegationStatus.value.allowance}, needed: ${neededDelegationAmount.toString()}`,
          ),
        };
      } else if (BigInt(delegationStatus.value.allowance) < neededDelegationAmount) {
        if (autoApprove) {
          const approveResult = await this.approveCreditDelegation(
            params.debtAsset,
            neededDelegationAmount.toString(),
            HookType.DebtSideLeverage,
          );
          if (!approveResult.ok) {
            return approveResult;
          }
        } else {
          return {
            ok: false,
            error: new Error(
              `Insufficient credit delegation allowance. Current: ${delegationStatus.value.allowance}, needed: ${neededDelegationAmount.toString()}`,
            ),
          };
        }
      }

      // Approve token if needed
      if (!tokenApproved && autoApprove) {
        const approveResult = await this.approveToken(
          params.debtAsset,
          params.userProvidedAmount,
          HookType.DebtSideLeverage,
        );
        if (!approveResult.ok) {
          return approveResult;
        }
        tokenApproved = true;
      } else if (!tokenApproved) {
        return {
          ok: false,
          error: new Error(
            `Token not approved. Current allowance: ${statusResult.value.tokenAllowance}, needed: ${params.userProvidedAmount}`,
          ),
        };
      } else if (BigInt(statusResult.value.tokenAllowance) < neededTokenAmount) {
        if (autoApprove) {
          const approveResult = await this.approveToken(
            params.debtAsset,
            params.userProvidedAmount,
            HookType.DebtSideLeverage,
          );
          if (!approveResult.ok) {
            return approveResult;
          }
        } else {
          return {
            ok: false,
            error: new Error(
              `Insufficient token allowance. Current: ${statusResult.value.tokenAllowance}, needed: ${params.userProvidedAmount}`,
            ),
          };
        }
      }

      if (options?.checkOnly) {
        return {
          ok: true,
          value: {
            txHash: '0x' as Hex,
            prerequisites: { creditDelegationApproved, tokenApproved },
          },
        };
      }

      // Create the intent
      const createResult = await this.createDebtSideLeverageIntent(params, chainId);
      if (!createResult.ok) {
        return createResult;
      }

      return {
        ok: true,
        value: {
          ...createResult.value,
          prerequisites: { creditDelegationApproved, tokenApproved },
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Create a deleverage intent with automatic prerequisite handling
   * Automatically checks and approves aToken spending if needed
   */
  async createDeleverageIntentWithPrerequisites(
    params: DeleverageHookParams,
    chainId: number,
    options?: { checkOnly?: boolean; autoApprove?: boolean },
  ): Promise<Result<IntentCreationResult & { prerequisites: { aTokenApproved: boolean } }>> {
    try {
      if (!this.walletClient) {
        return { ok: false, error: new Error('Wallet client required') };
      }

      const userAddress = await getWalletAddress(this.walletClient);
      const autoApprove = options?.autoApprove !== false;

      // Check aToken approval info
      // Hook checks aToken for the collateral asset (outputToken) which is what we withdraw
      const approvalInfo = await this.getATokenApprovalInfo(
        params.collateralAsset,
        userAddress,
        params.withdrawAmount,
        params.feeAmount,
      );
      if (!approvalInfo.ok) {
        return approvalInfo;
      }

      let aTokenApproved = approvalInfo.value.isApproved;

      // Approve aToken if needed
      if (!aTokenApproved && autoApprove) {
        const approveResult = await this.approveAToken(
          params.collateralAsset,
          approvalInfo.value.aTokensNeeded,
          HookType.Deleverage,
        );
        if (!approveResult.ok) {
          return approveResult;
        }
        aTokenApproved = true;
      } else if (!aTokenApproved) {
        return {
          ok: false,
          error: new Error(
            `aToken not approved. Current allowance: ${approvalInfo.value.currentAllowance}, needed: ${approvalInfo.value.aTokensNeeded}`,
          ),
        };
      }

      if (options?.checkOnly) {
        return {
          ok: true,
          value: {
            txHash: '0x' as Hex,
            prerequisites: { aTokenApproved },
          },
        };
      }

      // Create the intent
      const createResult = await this.createDeleverageIntent(params, chainId);
      if (!createResult.ok) {
        return createResult;
      }

      return {
        ok: true,
        value: {
          ...createResult.value,
          prerequisites: { aTokenApproved },
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
