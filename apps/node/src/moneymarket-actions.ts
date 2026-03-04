import {
  type Hash,
  type Hex,
  isEvmSpokeProvider,
  type MoneyMarketBorrowParams,
  type MoneyMarketRepayParams,
  type MoneyMarketSupplyParams,
  type MoneyMarketWithdrawParams,
  Sodax,
  type SpokeProvider,
  SpokeService,
} from '@sodax/sdk';

const sodax = new Sodax({
  moneyMarket: {
    partnerFee: {
      address: '0x0Ab764AB3816cD036Ea951bE973098510D8105A6',
      percentage: 100, // 1% for testing purposes
    },
  },
});

/**
 * Supply tokens to the money market pool
 * @param token - Token address on the spoke chain
 * @param amount - Amount to supply (in token's smallest unit)
 * @param toChainId - Optional target spoke chain ID to receive the supplied assets
 * @param toAddress - Optional address on the target spoke chain to receive the supplied assets
 */
export async function supply(params: MoneyMarketSupplyParams, srcSpokeProvider: SpokeProvider): Promise<void> {
  try {
    const walletAddress = await srcSpokeProvider.walletProvider.getWalletAddress();
    console.log(`[Supply] Using wallet: ${walletAddress}`);

    // Check allowance
    console.log('[Supply] Checking allowance...');
    const allowanceResult = await sodax.moneyMarket.isAllowanceValid(params, srcSpokeProvider);

    if (!allowanceResult.ok) {
      console.error('[Supply] Failed to check allowance:', allowanceResult.error);
      throw new Error(`[Supply] Failed to check allowance: ${allowanceResult.error}`);
    }

    // Approve if needed
    if (!allowanceResult.value) {
      console.log('[Supply] Approving tokens...');
      const approveResult = await sodax.moneyMarket.approve(params, srcSpokeProvider);

      if (!approveResult.ok) {
        console.error('[Supply] Failed to approve tokens:', approveResult.error);
        throw new Error(`[Supply] Failed to approve tokens: ${approveResult.error}`);
      }

      const approvalTxHash = approveResult.value;
      console.log('[Supply] Approval transaction hash:', approvalTxHash);

      // Wait for approval confirmation
      if (isEvmSpokeProvider(srcSpokeProvider)) {
        await srcSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash as Hex);
      } else {
        await SpokeService.verifyTxHash(approvalTxHash, srcSpokeProvider);
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds for the approval to be confirmed
      console.log('[Supply] Approval confirmed');
    } else {
      console.log('[Supply] Approval not needed');
    }

    // Execute supply
    console.log('[Supply] Executing supply...');
    if (params.toChainId) {
      console.log(`[Supply] Target chain ID: ${params.toChainId}`);
    }
    if (params.toAddress) {
      console.log(`[Supply] Target address: ${params.toAddress}`);
    }

    const supplyResult = await sodax.moneyMarket.supply(params, srcSpokeProvider);

    if (!supplyResult.ok) {
      console.error('[Supply] Supply failed:', supplyResult.error);
      throw new Error(`[Supply] Supply failed: ${supplyResult.error}`);
    }

    const [spokeTxHash, hubTxHash] = supplyResult.value;
    console.log('[Supply] ✅ Supply transaction submitted successfully!');
    console.log('[Supply] Spoke transaction hash:', spokeTxHash);
    console.log('[Supply] Hub transaction hash:', hubTxHash);
  } catch (error) {
    console.error('[Supply] Unexpected error:', error);
    throw error;
  }
}

/**
 * Withdraw tokens from the money market pool
 * @param token - Token address on the spoke chain
 * @param amount - Amount to withdraw (in token's smallest unit)
 * @param toChainId - Optional target spoke chain ID to receive the withdrawn assets
 * @param toAddress - Optional address on the target spoke chain to receive the withdrawn assets
 */
export async function withdraw(params: MoneyMarketWithdrawParams, srcSpokeProvider: SpokeProvider): Promise<void> {
  try {
    const walletAddress = await srcSpokeProvider.walletProvider.getWalletAddress();
    console.log(`[Withdraw] Using wallet: ${walletAddress}`);

    console.log('[Withdraw] Checking allowance...');
    const allowanceResult = await sodax.moneyMarket.isAllowanceValid(params, srcSpokeProvider);

    if (!allowanceResult.ok) {
      console.error('[Withdraw] Failed to check allowance:', allowanceResult.error);
      throw new Error(`[Withdraw] Failed to check allowance: ${allowanceResult.error}`);
    }

    if (!allowanceResult.value) {
      console.log('[Withdraw] Approving tokens...');
      const approveResult = await sodax.moneyMarket.approve(params, srcSpokeProvider);

      if (!approveResult.ok) {
        console.error('[Withdraw] Failed to approve tokens:', approveResult.error);
        throw new Error(`[Withdraw] Failed to approve tokens: ${approveResult.error}`);
      }

      const approvalTxHash: Hash = approveResult.value as Hash;
      console.log('[Withdraw] Approval transaction hash:', approvalTxHash);

      // Wait for approval confirmation
      if (isEvmSpokeProvider(srcSpokeProvider)) {
        await srcSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash as Hex);
      } else {
        await SpokeService.verifyTxHash(approvalTxHash, srcSpokeProvider);
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds for the approval to be confirmed
      console.log('[Withdraw] Approval confirmed');
    }

    // Execute withdraw
    if (params.toChainId) {
      console.log(`[Withdraw] Target chain ID: ${params.toChainId}`);
    }
    if (params.toAddress) {
      console.log(`[Withdraw] Target address: ${params.toAddress}`);
    }

    const withdrawResult = await sodax.moneyMarket.withdraw(params, srcSpokeProvider);

    if (!withdrawResult.ok) {
      console.error('[Withdraw] Withdraw failed:', withdrawResult.error);
      throw new Error(`[Withdraw] Withdraw failed: ${withdrawResult.error}`);
    }

    const [spokeTxHash, hubTxHash] = withdrawResult.value;
    console.log('[Withdraw] ✅ Withdraw transaction submitted successfully!');
    console.log('[Withdraw] Spoke transaction hash:', spokeTxHash);
    console.log('[Withdraw] Hub transaction hash:', hubTxHash);
  } catch (error) {
    console.error('[Withdraw] Unexpected error:', error);
    throw error;
  }
}

/**
 * Borrow tokens from the money market pool
 * @param token - Token address on the spoke chain
 * @param amount - Amount to borrow (in token's smallest unit)
 * @param toChainId - Optional target spoke chain ID to receive the borrowed assets
 * @param toAddress - Optional address on the target spoke chain to receive the borrowed assets
 */
export async function borrow(params: MoneyMarketBorrowParams, srcSpokeProvider: SpokeProvider): Promise<void> {
  try {
    const walletAddress = await srcSpokeProvider.walletProvider.getWalletAddress();
    console.log(
      `[Borrow] Using ${params.amount} ${params.token} from wallet: ${walletAddress} to ${params.toChainId ? `chain ${params.toChainId}` : ''} ${params.toAddress ? `address ${params.toAddress}` : ''}`,
    );

    console.log('[Borrow] Checking allowance...');
    const allowanceResult = await sodax.moneyMarket.isAllowanceValid(params, srcSpokeProvider);

    if (!allowanceResult.ok) {
      console.error('[Borrow] Failed to check allowance:', allowanceResult.error);
      throw new Error(`[Borrow] Failed to check allowance: ${allowanceResult.error}`);
    }

    if (!allowanceResult.value) {
      console.log('[Borrow] Approving tokens...');
      const approveResult = await sodax.moneyMarket.approve(params, srcSpokeProvider);

      if (!approveResult.ok) {
        console.error('[Borrow] Failed to approve tokens:', approveResult.error);
        throw new Error(`[Borrow] Failed to approve tokens: ${approveResult.error}`);
      }

      const approvalTxHash: Hash = approveResult.value as Hash;
      console.log('[Borrow] Approval transaction hash:', approvalTxHash);

      // Wait for approval confirmation
      if (isEvmSpokeProvider(srcSpokeProvider)) {
        await srcSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash as Hex);
      } else {
        await SpokeService.verifyTxHash(approvalTxHash, srcSpokeProvider);
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds for the approval to be confirmed
      console.log('[Borrow] Approval confirmed');
    }

    if (params.toChainId) {
      console.log(`[Borrow] Target chain ID: ${params.toChainId}`);
    }
    if (params.toAddress) {
      console.log(`[Borrow] Target address: ${params.toAddress}`);
    }

    const borrowResult = await sodax.moneyMarket.borrow(params, srcSpokeProvider);

    if (!borrowResult.ok) {
      console.error('[Borrow] Borrow failed:', borrowResult.error);
      throw new Error(`[Borrow] Borrow failed: ${borrowResult.error}`);
    }

    const [spokeTxHash, hubTxHash] = borrowResult.value;
    console.log('[Borrow] ✅ Borrow transaction submitted successfully!');
    console.log('[Borrow] Spoke transaction hash:', spokeTxHash);
    console.log('[Borrow] Hub transaction hash:', hubTxHash);
  } catch (error) {
    console.error('[Borrow] Unexpected error:', error);
    throw error;
  }
}

/**
 * Repay tokens to the money market pool
 * @param token - Token address on the spoke chain
 * @param amount - Amount to repay (in token's smallest unit)
 * @param toChainId - Optional target spoke chain ID to receive the repaid assets
 * @param toAddress - Optional address on the target spoke chain to receive the repaid assets
 */
export async function repay(params: MoneyMarketRepayParams, srcSpokeProvider: SpokeProvider): Promise<void> {
  try {
    const walletAddress = await srcSpokeProvider.walletProvider.getWalletAddress();
    console.log(`[Repay] Using wallet: ${walletAddress}`);

    // Check allowance
    console.log('[Repay] Checking allowance...');
    const allowanceResult = await sodax.moneyMarket.isAllowanceValid(params, srcSpokeProvider);

    if (!allowanceResult.ok) {
      console.error('[Repay] Failed to check allowance:', allowanceResult.error);
      throw new Error(`[Repay] Failed to check allowance: ${allowanceResult.error}`);
    }

    // Approve if needed
    if (!allowanceResult.value) {
      console.log('[Repay] Approving tokens...');
      const approveResult = await sodax.moneyMarket.approve(params, srcSpokeProvider);

      if (!approveResult.ok) {
        console.error('[Repay] Failed to approve tokens:', approveResult.error);
        throw new Error(`[Repay] Failed to approve tokens: ${approveResult.error}`);
      }

      const approvalTxHash: Hash = approveResult.value as Hash;
      console.log('[Repay] Approval transaction hash:', approvalTxHash);

      // Wait for approval confirmation
      if (isEvmSpokeProvider(srcSpokeProvider)) {
        await srcSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash as Hex);
      } else {
        await SpokeService.verifyTxHash(approvalTxHash, srcSpokeProvider);
      }

      await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds for the approval to be confirmed
      console.log('[Repay] Approval confirmed');
    } else {
      console.log('[Repay] Approval not needed');
    }

    // Execute repay
    console.log('[Repay] Executing repay...');
    if (params.toChainId) {
      console.log(`[Repay] Target chain ID: ${params.toChainId}`);
    }
    if (params.toAddress) {
      console.log(`[Repay] Target address: ${params.toAddress}`);
    }

    const repayResult = await sodax.moneyMarket.repay(params, srcSpokeProvider);

    if (!repayResult.ok) {
      console.error('[Repay] Repay failed:', repayResult.error);
      throw new Error(`[Repay] Repay failed: ${repayResult.error}`);
    }

    const [spokeTxHash, hubTxHash] = repayResult.value;
    console.log('[Repay] ✅ Repay transaction submitted successfully!');
    console.log('[Repay] Spoke transaction hash:', spokeTxHash);
    console.log('[Repay] Hub transaction hash:', hubTxHash);
  } catch (error) {
    console.error('[Repay] Unexpected error:', error);
    throw error;
  }
}
