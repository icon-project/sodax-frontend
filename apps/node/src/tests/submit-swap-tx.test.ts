import 'dotenv/config';
import {
  Sodax,
  EvmSpokeProvider,
  ARBITRUM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type CreateIntentParams,
  type SolverIntentQuoteRequest,
  type EvmSpokeChainConfig,
} from '@sodax/sdk';
import { EvmWalletProvider } from '@sodax/wallet-sdk-core';
import type { Address, Hash, Hex } from '@sodax/types';
import type { SubmitSwapTxRequest, SwapIntentData, SubmitSwapTxStatus } from '@sodax/types';

// ── Step 1: Setup ──────────────────────────────────────────────────────────────
console.log('Step 1: Setting up wallet, Sodax, and spoke provider...');

const privateKey = process.env.EVM_PRIVATE_KEY;
if (!privateKey) {
  throw new Error('EVM_PRIVATE_KEY environment variable is required');
}

const arbWalletProvider = new EvmWalletProvider({
  privateKey: privateKey as Hex,
  chainId: ARBITRUM_MAINNET_CHAIN_ID,
});

const sodax = new Sodax();
await sodax.initialize();
const baseUrl = 'https://canary-api.sodax.com/v1/bes'

const arbSpokeProvider = new EvmSpokeProvider(
  arbWalletProvider,
  spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID] as EvmSpokeChainConfig,
);

const walletAddress = await arbWalletProvider.getWalletAddress();
console.log('Wallet address:', walletAddress);
console.log('Step 1: Setup complete');

// ── Step 2: Get Quote ──────────────────────────────────────────────────────────
console.log('\nStep 2: Getting quote...');

const inputAmount = 1000000000000000n; // 0.0001 ETH
const arbEthToken: Address = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken;
const polygonPolToken: Address = spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].nativeToken;

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
  process.exit(1);
}

const quotedAmount = quoteResult.value.quoted_amount;
console.log('Quoted amount:', quotedAmount);
console.log('Step 2: Quote received');

// ── Step 3: Build CreateIntentParams ───────────────────────────────────────────
console.log('\nStep 3: Building intent params...');

const fiveMinutesInSeconds = 300n;
const deadline = await sodax.swaps.getSwapDeadline(fiveMinutesInSeconds);

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

console.log('Intent params:', {
  inputToken: createIntentParams.inputToken,
  outputToken: createIntentParams.outputToken,
  inputAmount: createIntentParams.inputAmount.toString(),
  minOutputAmount: createIntentParams.minOutputAmount.toString(),
  deadline: createIntentParams.deadline.toString(),
});
console.log('Step 3: Intent params built');

// ── Step 4: Check Allowance & Approve ──────────────────────────────────────────
console.log('\nStep 4: Checking allowance...');

const allowanceResult = await sodax.swaps.isAllowanceValid({
  intentParams: createIntentParams,
  spokeProvider: arbSpokeProvider,
});

if (!allowanceResult.ok) {
  console.error('Failed to check allowance:', allowanceResult.error);
  process.exit(1);
}

if (!allowanceResult.value) {
  console.log('Approval needed, approving tokens...');
  const approveResult = await sodax.swaps.approve({
    intentParams: createIntentParams,
    spokeProvider: arbSpokeProvider,
  });

  if (!approveResult.ok) {
    console.error('Failed to approve tokens:', approveResult.error);
    process.exit(1);
  }

  const approvalTxHash: Hash = approveResult.value;
  console.log('Approval tx hash:', approvalTxHash);
  await arbSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash);
  console.log('Approval confirmed');
} else {
  console.log('Approval not needed');
}
console.log('Step 4: Allowance check complete');

// ── Step 5: Create Intent ──────────────────────────────────────────────────────
console.log('\nStep 5: Creating intent on-chain...');

const createIntentResult = await sodax.swaps.createIntent({
  intentParams: createIntentParams,
  spokeProvider: arbSpokeProvider,
});

if (!createIntentResult.ok) {
  console.error('Failed to create intent:', createIntentResult.error);
  process.exit(1);
}

const [spokeTxHash, intent, intentData] = createIntentResult.value;
console.log('Spoke tx hash:', spokeTxHash);
console.log('Intent ID:', intent.intentId.toString());
console.log('Intent creator:', intent.creator);
console.log('Intent data (hex):', intentData);
console.log('Step 5: Intent created on-chain');

// ── Step 6: Build SubmitSwapTxRequest ──────────────────────────────────────────
console.log('\nStep 6: Building submit swap tx request...');

const swapIntentData: SwapIntentData = {
  intentId: intent.intentId.toString(),
  creator: intent.creator,
  inputToken: intent.inputToken,
  outputToken: intent.outputToken,
  inputAmount: intent.inputAmount.toString(),
  minOutputAmount: intent.minOutputAmount.toString(),
  deadline: intent.deadline.toString(),
  allowPartialFill: intent.allowPartialFill,
  srcChain: Number(intent.srcChain),
  dstChain: Number(intent.dstChain),
  srcAddress: intent.srcAddress,
  dstAddress: intent.dstAddress,
  solver: intent.solver,
  data: intent.data,
};

const submitSwapTxRequest: SubmitSwapTxRequest = {
  txHash: spokeTxHash,
  srcChainId: ARBITRUM_MAINNET_CHAIN_ID,
  walletAddress: walletAddress,
  intent: swapIntentData,
  relayData: intentData,
};

console.log('SubmitSwapTxRequest:', JSON.stringify(submitSwapTxRequest, null, 2));
console.log('Step 6: Request built');

// ── Step 7: Submit to Backend ──────────────────────────────────────────────────
console.log('\nStep 7: Submitting swap tx to backend...');

const submitResult = await sodax.backendApi.submitSwapTx(submitSwapTxRequest, { baseURL: baseUrl });
console.log('Submit response:', submitResult);
console.log('Step 7: Swap tx submitted to backend');

// ── Step 8: Poll Status ────────────────────────────────────────────────────────
console.log('\nStep 8: Polling for swap tx status...');

const maxAttempts = 60;
const intervalMs = 5000;
let lastStatus: SubmitSwapTxStatus | null = null;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  const statusResult = await sodax.backendApi.getSubmitSwapTxStatus({
    txHash: spokeTxHash,
    srcChainId: ARBITRUM_MAINNET_CHAIN_ID,
  }, { baseURL: baseUrl });

  const { status, result, failedAtStep, failureReason, failedAttempts } = statusResult.data;

  if (status !== lastStatus) {
    console.log(`[Attempt ${attempt}] Status changed: ${lastStatus ?? 'initial'} → ${status}`);
    console.log(`  failedAttempts: ${failedAttempts}`);
    if (failedAtStep) console.log(`  failedAtStep: ${failedAtStep}`);
    if (failureReason) console.log(`  failureReason: ${failureReason}`);
    lastStatus = status;
  } else {
    console.log(`[Attempt ${attempt}] Status: ${status}`);
  }

  // Terminal: executed
  if (status === 'executed') {
    console.log('\n✅ Swap tx executed successfully!');
    if (result) {
      console.log('Destination intent tx hash:', result.dstIntentTxHash);
      if (result.intent_hash) console.log('Intent hash:', result.intent_hash);
    }
    process.exit(0);
  }

  // Terminal: failed
  if (status === 'failed') {
    console.error('\n❌ Swap tx failed');
    console.error('Failed at step:', failedAtStep);
    console.error('Failure reason:', failureReason);
    console.error('Failed attempts:', failedAttempts);
    process.exit(1);
  }

  await new Promise(resolve => setTimeout(resolve, intervalMs));
}

console.log(`\n⚠️  Status polling reached maximum attempts (${maxAttempts}).`);
console.log(`Last known status: ${lastStatus ?? 'unknown'}`);
console.log(`Spoke tx hash: ${spokeTxHash}`);
process.exit(1);
