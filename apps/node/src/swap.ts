import 'dotenv/config';
import {
  Sodax,
  EvmSpokeProvider,
  ARBITRUM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type CreateIntentParams,
  type SolverIntentQuoteRequest,
  type SolverIntentStatusRequest,
  SolverIntentStatusCode,
  isIntentCreationFailedError,
  isIntentSubmitTxFailedError,
  isIntentPostExecutionFailedError,
  isWaitUntilIntentExecutedFailed,
  type EvmSpokeChainConfig,
} from '@sodax/sdk';
import { EvmWalletProvider } from '@sodax/wallet-sdk-core';
import type { Address, Hash, Hex } from '@sodax/types';

// Load configuration from environment
const privateKey: string | undefined = process.env.EVM_PRIVATE_KEY;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

// Initialize wallet provider for Arbitrum
const arbWalletProvider: EvmWalletProvider = new EvmWalletProvider({
  privateKey: privateKey as Hex,
  chainId: ARBITRUM_MAINNET_CHAIN_ID,
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
});

// Initialize Sodax (defaults to mainnet configuration)
const sodax: Sodax = new Sodax();

await sodax.initialize();

// Create spoke provider for Arbitrum
const arbSpokeProvider: EvmSpokeProvider = new EvmSpokeProvider(
  arbWalletProvider,
  spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID] as EvmSpokeChainConfig,
);

/**
 * Execute a full EVM swap from Arbitrum ETH to Polygon POL
 * @param inputAmount - Amount to swap (in token's smallest unit, e.g., wei)
 */
async function executeSwap(inputAmount: bigint): Promise<void> {
  try {
    // Step 1: Initialize Sodax (done above)
    console.log('Step 1: Sodax initialized');

    // Step 2: Create Spoke Provider (done above)
    console.log('Step 2: Spoke provider created');

    // Token addresses
    const arbEthToken: Address = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken; // ETH on Arbitrum
    const polygonPolToken: Address = spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].nativeToken; // POL on Polygon

    // Step 3: Get Quote
    console.log('Step 3: Getting quote...');
    const quoteRequest: SolverIntentQuoteRequest = {
      token_src: arbEthToken,
      token_dst: polygonPolToken,
      token_src_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
      token_dst_blockchain_id: POLYGON_MAINNET_CHAIN_ID,
      amount: inputAmount,
      quote_type: 'exact_input',
    };

    const quoteResult = await sodax.swaps.getQuote(quoteRequest);
    if (!quoteResult.ok) {
      console.error('Failed to get quote:', quoteResult.error);
      return;
    }

    const quotedAmount: bigint = quoteResult.value.quoted_amount;
    console.log('Quoted amount:', quotedAmount);

    // Step 4: Check Allowance
    console.log('Step 4: Checking allowance...');
    const walletAddress: string = await arbWalletProvider.getWalletAddress();
    // Five minutes in seconds (300 seconds)
    const fiveMinutesInSeconds: bigint = 300n;
    const deadline: bigint = await sodax.swaps.getSwapDeadline(fiveMinutesInSeconds);

    const createIntentParams: CreateIntentParams = {
      inputToken: arbEthToken,
      outputToken: polygonPolToken,
      inputAmount: inputAmount,
      minOutputAmount: (quotedAmount * 95n) / 100n, // 5% slippage tolerance
      deadline: deadline,
      allowPartialFill: false,
      srcChain: ARBITRUM_MAINNET_CHAIN_ID,
      dstChain: POLYGON_MAINNET_CHAIN_ID,
      srcAddress: walletAddress,
      dstAddress: walletAddress,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    };

    const allowanceResult = await sodax.swaps.isAllowanceValid({
      intentParams: createIntentParams,
      spokeProvider: arbSpokeProvider,
    });

    if (!allowanceResult.ok) {
      console.error('Failed to check allowance:', allowanceResult.error);
      return;
    }

    // Step 5: Approve if Needed
    if (!allowanceResult.value) {
      console.log('Step 5: Approving tokens...');
      const approveResult = await sodax.swaps.approve({
        intentParams: createIntentParams,
        spokeProvider: arbSpokeProvider,
      });

      if (!approveResult.ok) {
        console.error('Failed to approve tokens:', approveResult.error);
        return;
      }

      const approvalTxHash: Hash = approveResult.value;
      console.log('Approval transaction hash:', approvalTxHash);

      // Wait for approval confirmation
      await arbSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash);
      console.log('Approval confirmed');
    } else {
      console.log('Step 5: Approval not needed');
    }

    // Step 6: Execute Swap
    console.log('Step 6: Executing swap...');
    const swapResult = await sodax.swaps.swap({
      intentParams: createIntentParams,
      spokeProvider: arbSpokeProvider,
    });

    // Step 7: Handle Result
    if (!swapResult.ok) {
      console.error('Step 7: Swap failed');
      const error = swapResult.error;

      if (isIntentCreationFailedError(error)) {
        console.error('Intent creation failed');
        console.error('Payload:', error.data.payload);
        console.error('Original error:', error.data.error);
      } else if (isIntentSubmitTxFailedError(error)) {
        console.error('Submit transaction failed');
        console.error('Payload:', error.data.payload);
        console.error('Original error:', error.data.error);
        console.error('CRITICAL: Transaction created but not submitted to relay. Retry submission!');
      } else if (isWaitUntilIntentExecutedFailed(error)) {
        console.error('Intent execution timeout');
        console.error('Payload:', error.data.payload);
        console.error('Original error:', error.data.error);
      } else if (isIntentPostExecutionFailedError(error)) {
        console.error('Post execution failed');
        console.error('Error data:', error.data);
      } else {
        console.error('Unknown error:', error);
        console.error('Error code:', error.code);
        console.error('Error data:', error.data);
      }
      return;
    }

    // Success!
    const [solverExecutionResponse, intent, intentDeliveryInfo] = swapResult.value;
    console.log('Step 7: Swap transaction submitted successfully!');
    console.log('Solver execution response:', solverExecutionResponse);
    console.log('Intent:', intent);
    console.log('Source transaction hash:', intentDeliveryInfo.srcTxHash);
    console.log('Destination transaction hash:', intentDeliveryInfo.dstTxHash);

    // Step 8: Check Intent Status
    console.log('Step 8: Checking intent status...');
    await checkIntentStatus(sodax, intentDeliveryInfo.dstTxHash);
  } catch (error) {
    console.error('Unexpected error during swap:', error);
  }
}

/**
 * Check and log the status of an intent with user-friendly messages
 * Polls every 5 seconds until a terminal state is reached (SOLVED, FAILED, or NOT_FOUND)
 * @param sodax - The Sodax instance
 * @param dstTxHash - The destination transaction hash (hub chain transaction hash)
 * @param maxAttempts - Maximum number of polling attempts (default: 60, which is 5 minutes)
 * @param intervalMs - Polling interval in milliseconds (default: 5000 = 5 seconds)
 */
async function checkIntentStatus(sodax: Sodax, dstTxHash: string, maxAttempts = 60, intervalMs = 5000): Promise<void> {
  const statusRequest: SolverIntentStatusRequest = {
    intent_tx_hash: dstTxHash as `0x${string}`,
  };

  let attempt = 0;
  let lastStatus: SolverIntentStatusCode | null = null;
  let notFoundCount = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const statusResult = await sodax.swaps.getStatus(statusRequest);

    if (!statusResult.ok) {
      console.error(`[Attempt ${attempt}] Failed to check intent status:`, statusResult.error);
      // Continue polling even on error, as it might be a temporary issue
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      continue;
    }

    const { status, fill_tx_hash } = statusResult.value;

    // Handle terminal states (SOLVED, FAILED)
    if (status === SolverIntentStatusCode.SOLVED) {
      console.log(`[Attempt ${attempt}] ✅ Status: Swap completed successfully!`);
      if (fill_tx_hash) {
        console.log(`Fill transaction hash: ${fill_tx_hash}`);
        console.log('Your tokens have been successfully swapped and delivered to the destination chain.');
      } else {
        console.log('Your swap has been completed successfully.');
      }
      return;
    }

    if (status === SolverIntentStatusCode.FAILED) {
      console.log(`[Attempt ${attempt}] ❌ Status: Swap failed`);
      console.log('The swap could not be completed. Please check the transaction details or contact support.');
      return;
    }

    // Handle NOT_FOUND - give it a few attempts before treating as terminal
    if (status === SolverIntentStatusCode.NOT_FOUND) {
      notFoundCount++;
      if (notFoundCount >= 3) {
        console.log(`[Attempt ${attempt}] Status: Intent not found after ${notFoundCount} attempts`);
        console.log('Intent not found in the solver system. Please check the transaction hash manually.');
        return;
      }
      // Continue checking for a few more attempts
      if (status !== lastStatus) {
        console.log(`[Attempt ${attempt}] Status: Intent not found in the solver system`);
        console.log('This may happen if the intent was just created. Continuing to check...');
        lastStatus = status;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      continue;
    }

    // Handle non-terminal states (NOT_STARTED_YET, STARTED_NOT_FINISHED)
    // Only log status changes to avoid spam
    if (status !== lastStatus) {
      switch (status) {
        case SolverIntentStatusCode.NOT_STARTED_YET:
          console.log(`[Attempt ${attempt}] Status: Intent is queued and waiting to be processed`);
          console.log('Your swap is in the queue and will be processed soon.');
          break;

        case SolverIntentStatusCode.STARTED_NOT_FINISHED:
          console.log(`[Attempt ${attempt}] Status: Intent is being processed`);
          console.log('Your swap is currently being executed. Please wait for completion.');
          break;

        default:
          console.log(`[Attempt ${attempt}] Status: Unknown status (${status})`);
          console.log('Please check the swap status manually using the destination transaction hash.');
          return; // Unknown status - exit to avoid infinite loop
      }
      lastStatus = status;
    } else {
      // Status hasn't changed, show progress indicator
      console.log(`[Attempt ${attempt}] Still processing... (status: ${status})`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  // Max attempts reached
  console.log(`\n⚠️  Status polling reached maximum attempts (${maxAttempts}).`);
  console.log(`Last known status: ${lastStatus ?? 'unknown'}`);
  console.log('Please check the swap status manually using the destination transaction hash.');
  console.log(`Destination transaction hash: ${dstTxHash}`);
}

// Main execution
const args: string[] = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: pnpm swap <amount>');
  console.log('Example: pnpm swap 100000000000000 (0.0001 ETH with 18 decimals)');
  process.exit(1);
}

const inputAmount: bigint = BigInt(args[0]);
console.log(`Executing swap with input amount: ${inputAmount}`);
await executeSwap(inputAmount);
